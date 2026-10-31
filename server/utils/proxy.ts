import {
  createError,
  getMethod,
  getRequestHeader,
  getRequestURL,
  getRouterParam,
  sendWebResponse,
  setResponseHeader,
  type H3Event,
} from 'h3'
import { proxyConfig } from '#server/utils/config'
import {
  getGithubAppTokenPool,
  GITHUB_API_VERSION,
  GithubTokenPoolError,
  type GithubRateResource,
} from '#server/utils/github-app'
import { createGraphqlValidator } from '#server/utils/graphql'

const cachedGithubRequest = createCachedProxyRequest(
  `${proxyConfig.github.name}Proxy`,
  proxyConfig.github.maxAge,
)

export const validateGithubGraphqlBody = createGraphqlValidator(proxyConfig.github.graphql)

interface GithubProxyRequest {
  path: string
  resource: GithubRateResource
  method?: 'GET' | 'POST'
  body?: string
  contentType?: string
  accept?: string
}

export async function proxyGithubRequest(event: H3Event, request: GithubProxyRequest) {
  const method = getMethod(event).toUpperCase()
  const expectedMethod = request.method ?? 'GET'
  const allowsHead = expectedMethod === 'GET'
  if (method !== expectedMethod && !(allowsHead && method === 'HEAD')) {
    setResponseHeader(
      event,
      'Allow',
      allowsHead ? 'GET, HEAD, OPTIONS' : `${expectedMethod}, OPTIONS`,
    )
    throw createError({
      statusCode: 405,
      message: 'This GitHub proxy endpoint does not accept the current request method.',
    })
  }

  const config = useRuntimeConfig(event)
  let pool: ReturnType<typeof getGithubAppTokenPool>
  try {
    pool = getGithubAppTokenPool({
      appId: String(config.githubAppId || ''),
      privateKey: String(config.githubAppPrivateKey || ''),
    })
  } catch (error) {
    throwGithubTokenPoolError(event, error)
  }

  const requestUrl = getRequestURL(event)
  const upstreamUrl = new URL(`/${request.path}`, proxyConfig.github.origin)
  upstreamUrl.search = requestUrl.search

  const response = await cachedGithubRequest(
    event,
    JSON.stringify([
      config.githubAppId,
      upstreamUrl.href,
      request.accept || proxyConfig.github.accept,
    ]),
    async () => {
      for (let attempt = 1; attempt <= proxyConfig.github.maxAuthAttempts; attempt += 1) {
        const lease = await pool.acquire(request.resource)

        let upstreamResponse: Response
        try {
          upstreamResponse = await fetchGithubWithTimeout(upstreamUrl, {
            method,
            headers: createGithubHeaders(event, lease.token, request.contentType, request.accept),
            body: request.body,
          })
        } catch (error) {
          pool.release(lease)
          throw createError({
            statusCode: 502,
            message: 'Unable to connect to the GitHub upstream API.',
            cause: error,
          })
        }

        pool.release(lease, upstreamResponse)
        if (upstreamResponse.status === 401 && attempt < proxyConfig.github.maxAuthAttempts) {
          await upstreamResponse.body?.cancel()
          continue
        }

        return upstreamResponse
      }

      throw createError({
        statusCode: 502,
        message: 'GitHub upstream authentication failed repeatedly.',
      })
    },
  ).catch((error) => throwGithubTokenPoolError(event, error))
  return sendWebResponse(
    event,
    createProxyResponse(response, proxyConfig.github.responseHeaders, method),
  )
}

export function getGithubRepositoryPath(event: H3Event, suffix?: string) {
  const owner = readGithubPathSegment(event, 'owner', 'repository owner')
  const repo = readGithubPathSegment(event, 'repo', 'repository name')
  return `repos/${owner}/${repo}${suffix ? `/${suffix}` : ''}`
}

export function getGithubOrganizationPath(event: H3Event, suffix?: string) {
  const org = readGithubPathSegment(event, 'org', 'organization name')
  return `orgs/${org}${suffix ? `/${suffix}` : ''}`
}

export function getGithubUserPath(event: H3Event, suffix?: string) {
  const username = readGithubPathSegment(event, 'username', 'username')
  return `users/${username}${suffix ? `/${suffix}` : ''}`
}

