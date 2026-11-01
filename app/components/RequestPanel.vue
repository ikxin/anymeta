<script setup lang="ts">
import type { ApiOperation, ApiParameter, OpenApiDocument } from '~/utils/openapi'
import { parameterKey, useRequest } from '~/composables/useRequest'
import { schemaType } from '~/utils/openapi'

const props = defineProps<{ operation: ApiOperation; document: OpenApiDocument; expanded?: boolean }>()
const { t } = useI18n()
const {
  values,
  contentTypes,
  contentType,
  body,
  hasBody,
  fieldErrors,
  error,
  pending,
  result,
  requestUrl,
  requestHeaders,
  curl,
  javascript,
  execute,
  reset,
  resetBody,
  cancel,
} = useRequest(props.operation, props.document)

const requestForm = useTemplateRef<HTMLFormElement>('requestForm')
const requestTab = ref(hasBody ? 'body' : 'parameters')
const requestTabs = computed(() => [
  { label: t('ui.request.parameters'), value: 'parameters' },
  { label: t('ui.common.headers'), value: 'headers' },
  ...(hasBody ? [{ label: t('ui.common.body'), value: 'body' }] : []),
])
const visibleParameters = computed(() =>
  props.operation.parameters.filter((parameter) =>
    requestTab.value === 'headers'
      ? parameter.in === 'header'
      : parameter.in === 'path' || parameter.in === 'query',
  ),
)
const codeTab = ref('curl')
const codeTabs = [
  { label: 'cURL', value: 'curl' },
  { label: 'JavaScript', value: 'javascript' },
]
const responseTab = ref('body')
const responseTabs = computed(() => [
  { label: t('ui.common.body'), value: 'body' },
  { label: t('ui.common.headers'), value: 'headers' },
])
const responseColor = computed(() =>
  !result.value || result.value.status < 300
    ? 'success'
    : result.value.status < 400
      ? 'info'
      : 'error',
)
const sizeLabel = computed(() => {
  const size = result.value?.size || 0
  return size < 1024
    ? t('ui.request.bytes', { value: size })
    : t('ui.request.kilobytes', { value: (size / 1024).toFixed(1) })
})

function enumItems(parameter: ApiParameter) {
  return (parameter.schema?.enum || [])
    .map((value) => ({ label: String(value), value: String(value) }))
    .filter((item) => item.value !== '')
}

function formatBody() {
  try {
    body.value = JSON.stringify(JSON.parse(body.value), null, 2)
    delete fieldErrors.value.body
  } catch {
    fieldErrors.value.body = t('ui.errors.invalidJson')
  }
}

defineExpose({
  focusRequest() {
    requestForm.value?.querySelector<HTMLElement>('input, textarea, [role="combobox"]')?.focus()
  },
})
</script>

