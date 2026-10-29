// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'zh-CN', language: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'zh-TW', language: 'zh-TW', name: '繁體中文', file: 'zh-TW.json' },
      { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' },
      { code: 'ko', language: 'ko', name: '한국어', file: 'ko.json' },
    ],
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
    openAPI: {
      production: 'runtime',
      ui: {
        scalar: false,
        swagger: false,
      },
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
    '/npmjs/**': { cors: true },
    '/opencollective/**': { cors: true },
  },
})
