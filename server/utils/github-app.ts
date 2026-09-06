const GITHUB_API_ORIGIN = 'https://api.github.com'
export const GITHUB_API_VERSION = '2026-03-10'
const GITHUB_AUTH_TIMEOUT = 15_000
const INSTALLATION_DISCOVERY_TTL = 10 * 60_000
const TOKEN_REFRESH_SKEW = 5 * 60_000
const MIN_WARM_TOKENS = 5
const MAX_ACTIVE_TOKENS = 50
const INSTALLATIONS_PER_PAGE = 100
const MAX_INSTALLATION_PAGES = 100

export type GithubRateResource = 'core' | 'search' | 'graphql'

interface GithubAppConfig {
  appId: string
  privateKey: string
}

interface GithubInstallation {
  id: number
  permissions?: Record<string, string>
  repository_selection?: string
  suspended_at?: string | null
}

interface GithubRepositoryScope {
  id: number
  private: boolean
}

interface GithubInstallationTokenResponse {
  token: string
  expires_at: string
}

interface GithubInstallationRepositoriesResponse {
  total_count?: number
  repositories?: GithubRepositoryScope[]
}

interface RateState {
  limit?: number
  remaining?: number
  resetAt?: number
  cooldownUntil?: number
  inFlight: number
}

interface InstallationState {
  id: number
  selectionOrder: number
  token?: string
  expiresAt: number
  lastIssuedAt: number
  rates: Record<GithubRateResource, RateState>
}

interface BatchState {
  installationId?: number
  remaining: number
  cursor: number
}

export interface GithubTokenLease {
  readonly installationId: number
  readonly resource: GithubRateResource
  readonly token: string
  released: boolean
}

export class GithubTokenPoolError extends Error {
  readonly statusCode: number
  readonly retryAfter?: number

  constructor(message: string, statusCode = 503, retryAfter?: number) {
    super(message)
    this.name = 'GithubTokenPoolError'
    this.statusCode = statusCode
    this.retryAfter = retryAfter
  }
}

const BATCH_SIZES: Record<GithubRateResource, number> = {
  core: 20,
  search: 3,
  graphql: 2,
}

function createRateState(): RateState {
  return { inFlight: 0 }
}

function createInstallationState(id: number): InstallationState {
  return {
    id,
    selectionOrder: Math.random(),
    expiresAt: 0,
    lastIssuedAt: 0,
    rates: {
      core: createRateState(),
      search: createRateState(),
      graphql: createRateState(),
    },
  }
}

function createBatchState(): BatchState {
  return { remaining: 0, cursor: 0 }
}

export class GithubAppTokenPool {
  readonly appId: string
  private readonly privateKey: string
  private readonly installations = new Map<number, InstallationState>()
  private readonly batches: Record<GithubRateResource, BatchState> = {
    core: createBatchState(),
    search: createBatchState(),
    graphql: createBatchState(),
  }

  private lastInstallationDiscovery = 0
  private installationDiscovery?: Promise<void>
  private warming?: Promise<void>
  private readonly tokenRefreshes = new Map<number, Promise<void>>()
  private globalCooldownUntil = 0

  constructor(config: GithubAppConfig) {
    this.appId = config.appId.trim()
    this.privateKey = normalizePrivateKey(config.privateKey)

    if (!/^\d+$/.test(this.appId)) {
      throw new GithubTokenPoolError(
        'A valid NUXT_GITHUB_APP_ID is required; use the numeric GitHub App ID, not the client ID.',
      )
    }
    if (!this.privateKey.includes('BEGIN') || !this.privateKey.includes('PRIVATE KEY')) {
      throw new GithubTokenPoolError(
        'A valid NUXT_GITHUB_APP_PRIVATE_KEY is required; use the PEM private key downloaded from GitHub.',
      )
    }
  }

  matches(config: GithubAppConfig) {
    return (
      this.appId === config.appId.trim() &&
      this.privateKey === normalizePrivateKey(config.privateKey)
    )
  }

