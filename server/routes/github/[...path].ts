import {
  createError,
  defineEventHandler,
  getMethod,
  getRequestHeader,
  getRequestURL,
  readRawBody,
  sendNoContent,
  sendWebResponse,
  setResponseHeader,
} from 'h3'
import {
  getGithubAppTokenPool,
  GITHUB_API_VERSION,
  GithubTokenPoolError,
  type GithubRateResource,
  type GithubTokenLease,
} from '#server/utils/github-app'
import {
  GithubGraphqlValidationError,
  validateGithubGraphqlBody,
} from '#server/utils/github-graphql'

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

export default defineEventHandler(async event => {
  const method = getMethod(event).toUpperCase()
  if (method === 'OPTIONS') {
    return sendNoContent(event, 204)
  }

  const requestUrl = getRequestURL(event)
  const path = readProxyPath(requestUrl.pathname)
  const isGraphql = path === 'graphql'

  if (isGraphql) {
    if (method !== 'POST') {
      setResponseHeader(event, 'Allow', 'POST, OPTIONS')
      throw createError({ statusCode: 405, message: 'GraphQL 接口只接受 POST 请求。' })
    }
  } else {
    if (method !== 'GET' && method !== 'HEAD') {
      setResponseHeader(event, 'Allow', 'GET, HEAD, OPTIONS')
      throw createError({ statusCode: 405, message: 'GitHub REST 代理只接受只读请求。' })
    }
    validateRestPath(path)
  }

  let body: string | undefined
  if (isGraphql) {
    try {
      body = validateGithubGraphqlBody(await readRawBody(event, 'utf8'))
    } catch (error) {
      if (error instanceof GithubGraphqlValidationError) {
        throw createError({ statusCode: 400, message: error.message })
      }
      throw error
    }
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

  const resource: GithubRateResource = isGraphql
    ? 'graphql'
    : path === 'search/issues'
      ? 'search'
      : 'core'
  const upstreamUrl = new URL(`/${path}`, GITHUB_API_ORIGIN)
  upstreamUrl.search = requestUrl.search

  for (let attempt = 1; attempt <= MAX_AUTH_ATTEMPTS; attempt += 1) {
    let lease: GithubTokenLease
    try {
      lease = await pool.acquire(resource)
    } catch (error) {
      throwTokenPoolError(event, error)
    }

    let upstreamResponse: Response
    try {
      upstreamResponse = await fetchWithTimeout(upstreamUrl, {
        method,
        headers: createUpstreamHeaders(event, lease.token, isGraphql),
        body,
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
})

function readProxyPath(pathname: string) {
  const prefix = '/github/'
  if (!pathname.startsWith(prefix)) {
    throw createError({ statusCode: 404, message: '未找到 GitHub 代理路径。' })
  }
  const path = pathname.slice(prefix.length)
  if (!path || path.endsWith('/')) {
    throw createError({ statusCode: 404, message: '未找到 GitHub 代理路径。' })
  }
  return path
}

function validateRestPath(path: string) {
  if (path === 'search/issues') {
    return
  }

  const segments = path.split('/')
  if (segments[0] !== 'repos' || segments.length < 3) {
    throw createError({ statusCode: 404, message: '该 GitHub 接口不在允许列表中。' })
  }
  validatePathSegment(segments[1], '仓库所有者')
  validatePathSegment(segments[2], '仓库名称')

  if (segments.length === 3) {
    return
  }
  if (
    segments.length === 4 &&
    (segments[3] === 'contributors' ||
      segments[3] === 'languages' ||
      segments[3] === 'releases')
  ) {
    return
  }
  if (segments[3] === 'compare' && segments.length >= 5) {
    validateCompareReference(segments.slice(4).join('/'))
    return
  }

  throw createError({ statusCode: 404, message: '该 GitHub 接口不在允许列表中。' })
}

function validatePathSegment(value: string | undefined, label: string) {
  let decoded: string
  try {
    decoded = decodeURIComponent(value || '')
  } catch {
    throw createError({ statusCode: 400, message: `${label}包含无效编码。` })
  }
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
}

function validateCompareReference(value: string) {
  let decoded: string
  try {
    decoded = decodeURIComponent(value)
  } catch {
    throw createError({ statusCode: 400, message: '比较引用包含无效编码。' })
  }
  const separator = decoded.indexOf('...')
  if (
    separator <= 0 ||
    separator >= decoded.length - 3 ||
    decoded.length > 500 ||
    decoded.includes('\\') ||
    decoded.includes('\0')
  ) {
    throw createError({ statusCode: 400, message: '比较引用必须使用 base...head 格式。' })
  }
}

function createUpstreamHeaders(
  event: Parameters<typeof getRequestHeader>[0],
  token: string,
  isGraphql: boolean,
) {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'anymeta',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
  })
  if (isGraphql) {
    headers.set('Content-Type', 'application/json')
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

function throwTokenPoolError(
  event: Parameters<typeof setResponseHeader>[0],
  error: unknown,
): never {
  if (!(error instanceof GithubTokenPoolError)) {
    throw error
  }
  if (error.retryAfter) {
    setResponseHeader(event, 'Retry-After', error.retryAfter)
  }
  throw createError({ statusCode: error.statusCode, message: error.message })
}