export function getGithubRepositoryItemPath(
  event: H3Event,
  resource: 'issues' | 'pulls',
  suffix?: string,
) {
  const name = resource === 'issues' ? 'issue_number' : 'pull_number'
  const number = readGithubPathSegment(event, name, name)
  if (!/^[1-9]\d*$/.test(number)) {
    throw createError({ statusCode: 400, message: `${name} must be a positive integer.` })
  }
  return getGithubRepositoryPath(event, `${resource}/${number}${suffix ? `/${suffix}` : ''}`)
}

export function getGithubRepositoryRefPath(event: H3Event, resource: 'commits' | 'releases/tags') {
  const name = resource === 'commits' ? 'ref' : 'tag'
  const ref = readGithubPathSegment(event, name, name, true)
  return getGithubRepositoryPath(event, `${resource}/${ref}`)
}

export function getGithubRepositoryContentPath(event: H3Event) {
  if (getRouterParam(event, 'path') === undefined) {
    return getGithubRepositoryPath(event, 'contents')
  }
  const path = readGithubPathSegment(event, 'path', 'repository content path', true)
  return getGithubRepositoryPath(event, `contents/${path.replace(/%2F/gi, '/')}`)
}

function readGithubPathSegment(event: H3Event, name: string, label: string, allowSlash = false) {
  const decoded = readRouteParam(event, name, `${label} contains invalid encoding.`)
  if (
    !decoded ||
    decoded.length > (allowSlash ? 4096 : 100) ||
    decoded.split('/').some((segment) => !segment || segment === '.' || segment === '..') ||
    (!allowSlash && decoded.includes('/')) ||
    /[\\\u0000-\u001f\u007f]/.test(decoded)
  ) {
    throw createError({ statusCode: 400, message: `${label} is invalid.` })
  }
  return encodeURIComponent(decoded)
}

function createGithubHeaders(
  event: H3Event,
  token: string,
  contentType?: string,
  accept?: string,
) {
  const headers = new Headers({
    Accept: accept || proxyConfig.github.accept,
    Authorization: `Bearer ${token}`,
    'User-Agent': proxyConfig.github.userAgent,
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  })
  if (contentType) {
    headers.set('Content-Type', contentType)
  }

  for (const name of ['if-none-match', 'if-modified-since']) {
    const value = getRequestHeader(event, name)
    if (value) {
      headers.set(name, value)
    }
  }
  return headers
}

async function fetchGithubWithTimeout(url: URL, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), proxyConfig.timeout)
  const method = (init.method || 'GET').toUpperCase()
  let upstreamUrl = url
  let redirects = 0
  try {
    while (true) {
      const response = await fetch(upstreamUrl, {
        ...init,
        redirect: 'manual',
        signal: controller.signal,
      })
      const location = response.headers.get('location')
      if (
        !proxyConfig.github.redirectStatuses.has(response.status) ||
        !location ||
        (method !== 'GET' && method !== 'HEAD')
      ) {
        return response
      }

      let target: URL
      try {
        target = new URL(location, upstreamUrl)
      } catch {
        return response
      }
      if (target.origin !== proxyConfig.github.origin || target.username || target.password) {
        return response
      }

      await response.body?.cancel()
      if (redirects >= proxyConfig.github.maxRedirects) {
        throw new Error('The GitHub upstream redirect limit was exceeded.')
      }
      upstreamUrl = target
      redirects += 1
    }
  } finally {
    clearTimeout(timeout)
  }
}

function throwGithubTokenPoolError(event: H3Event, error: unknown): never {
  if (!(error instanceof GithubTokenPoolError)) {
    throw error
  }
  if (error.retryAfter) {
    setResponseHeader(event, 'Retry-After', error.retryAfter)
  }
  throw createError({ statusCode: error.statusCode, message: error.message })
}

const proxyNpmjs = createReadOnlyProxy(proxyConfig.npmjs)

export function proxyNpmjsRequest(
  event: H3Event,
  path: string,
  upstream: keyof typeof proxyConfig.npmjs.origins = 'api',
) {
  return proxyNpmjs(event, {
    path,
    origin: proxyConfig.npmjs.origins[upstream],
    accept: getRequestHeader(event, 'accept'),
  })
}

export function getNpmjsPackagePath(event: H3Event) {
  const name = readRouteParam(event, 'package')
  validateNpmjsPackageName(name)
  return encodeURIComponent(name)
}

