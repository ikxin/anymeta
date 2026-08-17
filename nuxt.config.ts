// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@scalar/nuxt'],
  scalar: {
    pathRouting: {
      basePath: '/',
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
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