  async acquire(resource: GithubRateResource): Promise<GithubTokenLease> {
    const now = Date.now()
    if (this.globalCooldownUntil > now) {
      const retryAfter = Math.max(1, Math.ceil((this.globalCooldownUntil - now) / 1000))
      throw new GithubTokenPoolError('GitHub secondary rate limiting is in effect; try again later.', 429, retryAfter)
    }

    await this.ensureReady()

    let installation = this.pickInstallation(resource)
    if (!installation && this.countActiveTokens() < MAX_ACTIVE_TOKENS) {
      await this.activateInstallations(1)
      installation = this.pickInstallation(resource)
    }

    if (!installation?.token) {
      const resetAt = this.findSoonestReset(resource)
      const retryAfter = resetAt
        ? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
        : 60
      throw new GithubTokenPoolError(
        'No GitHub App installation access token is currently available; wait for the rate limit to reset or install another app instance.',
        429,
        retryAfter,
      )
    }

    installation.rates[resource].inFlight += 1
    return {
      installationId: installation.id,
      resource,
      token: installation.token,
      released: false,
    }
  }

  release(lease: GithubTokenLease, response?: Response) {
    if (lease.released) {
      return
    }
    lease.released = true

    const installation = this.installations.get(lease.installationId)
    if (!installation) {
      return
    }

    const leasedState = installation.rates[lease.resource]
    leasedState.inFlight = Math.max(0, leasedState.inFlight - 1)

    if (!response) {
      return
    }

    const actualResource = parseRateResource(response.headers.get('x-ratelimit-resource'))
    const state = installation.rates[actualResource || lease.resource]
    this.updateRateState(state, response.headers)

    if (response.status === 401) {
      installation.token = undefined
      installation.expiresAt = 0
      this.endBatchFor(installation.id)
      return
    }

    if (response.status !== 403 && response.status !== 429) {
      return
    }

    const now = Date.now()
    if (state.remaining === 0 && state.resetAt && state.resetAt > now) {
      state.cooldownUntil = state.resetAt
      this.endBatchFor(installation.id)
      return
    }

    const retryAt = parseRetryAfter(response.headers.get('retry-after'), now)
    if (retryAt) {
      this.globalCooldownUntil = Math.max(this.globalCooldownUntil, retryAt)
      this.endAllBatches()
    }
  }

  private async ensureReady() {
    await this.discoverInstallations()

    if (!this.warming) {
      this.warming = this.warmTokens().finally(() => {
        this.warming = undefined
      })
    }
    await this.warming
  }

  private async warmTokens() {
    const now = Date.now()
    const expiring = [...this.installations.values()].filter(
      installation =>
        installation.token && installation.expiresAt <= now + TOKEN_REFRESH_SKEW,
    )

    let replacementCount = 0
    if (expiring.length > 0 && this.countActiveTokens() < MAX_ACTIVE_TOKENS) {
      const expiringIds = new Set(expiring.map(installation => installation.id))
      try {
        const replacements = await this.activateInstallations(expiring.length, expiringIds)
        replacementCount = Math.min(replacements.length, expiring.length)
      } catch {
        // If the current token is still valid, a failed replacement installation must not interrupt the service.
      }
    }

    for (const installation of expiring.slice(0, replacementCount)) {
      installation.token = undefined
      installation.expiresAt = 0
      this.endBatchFor(installation.id)
    }
    await Promise.allSettled(
      expiring.slice(replacementCount).map(installation => this.refreshToken(installation)),
    )

    const usableCount = [...this.installations.values()].filter(installation =>
      this.hasUsableToken(installation, now),
    ).length
    if (usableCount < MIN_WARM_TOKENS) {
      await this.activateInstallations(MIN_WARM_TOKENS - usableCount)
    }

    if (![...this.installations.values()].some(installation => this.hasUsableToken(installation))) {
      throw new GithubTokenPoolError(
        'The GitHub App has no available installations. Keep only the metadata permission and select exactly one public repository.',
      )
    }
  }

