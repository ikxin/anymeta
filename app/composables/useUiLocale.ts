import { en, ja, ko, zh_cn, zh_tw } from '@nuxt/ui/locale'

const uiLocales = { en, 'zh-CN': zh_cn, 'zh-TW': zh_tw, ja, ko }

export function useUiLocale() {
  const { locale } = useI18n()
  return computed(() => uiLocales[locale.value as keyof typeof uiLocales] || en)
}
