import {
  createError,
  sendWebResponse,
  type H3Event,
} from 'h3'

const OPEN_COLLECTIVE_GRAPHQL_URL = 'https://api.opencollective.com/graphql/v2/'
const UPSTREAM_TIMEOUT = 15_000

const FORWARDED_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-type',
  'etag',
  'execution-time',
  'retry-after',
  'vary',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
])

export async function proxyOpenCollectiveGraphql(event: H3Event, body: string) {
  const config = useRuntimeConfig(event)
  const token = String(config.openCollectiveToken || '').trim()
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'anymeta',
  })
  if (token) {
    headers.set('Personal-Token', token)
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetchWithTimeout(OPEN_COLLECTIVE_GRAPHQL_URL, {
      method: 'POST',
      headers,
      body,
    })
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: '无法连接 OpenCollective 上游接口。',
      cause: error,
    })
  }

  return sendWebResponse(event, createClientResponse(upstreamResponse))
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function createClientResponse(response: Response) {
  const headers = new Headers()
  for (const [name, value] of response.headers) {
    if (FORWARDED_RESPONSE_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value)
    }
  }

  const mustNotHaveBody =
    response.status === 204 || response.status === 205 || response.status === 304
  return new Response(mustNotHaveBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