  private async discoverInstallations(force = false) {
    const now = Date.now()
    if (
      !force &&
      this.installations.size > 0 &&
      now - this.lastInstallationDiscovery < INSTALLATION_DISCOVERY_TTL
    ) {
      return
    }
    if (this.installationDiscovery) {
      return this.installationDiscovery
    }

    this.installationDiscovery = this.performInstallationDiscovery().finally(() => {
      this.installationDiscovery = undefined
    })
    return this.installationDiscovery
  }

  private async performInstallationDiscovery() {
    const jwt = await createAppJwt(this.appId, this.privateKey)
    const discovered: GithubInstallation[] = []

    for (let page = 1; page <= MAX_INSTALLATION_PAGES; page += 1) {
      const response = await fetchGithubAuth(
        `${GITHUB_API_ORIGIN}/app/installations?per_page=${INSTALLATIONS_PER_PAGE}&page=${page}`,
        { headers: createAppHeaders(jwt) },
      )
      if (!response.ok) {
        throw await createGithubApiError(response, 'Unable to read the GitHub App installation list')
      }

      const installations = (await response.json()) as GithubInstallation[]
      if (!Array.isArray(installations)) {
        throw new GithubTokenPoolError('GitHub returned an unrecognized app installation list.', 502)
      }
      discovered.push(...installations)
      if (installations.length < INSTALLATIONS_PER_PAGE) {
        break
      }
      if (page === MAX_INSTALLATION_PAGES) {
        throw new GithubTokenPoolError('The number of GitHub App installations exceeds the safe read limit for this service.', 503)
      }
    }

    const safeIds = new Set(
      discovered
        .filter(installation => !installation.suspended_at)
        .filter(installation => hasOnlyMetadataReadPermission(installation.permissions))
        .filter(installation => installation.repository_selection === 'selected')
        .map(installation => installation.id),
    )

    for (const id of this.installations.keys()) {
      if (!safeIds.has(id)) {
        this.installations.delete(id)
        this.endBatchFor(id)
      }
    }
    for (const id of safeIds) {
      if (!this.installations.has(id)) {
        this.installations.set(id, createInstallationState(id))
      }
    }

    this.lastInstallationDiscovery = Date.now()
    if (this.installations.size === 0) {
      throw new GithubTokenPoolError(
        'No safe GitHub App installation was found. Set every configurable permission to "No access" and select exactly one public repository.',
      )
    }
  }

