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
import {
  getGithubAppTokenPool,
  GITHUB_API_VERSION,
  GithubTokenPoolError,
  type GithubRateResource,
} from '#server/utils/github-app'
import { createCachedProxyRequest } from '#server/utils/proxy-cache'

const GITHUB_API_ORIGIN = 'https://api.github.com'
const UPSTREAM_TIMEOUT = 15_000
const MAX_AUTH_ATTEMPTS = 2
const MAX_UPSTREAM_REDIRECTS = 5
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const cachedGithubRequest = createCachedProxyRequest('githubProxy', 5 * 60)

const FORWARDED_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-type',
  'etag',
  'last-modified',
  'link',
  'location',
  'retry-after',
  'vary',
  'x-github-media-type',
  'x-github-request-id',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'x-ratelimit-resource',
  'x-ratelimit-used',
])

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
    throwTokenPoolError(event, error)
  }

  const requestUrl = getRequestURL(event)
  const upstreamUrl = new URL(`/${request.path}`, GITHUB_API_ORIGIN)
  upstreamUrl.search = requestUrl.search

  const response = await cachedGithubRequest(
    event,
    JSON.stringify([
      config.githubAppId,
      upstreamUrl.href,
      request.accept || 'application/vnd.github+json',
    ]),
    async () => {
      for (let attempt = 1; attempt <= MAX_AUTH_ATTEMPTS; attempt += 1) {
        const lease = await pool.acquire(request.resource)

        let upstreamResponse: Response
        try {
          upstreamResponse = await fetchWithTimeout(upstreamUrl, {
            method,
            headers: createUpstreamHeaders(event, lease.token, request.contentType, request.accept),
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
        if (upstreamResponse.status === 401 && attempt < MAX_AUTH_ATTEMPTS) {
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
  ).catch((error) => throwTokenPoolError(event, error))
  return sendWebResponse(event, createClientResponse(response, method))
}

export function getGithubRepositoryPath(event: H3Event, suffix?: string) {
  const owner = readPathSegment(event, 'owner', 'repository owner')
  const repo = readPathSegment(event, 'repo', 'repository name')
  return `repos/${owner}/${repo}${suffix ? `/${suffix}` : ''}`
}

export function getGithubOrganizationPath(event: H3Event, suffix?: string) {
  const org = readPathSegment(event, 'org', '组织名称')
  return `orgs/${org}${suffix ? `/${suffix}` : ''}`
}

function readPathSegment(event: H3Event, name: string, label: string) {
  const decoded = decodeRouteParam(
    getRouterParam(event, name),
    `${label} contains invalid encoding.`,
  )
  if (
    !decoded ||
    decoded.length > 100 ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('/') ||
    decoded.includes('\\') ||
    decoded.includes('\0')
  ) {
    throw createError({ statusCode: 400, message: `${label} is invalid.` })
  }
  return encodeURIComponent(decoded)
}

function decodeRouteParam(value: string | undefined, errorMessage: string) {
  try {
    return decodeURIComponent(value || '')
  } catch {
    throw createError({ statusCode: 400, message: errorMessage })
  }
}

function createUpstreamHeaders(
  event: H3Event,
  token: string,
  contentType?: string,
  accept?: string,
) {
  const headers = new Headers({
    Accept: accept || 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'anymeta',
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

async function fetchWithTimeout(url: URL, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT)
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
        !REDIRECT_STATUSES.has(response.status) ||
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
      if (target.origin !== GITHUB_API_ORIGIN || target.username || target.password) {
        return response
      }

      await response.body?.cancel()
      if (redirects >= MAX_UPSTREAM_REDIRECTS) {
        throw new Error('GitHub 上游重定向次数超出限制。')
      }
      upstreamUrl = target
      redirects += 1
    }
  } finally {
    clearTimeout(timeout)
  }
}

function createClientResponse(response: Response, method: string) {
  const headers = new Headers()
  for (const [name, value] of response.headers) {
    if (FORWARDED_RESPONSE_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value)
    }
  }

  const mustNotHaveBody =
    method === 'HEAD' ||
    response.status === 204 ||
    response.status === 205 ||
    response.status === 304
  return new Response(mustNotHaveBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function throwTokenPoolError(event: H3Event, error: unknown): never {
  if (!(error instanceof GithubTokenPoolError)) {
    throw error
  }
  if (error.retryAfter) {
    setResponseHeader(event, 'Retry-After', error.retryAfter)
  }
  throw createError({ statusCode: error.statusCode, message: error.message })
}
