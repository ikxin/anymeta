// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@scalar/nuxt'],
  scalar: {
    url: '/_openapi.json',
    pathRouting: {
      basePath: '/',
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
    openAPI: {
      production: 'runtime',
      meta: {
        title: 'AnyMeta API',
        description: 'An anonymous proxy for public metadata from GitHub, OpenCollective, npm, and other platforms.',
        version: '0.1.0',
      },
    },
  },
  runtimeConfig: {
    githubAppId: '',
    githubAppPrivateKey: '',
    openCollectiveToken: '',
  },
  routeRules: {
    '/github/**': { cors: true },
    '/opencollective/**': { cors: true },
  },
})
