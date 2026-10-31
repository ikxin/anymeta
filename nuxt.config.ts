// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],
  devtools: { enabled: true },
  app: {
    head: {
      bodyAttrs: {
        class: 'min-w-80 text-sm leading-normal antialiased selection:bg-primary/20',
      },
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    githubAppId: '',
    githubAppPrivateKey: '',
    openCollectiveToken: '',
  },
  routeRules: {
    '/github/**': { cors: true },
    '/npmjs/**': { cors: true },
    '/crates/**': { cors: true },
    '/pypi/**': { cors: true },
    '/opencollective/**': { cors: true },
  },
  compatibilityDate: '2025-07-15',
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
        description:
          'An anonymous proxy for public metadata from GitHub, OpenCollective, npm, and other platforms.',
        version: '0.1.0',
      },
    },
  },
  i18n: {
    baseUrl: 'https://anymeta.top',
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    locales: [
      { code: 'zh-cn', language: 'zh-CN', name: '简体中文', file: 'zh-cn.json' },
      { code: 'zh-tw', language: 'zh-TW', name: '繁體中文', file: 'zh-tw.json' },
      { code: 'ko', language: 'ko', name: '한국어', file: 'ko.json' },
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'ja', language: 'ja', name: '日本語', file: 'ja.json' },
    ],
  },
})
