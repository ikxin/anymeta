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
  type GithubTokenLease,
} from '#server/utils/github-app'

const GITHUB_API_ORIGIN = 'https://api.github.com'
const UPSTREAM_TIMEOUT = 15_000
const MAX_AUTH_ATTEMPTS = 2

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
      message: '该 GitHub 代理接口不接受当前请求方法。',
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

  for (let attempt = 1; attempt <= MAX_AUTH_ATTEMPTS; attempt += 1) {
    let lease: GithubTokenLease
    try {
      lease = await pool.acquire(request.resource)
    } catch (error) {
      throwTokenPoolError(event, error)
    }

    let upstreamResponse: Response
    try {
      upstreamResponse = await fetchWithTimeout(upstreamUrl, {
        method,
        headers: createUpstreamHeaders(event, lease.token, request.contentType),
        body: request.body,
      })
    } catch (error) {
      pool.release(lease)
      throw createError({
        statusCode: 502,
        message: '无法连接 GitHub 上游接口。',
        cause: error,
      })
    }

    pool.release(lease, upstreamResponse)
    if (upstreamResponse.status === 401 && attempt < MAX_AUTH_ATTEMPTS) {
      await upstreamResponse.body?.cancel()
      continue
    }

    return sendWebResponse(event, createClientResponse(upstreamResponse, method))
  }

  throw createError({ statusCode: 502, message: 'GitHub 上游认证连续失败。' })
}

export function getGithubRepositoryPath(event: H3Event, suffix?: string) {
  const owner = readPathSegment(event, 'owner', '仓库所有者')
  const repo = readPathSegment(event, 'repo', '仓库名称')
  return `repos/${owner}/${repo}${suffix ? `/${suffix}` : ''}`
}

function readPathSegment(event: H3Event, name: string, label: string) {
  const decoded = decodeRouteParam(getRouterParam(event, name), `${label}包含无效编码。`)
  if (
    !decoded ||
    decoded.length > 100 ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('/') ||
    decoded.includes('\\') ||
    decoded.includes('\0')
  ) {
    throw createError({ statusCode: 400, message: `${label}无效。` })
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

function createUpstreamHeaders(event: H3Event, token: string, contentType?: string) {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
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
  try {
    return await fetch(url, { ...init, signal: controller.signal })
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
    method === 'HEAD' || response.status === 204 || response.status === 205 || response.status === 304
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
