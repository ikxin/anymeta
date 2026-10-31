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
import { createCachedProxyRequest } from '#server/utils/proxy-cache'

const NPMJS_API_ORIGIN = 'https://api.npmjs.org'
const UPSTREAM_TIMEOUT = 15_000
const cachedNpmjsRequest = createCachedProxyRequest('npmjsProxy', 6 * 60 * 60)
const FORWARDED_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-type',
  'date',
  'etag',
  'expires',
  'last-modified',
  'link',
  'location',
  'npm-notice',
  'retry-after',
  'vary',
])

export async function proxyNpmjsRequest(event: H3Event, path: string) {
  const method = getMethod(event).toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    setResponseHeader(event, 'Allow', 'GET, HEAD, OPTIONS')
    throw createError({
      statusCode: 405,
      message: 'This npmjs proxy endpoint accepts read-only requests only.',
    })
  }

  const url = new URL(`/${path}`, NPMJS_API_ORIGIN)
  url.search = getRequestURL(event).search
  const headers = new Headers({
    Accept: getRequestHeader(event, 'accept') || 'application/json',
    'User-Agent': 'anymeta',
  })
  for (const name of ['if-none-match', 'if-modified-since']) {
    const value = getRequestHeader(event, name)
    if (value) headers.set(name, value)
  }

  let response: Response
  try {
    response = await cachedNpmjsRequest(
      event,
      JSON.stringify([url.href, headers.get('accept')]),
      () =>
        fetch(url, {
          method,
          headers,
          redirect: 'manual',
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
        }),
    )
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: 'Unable to connect to the npmjs upstream API.',
      cause: error,
    })
  }

  const responseHeaders = new Headers()
  for (const [name, value] of response.headers) {
    if (FORWARDED_RESPONSE_HEADERS.has(name.toLowerCase())) responseHeaders.set(name, value)
  }
  const mustNotHaveBody =
    method === 'HEAD' ||
    response.status === 204 ||
    response.status === 205 ||
    response.status === 304
  return sendWebResponse(
    event,
    new Response(mustNotHaveBody ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    }),
  )
}

export function getNpmjsDownloadsPointPath(event: H3Event) {
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
  const packages = readRouteParam(event, 'package').split(',')
  for (const name of packages) validatePackageName(name)

  const packagePath = packages
    .map((name) => name.split('/').map(encodeURIComponent).join('/'))
    .join(',')
  return `downloads/point/${encodeURIComponent(period)}/${packagePath}`
}

function readRouteParam(event: H3Event, name: string) {
  try {
    return decodeURIComponent(getRouterParam(event, name) || '')
  } catch {
    throw createError({ statusCode: 400, message: 'A route parameter contains invalid encoding.' })
  }
}

function validatePackageName(name: string) {
  if (
    !name ||
    name.length > 214 ||
    !/^(?:@[^/]+\/)?[^/@]+$/.test(name) ||
    /[\\\u0000-\u001f\u007f]/.test(name) ||
    name.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw createError({ statusCode: 400, message: 'The npm package name is invalid.' })
  }
}