<template>
  <div class="grid min-w-0 items-start gap-5" :class="expanded ? 'xl:grid-cols-2' : ''">
    <div class="min-w-0 space-y-4">
      <section class="overflow-hidden rounded-xl border border-default bg-default" :aria-label="t('ui.request.tryItOut')">
        <div class="flex min-h-12 items-center justify-between gap-2 border-b border-default px-4">
          <h2 class="flex items-center gap-2 text-xs font-semibold text-highlighted"><UIcon name="i-lucide-square-terminal" class="size-4 text-primary" />{{ t('ui.request.tryItOut') }}</h2>
          <UButton :label="t('ui.request.reset')" icon="i-lucide-rotate-ccw" size="xs" color="neutral" variant="ghost" :disabled="pending" class="text-[10px] text-muted" @click="reset" />
        </div>

        <form ref="requestForm" novalidate @submit.prevent="execute">
          <div class="p-4 pb-3">
            <div class="mb-2 text-[10px] font-medium text-muted">{{ t('workspace.requestUrl') }}</div>
            <div class="flex min-w-0 items-center gap-2 rounded-lg border border-default bg-reference-panel px-2.5 py-2.5">
              <MethodBadge :method="operation.method" />
              <code class="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-[10px] leading-5 text-highlighted" :title="requestUrl">{{ requestUrl }}</code>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2 border-b border-default px-4">
            <UTabs v-model="requestTab" :items="requestTabs" :content="false" variant="link" size="xs" :ui="{ list: 'p-0 gap-4', trigger: 'px-0 py-2.5 text-[11px]' }" />
          </div>

          <fieldset :disabled="pending" class="min-w-0 space-y-4 overflow-y-auto p-4" :class="expanded ? '' : 'max-h-100'">
            <template v-if="requestTab === 'body'">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <USelect v-if="contentTypes.length > 1" v-model="contentType" :items="contentTypes" color="neutral" size="xs" :aria-label="t('ui.request.bodyContentType')" />
                <span v-else class="font-mono text-[10px] text-muted">{{ contentType }}</span>
                <div class="flex items-center gap-1">
                  <UButton :label="t('ui.request.restoreExample')" color="neutral" variant="ghost" size="xs" :disabled="pending" class="text-[10px]" @click="resetBody" />
                  <UButton v-if="contentType.includes('json')" :label="t('ui.request.format')" color="neutral" variant="ghost" size="xs" :disabled="pending" class="text-[10px]" @click="formatBody" />
                </div>
              </div>
              <UFormField :label="t('ui.common.requestBody')" name="body" :required="operation.requestBody?.required" :error="fieldErrors.body" :ui="{ label: 'text-[11px]' }">
                <UTextarea v-model="body" :rows="10" :disabled="pending" color="neutral" class="w-full" :ui="{ base: 'rounded-lg bg-reference-panel font-mono text-xs leading-6' }" :spellcheck="false" :placeholder="t('ui.request.bodyPlaceholder')" />
              </UFormField>
            </template>
            <template v-else>
              <div v-if="requestTab === 'headers'" class="rounded-lg border border-dashed border-default bg-reference-panel px-3 py-2 font-mono text-[10px] leading-6 text-muted">
                <div v-for="(value, name) in requestHeaders" :key="name" class="break-all">{{ name }}: {{ value }}</div>
              </div>
              <UFormField
                v-for="parameter in visibleParameters"
                :key="parameterKey(parameter)"
                :label="parameter.name"
                :name="parameterKey(parameter)"
                :required="parameter.required"
                :hint="parameter.in === 'path' ? t('ui.request.path') : parameter.in === 'query' ? t('ui.request.query') : undefined"
                :error="fieldErrors[parameterKey(parameter)]"
                :ui="{ label: 'font-mono text-[11px]', hint: 'text-[10px]' }"
              >
                <div v-if="parameter.schema?.enum" class="flex gap-2">
                  <USelect
                    v-model="values[parameterKey(parameter)]"
                    :items="enumItems(parameter)"
                    :placeholder="parameter.required ? t('ui.request.selectValue') : t('ui.request.omitParameter')"
                    :disabled="pending"
                    color="neutral"
                    size="sm"
                    class="min-w-0 flex-1 font-mono"
                    :ui="{ base: 'rounded-lg text-xs' }"
                  />
                  <UButton v-if="!parameter.required" icon="i-lucide-x" color="neutral" variant="outline" size="sm" :aria-label="t('ui.request.clearParameter', { name: parameter.name })" :disabled="pending || !values[parameterKey(parameter)]" @click="values[parameterKey(parameter)] = ''" />
                </div>
                <UInput
                  v-else
                  v-model="values[parameterKey(parameter)]"
                  :placeholder="parameter.required ? schemaType(parameter.schema || {}) : t('ui.request.optionalParameter')"
                  :disabled="pending"
                  color="neutral"
                  size="sm"
                  class="w-full"
                  :ui="{ base: 'rounded-lg font-mono text-xs' }"
                />
              </UFormField>
              <p v-if="!visibleParameters.length" class="py-3 text-[11px] leading-5 text-muted">{{ requestTab === 'headers' ? t('ui.request.noAdditionalHeaders') : t('ui.request.noParameters') }}</p>
            </template>
          </fieldset>

          <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :description="error" :ui="{ description: 'text-xs' }" class="mx-4 mb-4" />
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default bg-reference-panel/50 px-4 py-3">
            <span class="flex items-center gap-1.5 text-[10px] text-muted"><UIcon name="i-lucide-shield-check" class="size-3.5 text-reference-get" />{{ t('site.noAuth') }}</span>
            <div class="flex gap-2">
              <UButton v-if="pending" :label="t('ui.request.cancel')" color="neutral" variant="outline" size="sm" class="rounded-lg" @click="cancel" />
              <UButton type="submit" icon="i-lucide-send" :label="pending ? t('ui.request.sending') : t('ui.request.send')" :loading="pending" size="sm" class="rounded-lg px-4 text-xs" />
            </div>
          </div>
        </form>
      </section>

      <details class="group/code overflow-hidden rounded-xl border border-default bg-default" :open="expanded">
        <summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-[11px] text-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <UIcon name="i-lucide-code-xml" class="size-3.5" /><span class="flex-1">{{ t('ui.request.codeExamples') }}</span><UIcon name="i-lucide-chevron-right" class="size-3 transition-transform group-open/code:rotate-90" />
        </summary>
        <CodeBlock :code="codeTab === 'curl' ? curl : javascript" :label="codeTab === 'curl' ? 'cURL' : 'JavaScript'" max-height-class="max-h-96" class="rounded-none! border-x-0! border-b-0!">
          <template #label><UTabs v-model="codeTab" :items="codeTabs" :content="false" variant="link" size="xs" :ui="{ list: 'p-0 gap-2', trigger: 'px-0 text-[10px]' }" /></template>
        </CodeBlock>
      </details>
    </div>

    <section class="min-w-0 overflow-hidden rounded-xl border border-default bg-default" :aria-label="t('ui.request.liveResponse')" aria-live="polite" :aria-busy="pending">
      <div class="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-default px-4 py-3">
        <h2 class="flex items-center gap-2 text-xs font-semibold text-highlighted"><UIcon name="i-lucide-radio" class="size-4 text-muted" />{{ t('ui.request.liveResponse') }}</h2>
        <div v-if="result && !pending" class="flex flex-wrap items-center gap-2 text-[10px] text-muted">
          <UBadge :color="responseColor" variant="soft" size="sm" class="font-mono text-[10px]">{{ result.status }} {{ result.statusText }}</UBadge>
          <span>{{ t('ui.request.duration', { value: result.duration }) }}</span><span>{{ sizeLabel }}</span>
        </div>
        <span v-else class="font-mono text-[10px] text-muted">{{ pending ? '···' : '—' }}</span>
      </div>
      <div v-if="pending" class="flex min-h-52 flex-col items-center justify-center gap-3 px-6 text-xs text-muted" role="status">
        <UIcon name="i-lucide-loader-circle" class="size-7 animate-spin text-primary" />{{ t('ui.request.waiting') }}
      </div>
      <template v-else-if="result">
        <div class="border-b border-default px-4"><UTabs v-model="responseTab" :items="responseTabs" :content="false" variant="link" size="xs" :ui="{ list: 'p-0 gap-4', trigger: 'px-0 py-3 text-[11px]' }" /></div>
        <CodeBlock :code="responseTab === 'body' ? result.body : result.headers" :label="responseTab === 'body' ? result.contentType : t('ui.request.responseHeaders')" max-height-class="max-h-144" class="rounded-none! border-0!" />
      </template>
      <div v-else class="flex min-h-52 flex-col items-center justify-center px-8 py-8 text-center" :class="expanded ? 'xl:min-h-96' : ''">
        <span class="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-default bg-reference-panel"><UIcon name="i-lucide-satellite-dish" class="size-6 text-muted/60" /></span>
        <p class="max-w-64 text-[11px] leading-6 text-muted">{{ t('ui.request.responsePlaceholder') }}</p>
      </div>
    </section>
  </div>
</template>