  private async activateInstallations(count: number, excludedIds = new Set<number>()) {
    if (count <= 0) {
      return []
    }

    const now = Date.now()
    const candidates = [...this.installations.values()]
      .filter(installation => !this.hasUsableToken(installation, now))
      .filter(installation => !excludedIds.has(installation.id))
      .sort(
        (first, second) =>
          first.lastIssuedAt - second.lastIssuedAt ||
          first.selectionOrder - second.selectionOrder,
      )
      .slice(0, Math.min(count, MAX_ACTIVE_TOKENS - this.countActiveTokens()))

    const results = await Promise.allSettled(
      candidates.map(installation => this.refreshToken(installation)),
    )
    if (candidates.length > 0 && results.every(result => result.status === 'rejected')) {
      const firstFailure = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )?.reason
      if (firstFailure instanceof GithubTokenPoolError) {
        throw firstFailure
      }
      throw new GithubTokenPoolError('Unable to generate a GitHub App installation access token.', 503)
    }
    return candidates
      .filter((_, index) => results[index]?.status === 'fulfilled')
      .map(installation => installation.id)
  }

  private refreshToken(installation: InstallationState) {
    const existing = this.tokenRefreshes.get(installation.id)
    if (existing) {
      return existing
    }

    const refresh = this.performTokenRefresh(installation).finally(() => {
      this.tokenRefreshes.delete(installation.id)
    })
    this.tokenRefreshes.set(installation.id, refresh)
    return refresh
  }

  private async performTokenRefresh(installation: InstallationState) {
    const jwt = await createAppJwt(this.appId, this.privateKey)
    const bootstrapResponse = await fetchGithubAuth(
      `${GITHUB_API_ORIGIN}/app/installations/${installation.id}/access_tokens`,
      {
        method: 'POST',
        headers: {
          ...createAppHeaders(jwt),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: { metadata: 'read' } }),
      },
    )
    if (!bootstrapResponse.ok) {
      throw await createGithubApiError(
        bootstrapResponse,
        `Unable to generate a verification token for installation ${installation.id}`,
      )
    }

    const bootstrap = (await bootstrapResponse.json()) as GithubInstallationTokenResponse
    if (!bootstrap.token) {
      throw new GithubTokenPoolError(`Installation ${installation.id} returned a verification token with an invalid format.`, 502)
    }

    let unacceptedToken: string | undefined
    try {
      const publicRepository = await getSinglePublicRepository(
        bootstrap.token,
        installation.id,
      )
      if (!publicRepository) {
        throw new GithubTokenPoolError(
          `Installation ${installation.id} must select exactly one public repository.`,
          503,
        )
      }

      const response = await fetchGithubAuth(
        `${GITHUB_API_ORIGIN}/app/installations/${installation.id}/access_tokens`,
        {
          method: 'POST',
          headers: {
            ...createAppHeaders(jwt),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repository_ids: [publicRepository.id],
            permissions: { metadata: 'read' },
          }),
        },
      )
      if (!response.ok) {
        throw await createGithubApiError(response, `Unable to generate a token for installation ${installation.id}`)
      }

      const result = (await response.json()) as GithubInstallationTokenResponse
      unacceptedToken = result.token
      if (!result.token || !result.expires_at) {
        throw new GithubTokenPoolError(
          `Installation ${installation.id} returned an installation access token with an invalid format.`,
          502,
        )
      }

      const scopedRepository = await getSinglePublicRepository(result.token, installation.id)
      if (scopedRepository?.id !== publicRepository.id) {
        throw new GithubTokenPoolError(
          `Installation ${installation.id} returned a token with an unsafe scope or permission set; it was rejected from the token pool.`,
          503,
        )
      }

      const expiresAt = Date.parse(result.expires_at)
      if (!Number.isFinite(expiresAt)) {
        throw new GithubTokenPoolError(`Installation ${installation.id} returned an invalid token expiration time.`, 502)
      }

      installation.token = result.token
      installation.expiresAt = expiresAt
      installation.lastIssuedAt = Date.now()
      unacceptedToken = undefined
    } finally {
      if (unacceptedToken) {
        await revokeInstallationToken(unacceptedToken)
      }
      await revokeInstallationToken(bootstrap.token)
    }
  }

  private pickInstallation(resource: GithubRateResource) {
    const now = Date.now()
    const active = [...this.installations.values()]
      .filter(installation => this.hasUsableToken(installation, now))
      .sort((first, second) => first.id - second.id)
    if (active.length === 0) {
      return undefined
    }

    const batch = this.batches[resource]
    const current = batch.installationId
      ? this.installations.get(batch.installationId)
      : undefined
    if (current && batch.remaining > 0 && this.isResourceUsable(current, resource, now)) {
      batch.remaining -= 1
      return current
    }

    for (let offset = 0; offset < active.length; offset += 1) {
      const index = (batch.cursor + offset) % active.length
      const installation = active[index]
      if (!installation || !this.isResourceUsable(installation, resource, now)) {
        continue
      }

      const state = installation.rates[resource]
      const available =
        state.remaining === undefined
          ? BATCH_SIZES[resource]
          : Math.max(1, state.remaining - state.inFlight)
      batch.installationId = installation.id
      batch.remaining = Math.min(BATCH_SIZES[resource], available) - 1
      batch.cursor = (index + 1) % active.length
      return installation
    }

    batch.installationId = undefined
    batch.remaining = 0
    return undefined
  }

  private isResourceUsable(
    installation: InstallationState,
    resource: GithubRateResource,
    now: number,
  ) {
    if (!this.hasUsableToken(installation, now)) {
      return false
    }

    const state = installation.rates[resource]
    this.clearExpiredRateState(state, now)
    if (state.cooldownUntil && state.cooldownUntil > now) {
      return false
    }
    return state.remaining === undefined || state.remaining - state.inFlight > 0
  }

  private hasUsableToken(installation: InstallationState, now = Date.now()) {
    return Boolean(installation.token && installation.expiresAt > now + 30_000)
  }

  private updateRateState(state: RateState, headers: Headers) {
    const limit = parseIntegerHeader(headers.get('x-ratelimit-limit'))
    const remaining = parseIntegerHeader(headers.get('x-ratelimit-remaining'))
    const resetSeconds = parseIntegerHeader(headers.get('x-ratelimit-reset'))
    const resetAt = resetSeconds === undefined ? undefined : resetSeconds * 1000
    const now = Date.now()

    if (resetAt !== undefined && resetAt <= now) {
      return
    }
    if (resetAt === undefined) {
      if (limit !== undefined) state.limit = limit
      if (remaining !== undefined) state.remaining = remaining
      return
    }

    if (state.resetAt === undefined || resetAt > state.resetAt) {
      state.limit = limit
      state.remaining = remaining
      state.resetAt = resetAt
      state.cooldownUntil = undefined
      return
    }
    if (resetAt === state.resetAt) {
      if (limit !== undefined) state.limit = limit
      if (remaining !== undefined) {
        state.remaining =
          state.remaining === undefined ? remaining : Math.min(state.remaining, remaining)
      }
    }
  }

  private clearExpiredRateState(state: RateState, now: number) {
    if (!state.resetAt || state.resetAt > now) {
      return
    }
    state.limit = undefined
    state.remaining = undefined
    state.resetAt = undefined
    state.cooldownUntil = undefined
  }

  private findSoonestReset(resource: GithubRateResource) {
    const now = Date.now()
    const resets = [...this.installations.values()]
      .map(installation => installation.rates[resource])
      .map(state => state.cooldownUntil || state.resetAt)
      .filter((value): value is number => Boolean(value && value > now))
    return resets.length > 0 ? Math.min(...resets) : undefined
  }

  private countActiveTokens() {
    const now = Date.now()
    return [...this.installations.values()].filter(installation =>
      this.hasUsableToken(installation, now),
    ).length
  }

  private endBatchFor(installationId: number) {
    for (const batch of Object.values(this.batches)) {
      if (batch.installationId === installationId) {
        batch.installationId = undefined
        batch.remaining = 0
      }
    }
  }

  private endAllBatches() {
    for (const batch of Object.values(this.batches)) {
      batch.installationId = undefined
      batch.remaining = 0
    }
  }
}

