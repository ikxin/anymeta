import { getMethod, getRequestHeader, type H3Event } from 'h3'

export function createCachedProxyRequest(name: string, maxAge: number) {
  const cached = defineCachedFunction(async (
    _event: H3Event,
    _key: string,
    load: () => Promise<Response>,
  ) => {
    const response = await load()
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers),
      body: await response.text(),
    }
  }, {
    name,
    maxAge,
    swr: true,
    getKey: async (_event: H3Event, key: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    },
    shouldBypassCache: event => getMethod(event) !== 'GET' || Boolean(
      getRequestHeader(event, 'if-none-match') || getRequestHeader(event, 'if-modified-since'),
    ),
    validate: entry => entry.value?.status === 200,
  })

  return async (event: H3Event, key: string, load: () => Promise<Response>) => {
    const response = await cached(event, key, load)
    return new Response([204, 205, 304].includes(response.status) ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  }
}
