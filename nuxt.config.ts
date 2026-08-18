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
        description: 'GitHub、npm 等平台公开元数据的匿名代理接口。',
        version: '0.1.0',
      },
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