export function getNpmjsPackageVersionPath(event: H3Event) {
  const packagePath = getNpmjsPackagePath(event)
  const version = readRouteParam(event, 'version')
  if (
    !version ||
    version.length > 100 ||
    /[\\/\u0000-\u001f\u007f]/.test(version) ||
    version === '.' ||
    version === '..'
  ) {
    throw createError({ statusCode: 400, message: 'The npm package version or tag is invalid.' })
  }
  return `${packagePath}/${encodeURIComponent(version)}`
}

export function getNpmjsDownloadsPath(event: H3Event, kind: 'point' | 'range') {
  const period = readRouteParam(event, 'period')
  if (
    !period ||
    period.length > 100 ||
    /[\\/\u0000-\u001f\u007f]/.test(period) ||
    period === '.' ||
    period === '..'
  ) {
    throw createError({ statusCode: 400, message: 'The download statistics period is invalid.' })
  }
  const path = `downloads/${kind}/${encodeURIComponent(period)}`
  if (getRouterParam(event, 'package') === undefined) return path

  const packages = readRouteParam(event, 'package').split(',')
  for (const name of packages) validateNpmjsPackageName(name)
  if (
    packages.length > 128 ||
    (packages.length > 1 && packages.some((name) => name.startsWith('@')))
  ) {
    throw createError({
      statusCode: 400,
      message: 'Bulk download statistics support at most 128 unscoped packages.',
    })
  }

  const packagePath = packages
    .map((name) => name.split('/').map(encodeURIComponent).join('/'))
    .join(',')
  return `${path}/${packagePath}`
}

function validateNpmjsPackageName(name: string) {
  if (
    !name ||
    name.length > 214 ||
    !/^(?:@[^/@]+\/)?[^/@]+$/.test(name) ||
    /[\\\s\u0000-\u001f\u007f?#,%]/.test(name) ||
    name.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw createError({ statusCode: 400, message: 'The npm package name is invalid.' })
  }
}

export const proxyCratesRequest = createReadOnlyProxy(proxyConfig.crates)

export function getCratesPackagePath(event: H3Event, suffix?: string) {
  const name = readRouteSegment(event, 'name', 100)
  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw createError({ statusCode: 400, message: 'The crate name is invalid.' })
  }
  return `api/v1/crates/${encodeURIComponent(name)}${suffix ? `/${suffix}` : ''}`
}

export function getCratesVersionPath(event: H3Event, suffix?: string) {
  const version = readRouteSegment(event, 'version', 256)
  return `${getCratesPackagePath(event)}/${encodeURIComponent(version)}${suffix ? `/${suffix}` : ''}`
}

export function getCratesTaxonomyPath(event: H3Event, resource: 'categories' | 'keywords') {
  const name = readRouteSegment(event, resource === 'categories' ? 'category' : 'keyword', 256)
  return `api/v1/${resource}/${encodeURIComponent(name)}`
}

export const proxyPypiRequest = createReadOnlyProxy(proxyConfig.pypi)

export function getPypiProjectPath(
  event: H3Event,
  resource: 'project' | 'release' | 'index' | 'provenance' | 'feed',
) {
  const name = readRouteSegment(event, 'project', 512)
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/.test(name)) {
    throw createError({ statusCode: 400, message: 'The PyPI project name is invalid.' })
  }
  const project = name.toLowerCase().replace(/[-_.]+/g, '-')
  if (resource === 'project') return `pypi/${project}/json`
  if (resource === 'index') return `simple/${project}/`
  if (resource === 'feed') return `rss/project/${project}/releases.xml`

  const version = encodeURIComponent(readRouteSegment(event, 'version', 256))
  if (resource === 'release') return `pypi/${project}/${version}/json`
  const filename = encodeURIComponent(readRouteSegment(event, 'filename', 1024))
  return `integrity/${project}/${version}/${filename}/provenance`
}

export const validateOpenCollectiveGraphqlBody = createGraphqlValidator(
  proxyConfig.openCollective.graphql,
)

export async function proxyOpenCollectiveGraphql(event: H3Event, body: string) {
  const config = useRuntimeConfig(event)
  const token = String(config.openCollectiveToken || '').trim()
  const headers = new Headers(proxyConfig.openCollective.headers)
  if (token) {
    headers.set('Personal-Token', token)
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetchOpenCollectiveWithTimeout(proxyConfig.openCollective.url, {
      method: 'POST',
      headers,
      body,
    })
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: 'Unable to connect to the OpenCollective upstream API.',
      cause: error,
    })
  }

  return sendWebResponse(
    event,
    createProxyResponse(upstreamResponse, proxyConfig.openCollective.responseHeaders),
  )
}

