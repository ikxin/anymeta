<script setup lang="ts">
import type { ApiOperation, OpenApiDocument } from '~/utils/openapi'
import { groupOperations, operationLink } from '~/utils/navigation'
import { mediaExample, schemaType } from '~/utils/openapi'

const props = defineProps<{ operation: ApiOperation; document: OpenApiDocument }>()
const { t } = useI18n()
const localePath = useLocalePath()
const { operations } = useReference()
const platform = computed(() => groupOperations([props.operation])[0])
const view = ref('documentation')
const viewTabs = computed(() => [
  { label: t('workspace.documentation'), value: 'documentation', icon: 'i-lucide-file-text' },
  { label: t('workspace.debug'), value: 'debug', icon: 'i-lucide-play' },
])
const requestPanel = useTemplateRef<{ focusRequest: () => void }>('requestPanel')
const parameterGroups = computed(() =>
  [
    { location: 'path', label: t('ui.operation.pathParameters') },
    { location: 'query', label: t('ui.operation.queryParameters') },
    { location: 'header', label: t('ui.common.headers') },
    { location: 'cookie', label: t('ui.operation.cookieParameters') },
  ]
    .map((group) => ({
      ...group,
      parameters: props.operation.parameters.filter((parameter) => parameter.in === group.location),
    }))
    .filter((group) => group.parameters.length),
)
const responseCodes = computed(() => Object.keys(props.operation.responses))
const responseCode = ref(responseCodes.value.find((code) => code.startsWith('2')) || responseCodes.value[0] || '')
const response = computed(() => props.operation.responses[responseCode.value])
const responseTypes = computed(() => Object.keys(response.value?.content || {}))
const responseType = ref('')
watch(
  responseTypes,
  (types) => {
    responseType.value = types.includes('application/json') ? 'application/json' : types[0] || ''
  },
  { immediate: true },
)
const responseMedia = computed(() => response.value?.content?.[responseType.value])
const responseExample = computed(() =>
  responseMedia.value ? (JSON.stringify(mediaExample(props.document, responseMedia.value), null, 2) ?? '') : '',
)
const responseView = ref('schema')
const responseViews = computed(() => [
  { label: t('ui.schema.title'), value: 'schema' },
  { label: t('ui.common.example'), value: 'example' },
])
const statusTabs = computed(() => responseCodes.value.map((code) => ({ label: code, value: code })))
const requestTypes = computed(() => Object.entries(props.operation.requestBody?.content || {}))
const externalDocsUrl = computed(() => {
  const url = props.operation.externalDocs?.url
  return url && /^https?:\/\//i.test(url) ? url : undefined
})
const operationIndex = computed(() => operations.value.findIndex((operation) => operation.id === props.operation.id))
const previousOperation = computed(() => operations.value[operationIndex.value - 1])
const nextOperation = computed(() => operations.value[operationIndex.value + 1])

async function openDebugger() {
  view.value = 'debug'
  await nextTick()
  requestPanel.value?.focusRequest()
}
</script>

