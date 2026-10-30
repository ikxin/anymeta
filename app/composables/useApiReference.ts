import type { OpenApiDocument } from '~/utils/openapi'
import { localizeOpenApi } from '~/utils/localize-openapi'
import { getOperations } from '~/utils/openapi'

export function useApiReference() {
  const { data: source } = useNuxtData<OpenApiDocument>('anymeta-openapi')
  const { locale } = useI18n()
  const document = computed(() =>
    source.value ? localizeOpenApi(source.value, locale.value) : undefined,
  )
  const operations = computed(() => (document.value ? getOperations(document.value) : []))

  return { document, operations }
}
