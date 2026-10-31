import type { OpenApiDocument } from '~/utils/openapi'
import { getOperations, localizeOpenApi } from '~/utils/openapi'

export function useReference() {
  const { data: source } = useNuxtData<OpenApiDocument>('anymeta-openapi')
  const { localeProperties } = useI18n()
  const document = computed(() => {
    const { language, code } = localeProperties.value
    return source.value ? localizeOpenApi(source.value, language || code) : undefined
  })
  const operations = computed(() => (document.value ? getOperations(document.value) : []))

  return { document, operations }
}