let sharedPool: GithubAppTokenPool | undefined

export function getGithubAppTokenPool(config: GithubAppConfig) {
  if (!sharedPool?.matches(config)) {
    sharedPool = new GithubAppTokenPool(config)
  }
  return sharedPool
}

function createAppHeaders(jwt: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${jwt}`,
    'User-Agent': 'anymeta',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  }
}

async function fetchGithubAuth(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GITHUB_AUTH_TIMEOUT)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch {
    throw new GithubTokenPoolError('Unable to connect to the GitHub App authentication API.', 503)
  } finally {
    clearTimeout(timeout)
  }
}

async function revokeInstallationToken(token: string) {
  try {
    const response = await fetchGithubAuth(`${GITHUB_API_ORIGIN}/installation/token`, {
      method: 'DELETE',
      headers: createAppHeaders(token),
    })
    await response.body?.cancel()
  } catch {
    // A verification token expires automatically within one hour even if revocation fails, and it is never added to the shared pool.
  }
}

async function getSinglePublicRepository(token: string, installationId: number) {
  const response = await fetchGithubAuth(
    `${GITHUB_API_ORIGIN}/installation/repositories?per_page=2`,
    { headers: createAppHeaders(token) },
  )
  if (!response.ok) {
    throw await createGithubApiError(
      response,
      `Unable to verify the repository scope for installation ${installationId}`,
    )
  }

  let result: GithubInstallationRepositoriesResponse
  try {
    result = (await response.json()) as GithubInstallationRepositoriesResponse
  } catch {
    throw new GithubTokenPoolError(
      `Installation ${installationId} returned an unrecognized repository list.`,
      502,
    )
  }
  if (result.total_count !== 1 || result.repositories?.length !== 1) {
    return undefined
  }
  const repository = result.repositories[0]
  if (!repository || !Number.isSafeInteger(repository.id) || repository.id <= 0) {
    return undefined
  }
  return repository.private === false ? repository : undefined
}

function hasOnlyMetadataReadPermission(permissions?: Record<string, string>) {
  const entries = Object.entries(permissions || {})
  return entries.length === 1 && entries[0]?.[0] === 'metadata' && entries[0][1] === 'read'
}

function parseRateResource(value: string | null): GithubRateResource | undefined {
  if (value === 'core' || value === 'search' || value === 'graphql') {
    return value
  }
  return undefined
}

function parseIntegerHeader(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined
  }
  return Number.parseInt(value, 10)
}

function parseRetryAfter(value: string | null, now: number) {
  if (!value) {
    return undefined
  }
  if (/^\d+$/.test(value)) {
    return now + Number.parseInt(value, 10) * 1000
  }
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp > now ? timestamp : undefined
}

async function createGithubApiError(response: Response, prefix: string) {
  let detail = ''
  try {
    const body = (await response.json()) as { message?: string }
    if (body.message) {
      detail = `: ${body.message}`
    }
  } catch {
    // GitHub's non-JSON error response contains no details that can be safely displayed.
  }
  return new GithubTokenPoolError(`${prefix} (${response.status})${detail}`, 503)
}

function normalizePrivateKey(value: string) {
  return value.trim().replace(/\\n/g, '\n')
}

async function createAppJwt(appId: string, privateKey: string) {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    )
    const payload = base64UrlEncode(
      new TextEncoder().encode(
        JSON.stringify({
          iat: now - 60,
          exp: now + 9 * 60,
          iss: appId,
        }),
      ),
    )
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToPkcs8(privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(`${header}.${payload}`),
    )
    return `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`
  } catch {
    throw new GithubTokenPoolError(
      'Unable to sign a JWT with NUXT_GITHUB_APP_PRIVATE_KEY; check that the PEM private key is complete.',
      503,
    )
  }
}

function pemToPkcs8(pem: string) {
  const isPkcs1 = pem.includes('BEGIN RSA PRIVATE KEY')
  const base64 = pem
    .replace(/-----BEGIN [\w ]+-----/, '')
    .replace(/-----END [\w ]+-----/, '')
    .replace(/\s/g, '')
  const der = base64Decode(base64)
  return isPkcs1 ? wrapPkcs1AsPkcs8(der) : (der.buffer as ArrayBuffer)
}

function wrapPkcs1AsPkcs8(pkcs1: Uint8Array) {
  const version = new Uint8Array([0x02, 0x01, 0x00])
  const rsaAlgorithmIdentifier = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05,
    0x00,
  ])
  const privateKey = asn1Wrap(0x04, pkcs1)
  const pkcs8 = asn1Wrap(0x30, concatBytes(version, rsaAlgorithmIdentifier, privateKey))
  return pkcs8.buffer as ArrayBuffer
}

function asn1Wrap(tag: number, content: Uint8Array) {
  const length = asn1Length(content.length)
  return concatBytes(new Uint8Array([tag]), length, content)
}

function asn1Length(length: number) {
  if (length < 0x80) return new Uint8Array([length])
  if (length < 0x100) return new Uint8Array([0x81, length])
  if (length < 0x10000) return new Uint8Array([0x82, length >> 8, length & 0xff])
  return new Uint8Array([0x83, length >> 16, (length >> 8) & 0xff, length & 0xff])
}

function concatBytes(...arrays: Uint8Array[]) {
  const result = new Uint8Array(arrays.reduce((total, value) => total + value.length, 0))
  let offset = 0
  for (const value of arrays) {
    result.set(value, offset)
    offset += value.length
  }
  return result
}

function base64Decode(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function base64UrlEncode(value: Uint8Array) {
  let binary = ''
  for (const byte of value) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
