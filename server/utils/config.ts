import type { GraphqlFieldPolicy } from '#server/utils/graphql'

const RESPONSE_HEADERS = ['cache-control', 'content-type', 'etag', 'retry-after', 'vary']
const RATE_LIMIT_HEADERS = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']
const READ_ONLY_RESPONSE_HEADERS = [
  ...RESPONSE_HEADERS,
  'date',
  'expires',
  'last-modified',
  'link',
  'location',
]

const NPMJS_ORIGINS = {
  api: 'https://api.npmjs.org',
  registry: 'https://registry.npmjs.org',
}

const amountFields = {
  value: true,
  currency: true,
  valueInCents: true,
} satisfies GraphqlFieldPolicy

const accountFields = {
  id: true,
  legacyId: true,
  slug: true,
  name: true,
  type: true,
  description: true,
  website: true,
  imageUrl: true,
  isIncognito: true,
} satisfies GraphqlFieldPolicy

const tierFields = {
  id: true,
  slug: true,
  name: true,
  type: true,
  description: true,
  amount: amountFields,
  endsAt: true,
  interval: true,
  frequency: true,
} satisfies GraphqlFieldPolicy

const memberFields = {
  id: true,
  role: true,
  createdAt: true,
  since: true,
  totalDonations: amountFields,
  tier: tierFields,
  account: accountFields,
} satisfies GraphqlFieldPolicy

export const proxyConfig = {
  timeout: 15_000,
  accept: 'application/json',
  github: {
    name: 'github',
    origin: 'https://api.github.com',
    maxAge: 5 * 60,
    accept: 'application/vnd.github+json',
    userAgent: 'anymeta',
    maxAuthAttempts: 2,
    maxRedirects: 5,
    redirectStatuses: new Set([301, 302, 303, 307, 308]),
    responseHeaders: new Set([
      ...RESPONSE_HEADERS,
      ...RATE_LIMIT_HEADERS,
      'last-modified',
      'link',
      'location',
      'x-github-media-type',
      'x-github-request-id',
      'x-ratelimit-resource',
      'x-ratelimit-used',
    ]),
    graphql: {
      maxFields: 500,
      argumentBounds: {
        first: { minimum: 1, maximum: 100 },
        last: { minimum: 1, maximum: 100 },
      },
      allowOtherLiterals: true,
    },
  },
  npmjs: {
    name: 'npmjs',
    origin: NPMJS_ORIGINS.api,
    origins: NPMJS_ORIGINS,
    maxAge: 6 * 60 * 60,
    userAgent: 'anymeta',
    responseHeaders: [...READ_ONLY_RESPONSE_HEADERS, 'npm-notice'],
  },
  crates: {
    name: 'crates',
    origin: 'https://crates.io',
    maxAge: 5 * 60,
    userAgent: 'AnyMeta (https://anymeta.top)',
    cacheHeaders: ['accept', 'content-type'],
    responseHeaders: [...READ_ONLY_RESPONSE_HEADERS, ...RATE_LIMIT_HEADERS],
  },
  pypi: {
    name: 'pypi',
    origin: 'https://pypi.org',
    maxAge: 5 * 60,
    userAgent: 'AnyMeta (https://anymeta.top)',
    responseHeaders: [...READ_ONLY_RESPONSE_HEADERS, ...RATE_LIMIT_HEADERS, 'x-pypi-last-serial'],
  },
  openCollective: {
    url: 'https://api.opencollective.com/graphql/v2/',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'anymeta',
    },
    responseHeaders: new Set([...RESPONSE_HEADERS, ...RATE_LIMIT_HEADERS, 'execution-time']),
    graphql: {
      maxFields: 300,
      fields: {
        collective: {
          ...accountFields,
          currency: true,
          members: {
            offset: true,
            limit: true,
            totalCount: true,
            nodes: memberFields,
          },
        },
      },
      argumentBounds: {
        limit: { minimum: 1, maximum: 100 },
        offset: { minimum: 0, maximum: 10_000 },
        height: { minimum: 1, maximum: 1_024 },
        width: { minimum: 1, maximum: 1_024 },
      },
      allowNullVariables: true,
    },
  },
} as const