async function fetchOpenCollectiveWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), proxyConfig.timeout)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

interface ReadOnlyProxyOptions {
  name: string
  origin: string
  maxAge: number
  userAgent: string
  responseHeaders: readonly string[]
  cacheHeaders?: readonly string[]
}

interface ReadOnlyProxyRequest {
  path: string
  origin?: string
  accept?: string
  contentType?: string
}

function createReadOnlyProxy(options: ReadOnlyProxyOptions) {
  const cachedRequest = createCachedProxyRequest(`${options.name}Proxy`, options.maxAge)
  const responseHeaders = new Set(options.responseHeaders)
  const cacheHeaders = options.cacheHeaders ?? ['accept']

  return async (event: H3Event, request: ReadOnlyProxyRequest) => {
    const method = getMethod(event).toUpperCase()
    if (method !== 'GET' && method !== 'HEAD') {
      setResponseHeader(event, 'Allow', 'GET, HEAD, OPTIONS')
      throw createError({
        statusCode: 405,
        message: `This ${options.name} proxy endpoint accepts read-only requests only.`,
      })
    }

    const url = new URL(`/${request.path}`, request.origin ?? options.origin)
    url.search = getRequestURL(event).search
    const headers = new Headers({
      Accept: request.accept || proxyConfig.accept,
      'User-Agent': options.userAgent,
    })
    if (request.contentType) headers.set('Content-Type', request.contentType)
    for (const name of ['if-none-match', 'if-modified-since']) {
      const value = getRequestHeader(event, name)
      if (value) headers.set(name, value)
    }

    let response: Response
    try {
      response = await cachedRequest(
        event,
        JSON.stringify([url.href, ...cacheHeaders.map((name) => headers.get(name))]),
        () =>
          fetch(url, {
            method,
            headers,
            redirect: 'manual',
            signal: AbortSignal.timeout(proxyConfig.timeout),
          }),
      )
    } catch (error) {
      throw createError({
        statusCode: 502,
        message: `Unable to connect to the ${options.name} upstream API.`,
        cause: error,
      })
    }

    return sendWebResponse(event, createProxyResponse(response, responseHeaders, method))
  }
}

function createProxyResponse(
  response: Response,
  allowedHeaders: ReadonlySet<string>,
  method?: string,
) {
  const headers = new Headers()
  for (const [name, value] of response.headers) {
    if (allowedHeaders.has(name.toLowerCase())) headers.set(name, value)
  }
  const mustNotHaveBody = method === 'HEAD' || [204, 205, 304].includes(response.status)
  return new Response(mustNotHaveBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function readRouteParam(
  event: H3Event,
  name: string,
  errorMessage = 'A route parameter contains invalid encoding.',
) {
  try {
    return decodeURIComponent(getRouterParam(event, name) || '')
  } catch {
    throw createError({ statusCode: 400, message: errorMessage })
  }
}

function readRouteSegment(event: H3Event, name: string, maxLength: number) {
  const value = readRouteParam(event, name)
  if (
    !value ||
    value.length > maxLength ||
    value === '.' ||
    value === '..' ||
    /[\\/\u0000-\u001f\u007f]/.test(value)
  ) {
    throw createError({ statusCode: 400, message: `The ${name} parameter is invalid.` })
  }
  return value
}

function createCachedProxyRequest(name: string, maxAge: number) {
  const cached = defineCachedFunction(
    async (_event: H3Event, _key: string, load: () => Promise<Response>) => {
      const response = await load()
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers),
        body: await response.text(),
      }
    },
    {
      name,
      maxAge,
      swr: true,
      getKey: async (_event: H3Event, key: string) => {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
        return Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('')
      },
      shouldBypassCache: (event) =>
        getMethod(event) !== 'GET' ||
        Boolean(
          getRequestHeader(event, 'if-none-match') || getRequestHeader(event, 'if-modified-since'),
        ),
      validate: (entry) => entry.value?.status === 200,
    },
  )

  return async (event: H3Event, key: string, load: () => Promise<Response>) => {
    const response = await cached(event, key, load)
    return new Response([204, 205, 304].includes(response.status) ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }
}