<template>
  <article class="min-w-0">
    <header class="border-b border-default bg-default px-5 pt-5 sm:px-8 sm:pt-6">
      <div class="mb-5 flex min-w-0 items-center gap-2 text-[11px] text-muted">
        <NuxtLink :to="localePath('index')" class="flex items-center gap-1.5 hover:text-primary"><UIcon name="i-lucide-house" class="size-3.5" />AnyMeta</NuxtLink>
        <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0" />
        <span>{{ platform?.label }}</span>
        <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0" />
        <span class="truncate">{{ platform?.categories[0]?.label }}</span>
      </div>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-semibold leading-8 tracking-tight text-highlighted sm:text-2xl">{{ operation.summary }}</h1>
          <p v-if="operation.description" class="mt-2 max-w-3xl whitespace-pre-line text-xs leading-6 text-muted">{{ operation.description }}</p>
        </div>
        <UButton :label="t('ui.request.tryItOut')" icon="i-lucide-play" size="sm" class="rounded-lg" @click="openDebugger" />
      </div>
      <div class="mt-5 flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-default bg-reference-panel px-3 py-2.5">
        <MethodBadge :method="operation.method" />
        <code class="min-w-0 flex-1 break-all text-xs text-highlighted">{{ operation.path }}</code>
        <span class="flex shrink-0 items-center gap-1.5 text-[10px] text-muted"><UIcon name="i-lucide-shield-check" class="size-3.5 text-reference-get" />{{ t('site.noAuth') }}</span>
      </div>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <UTabs v-model="view" :items="viewTabs" :content="false" variant="link" size="sm" :ui="{ list: 'p-0 gap-5', trigger: 'px-0 py-3 text-xs', leadingIcon: 'size-3.5' }" />
        <UButton v-if="externalDocsUrl" :to="externalDocsUrl" external target="_blank" :label="t('ui.operation.upstreamDocumentation')" trailing-icon="i-lucide-arrow-up-right" color="neutral" variant="link" size="xs" class="px-0 text-[11px] text-muted" />
      </div>
    </header>

    <div class="mx-auto grid max-w-400 min-w-0 items-start gap-6 p-5 sm:p-8" :class="view === 'documentation' ? 'xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)]' : ''">
      <div v-show="view === 'documentation'" class="min-w-0 space-y-7">
        <section v-for="group in parameterGroups" :key="group.location">
          <h2 class="mb-3 flex items-center gap-2 text-[13px] font-semibold text-highlighted"><span class="h-3.5 w-0.5 rounded-full bg-primary" />{{ group.label }}<span class="ml-1 rounded bg-elevated px-1.5 py-0.5 font-mono text-[10px] font-normal text-muted">{{ group.parameters.length }}</span></h2>
          <div class="overflow-x-auto rounded-xl border border-default bg-default">
            <table class="w-full border-collapse text-left text-[11px]">
              <caption class="sr-only">{{ group.label }}</caption>
              <thead class="bg-muted/60 text-[10px] font-normal text-muted">
                <tr><th class="px-4 py-2.5 font-normal">{{ t('workspace.name') }}</th><th class="px-3 py-2.5 font-normal">{{ t('workspace.type') }}</th><th class="min-w-36 px-4 py-2.5 font-normal">{{ t('workspace.description') }}</th></tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="parameter in group.parameters" :key="parameter.name" class="align-top">
                  <td class="px-4 py-3.5"><code class="font-medium text-highlighted">{{ parameter.name }}</code><span v-if="parameter.required" class="ml-1 text-primary" :title="t('ui.common.required')" :aria-label="t('ui.common.required')">*</span></td>
                  <td class="px-3 py-3.5"><code class="whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted">{{ schemaType(parameter.schema || {}) }}</code></td>
                  <td class="px-4 py-3 leading-5 text-muted">
                    <p v-if="parameter.description">{{ parameter.description }}</p>
                    <div v-if="parameter.schema?.enum" class="mt-1 flex flex-wrap gap-1"><code v-for="(value, index) in parameter.schema.enum" :key="index" class="rounded bg-muted px-1.5 text-[10px]">{{ JSON.stringify(value) }}</code></div>
                    <p v-if="parameter.schema?.default !== undefined" class="mt-1 text-[10px]">{{ t('ui.common.defaultLabel') }}<code>{{ JSON.stringify(parameter.schema.default) }}</code></p>
                    <div v-if="parameter.schema?.minimum !== undefined || parameter.schema?.maximum !== undefined" class="mt-1 flex flex-wrap gap-x-3 text-[10px]">
                      <span v-if="parameter.schema.minimum !== undefined">{{ t('ui.common.minimum', { value: parameter.schema.minimum }) }}</span>
                      <span v-if="parameter.schema.maximum !== undefined">{{ t('ui.common.maximum', { value: parameter.schema.maximum }) }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="requestTypes.length">
          <h2 class="mb-3 flex items-center gap-2 text-[13px] font-semibold text-highlighted"><span class="h-3.5 w-0.5 rounded-full bg-primary" />{{ t('ui.common.requestBody') }}</h2>
          <div class="space-y-4 rounded-xl border border-default bg-default p-4">
            <div v-for="[contentType, media] in requestTypes" :key="contentType">
              <div class="mb-2 flex items-center gap-2 text-[10px] text-muted"><code>{{ contentType }}</code><span v-if="operation.requestBody?.required" class="text-primary">{{ t('ui.common.required') }}</span></div>
              <SchemaTree v-if="media.schema" :document="document" :schema="media.schema" />
            </div>
          </div>
        </section>

        <section>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-[13px] font-semibold text-highlighted"><span class="h-3.5 w-0.5 rounded-full bg-primary" />{{ t('ui.operation.responses') }}</h2>
            <UTabs v-if="response" v-model="responseView" :items="responseViews" :content="false" size="xs" :ui="{ list: 'p-0.5 bg-elevated', trigger: 'text-[10px] px-2 py-1' }" />
          </div>
          <div v-if="response" class="overflow-hidden rounded-xl border border-default bg-default">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-3 py-1.5">
              <UTabs v-model="responseCode" :items="statusTabs" :content="false" variant="link" size="xs" :ui="{ list: 'p-0 gap-1', trigger: 'px-2 font-mono text-[11px]' }" />
              <USelect v-if="responseTypes.length > 1" v-model="responseType" :items="responseTypes" :aria-label="t('ui.operation.responseContentType')" color="neutral" variant="ghost" size="xs" />
              <code v-else class="px-1 text-[10px] text-muted">{{ responseType }}</code>
            </div>
            <div v-if="responseView === 'schema'" class="max-h-120 overflow-auto p-4">
              <SchemaTree v-if="responseMedia?.schema" :document="document" :schema="responseMedia.schema" />
              <p v-else class="text-xs text-muted">{{ responseMedia ? t('ui.operation.noResponseSchema') : t('ui.operation.noResponseBody') }}</p>
            </div>
            <CodeBlock v-else :code="responseMedia ? responseExample : t('ui.operation.noResponseBody')" :label="t('ui.common.example')" class="rounded-none! border-0!" />
            <div class="border-t border-default px-4 py-3 text-[11px] leading-5 text-muted">
              <p>{{ response.description }}</p>
              <p v-if="responseView === 'example'" class="mt-1">{{ t('ui.operation.exampleNotice') }}</p>
            </div>
          </div>
          <p v-else class="rounded-xl border border-default bg-default p-4 text-xs text-muted">{{ t('ui.operation.noResponses') }}</p>
        </section>

        <nav class="grid grid-cols-2 gap-3 border-t border-default pt-5" :aria-label="t('site.endpointPagination')">
          <NuxtLink v-if="previousOperation" :to="localePath(operationLink(previousOperation))" class="group min-w-0 rounded-lg border border-default bg-default p-3 hover:border-primary/40">
            <span class="flex items-center gap-1 text-[10px] text-muted"><UIcon name="i-lucide-arrow-left" class="size-3" />{{ t('site.previousEndpoint') }}</span>
            <span class="mt-1.5 block truncate text-[11px] font-medium text-highlighted group-hover:text-primary">{{ previousOperation.summary }}</span>
          </NuxtLink>
          <NuxtLink v-if="nextOperation" :to="localePath(operationLink(nextOperation))" class="group col-start-2 min-w-0 rounded-lg border border-default bg-default p-3 text-right hover:border-primary/40">
            <span class="flex items-center justify-end gap-1 text-[10px] text-muted">{{ t('site.nextEndpoint') }}<UIcon name="i-lucide-arrow-right" class="size-3" /></span>
            <span class="mt-1.5 block truncate text-[11px] font-medium text-highlighted group-hover:text-primary">{{ nextOperation.summary }}</span>
          </NuxtLink>
        </nav>
      </div>

      <aside class="min-w-0" :aria-label="t('ui.operation.explorer')">
        <RequestPanel ref="requestPanel" :operation="operation" :document="document" :expanded="view === 'debug'" />
      </aside>
    </div>
  </article>
</template>
