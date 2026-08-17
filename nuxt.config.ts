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
    },
  },
  runtimeConfig: {
    githubAppId: '',
    githubAppPrivateKey: '',
  },
  routeRules: {
    '/github/**': { cors: true },
  },
})
