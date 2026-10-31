<script setup lang="ts">
import type { ApiOperation, OpenApiDocument } from '~/utils/openapi'
import { mediaExample, schemaType } from '~/utils/openapi'

const props = defineProps<{ operation: ApiOperation; document: OpenApiDocument }>()
const { t } = useI18n()
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
const responseCode = ref(
  responseCodes.value.find((code) => code.startsWith('2')) || responseCodes.value[0] || '',
)
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
  responseMedia.value
    ? (JSON.stringify(mediaExample(props.document, responseMedia.value), null, 2) ?? '')
    : '',
)
const responseView = ref('example')
const openResponse = ref<string>()
watch(responseCode, (code) => {
  if (openResponse.value !== code) openResponse.value = undefined
})
function toggleResponse(code: string) {
  responseCode.value = code
  openResponse.value = openResponse.value === code ? undefined : code
}
const statusTabs = computed(() => responseCodes.value.map((code) => ({ label: code, value: code })))
const requestTypes = computed(() => Object.entries(props.operation.requestBody?.content || {}))
const externalDocsUrl = computed(() => {
  const url = props.operation.externalDocs?.url
  return url && /^https?:\/\//i.test(url) ? url : undefined
})
</script>

<template>
  <article class="grid min-w-0 gap-9 xl:grid-cols-2 xl:gap-x-12">
    <div class="min-w-0 [&>section+section]:mt-8">
      <header class="mb-8">
        <h1 class="text-2xl font-semibold leading-8 tracking-tight text-highlighted">
          {{ operation.summary }}
        </h1>
        <p v-if="operation.description" class="mt-4 whitespace-pre-line text-sm leading-7">
          {{ operation.description }}
        </p>
        <UButton
          v-if="externalDocsUrl"
          :to="externalDocsUrl"
          external
          target="_blank"
          :label="t('ui.operation.upstreamDocumentation')"
          trailing-icon="i-lucide-arrow-up-right"
          color="neutral"
          variant="link"
          size="xs"
          class="mt-2 px-0 font-normal text-muted"
        />
      </header>

      <section v-for="group in parameterGroups" :key="group.location">
        <h2 class="mb-3 text-[15px] font-semibold leading-6 text-highlighted">{{ group.label }}</h2>
        <div class="divide-y divide-default border-y border-default">
          <div v-for="parameter in group.parameters" :key="parameter.name" class="py-3">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <code class="text-xs font-semibold text-highlighted">{{ parameter.name }}</code>
              <span class="font-mono text-[11px] text-muted">{{
                schemaType(parameter.schema || {})
              }}</span>
              <span
                v-if="parameter.required"
                class="text-[11px] text-amber-700 dark:text-amber-500"
                >{{ t('ui.common.required') }}</span
              >
            </div>
            <p v-if="parameter.description" class="mt-1.5 text-xs leading-6 text-muted">
              {{ parameter.description }}
            </p>
            <div v-if="parameter.schema?.enum" class="mt-1.5 flex flex-wrap gap-1.5">
              <code
                v-for="(value, index) in parameter.schema.enum"
                :key="index"
                class="rounded bg-muted px-1.5 text-[11px] leading-5"
                >{{ JSON.stringify(value) }}</code
              >
            </div>
            <div v-if="parameter.schema?.default !== undefined" class="mt-1.5 text-xs text-muted">
              {{ t('ui.common.defaultLabel') }}
              <code>{{ JSON.stringify(parameter.schema.default) }}</code>
            </div>
            <div
              v-if="
                parameter.schema?.minimum !== undefined || parameter.schema?.maximum !== undefined
              "
              class="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted"
            >
              <span v-if="parameter.schema.minimum !== undefined">{{
                t('ui.common.minimum', { value: parameter.schema.minimum })
              }}</span>
              <span v-if="parameter.schema.maximum !== undefined">{{
                t('ui.common.maximum', { value: parameter.schema.maximum })
              }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="requestTypes.length">
        <h2 class="mb-3 text-[15px] font-semibold leading-6 text-highlighted">
          {{ t('ui.common.requestBody') }}
        </h2>
        <div v-for="[contentType, media] in requestTypes" :key="contentType" class="space-y-2">
          <div class="flex items-center gap-2 text-[11px] text-muted">
            <code>{{ contentType }}</code>
            <span
              v-if="operation.requestBody?.required"
              class="text-amber-700 dark:text-amber-500"
              >{{ t('ui.common.required') }}</span
            >
          </div>
          <SchemaTree v-if="media.schema" :document="document" :schema="media.schema" />
        </div>
      </section>

      <section>
        <h2 class="mb-3 text-[15px] font-semibold leading-6 text-highlighted">
          {{ t('ui.operation.responses') }}
        </h2>
        <div class="divide-y divide-default border-y border-default">
          <div v-for="(definition, code) in operation.responses" :key="code">
            <button
              type="button"
              class="flex w-full items-start gap-2 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-primary"
              :aria-expanded="openResponse === code"
              @click="toggleResponse(code)"
            >
              <UIcon
                name="i-lucide-chevron-right"
                class="mt-0.5 size-3.5 shrink-0 text-muted transition-transform"
                :class="{ 'rotate-90': openResponse === code }"
              />
              <span class="shrink-0 font-mono text-xs font-semibold text-highlighted">{{
                code
              }}</span>
              <span class="text-xs leading-5 text-muted">{{ definition.description }}</span>
            </button>
            <div v-if="openResponse === code" class="pb-4 pl-5">
              <USelect
                v-if="responseTypes.length > 1"
                v-model="responseType"
                :items="responseTypes"
                :aria-label="t('ui.operation.responseContentType')"
                color="neutral"
                variant="ghost"
                size="xs"
                class="mb-2"
              />
              <SchemaTree
                v-if="responseMedia?.schema"
                :document="document"
                :schema="responseMedia.schema"
              />
              <p v-else class="text-xs text-muted">
                {{
                  responseMedia
                    ? t('ui.operation.noResponseSchema')
                    : t('ui.operation.noResponseBody')
                }}
              </p>
            </div>
          </div>
        </div>
        <p v-if="!responseCodes.length" class="text-xs text-muted">
          {{ t('ui.operation.noResponses') }}
        </p>
      </section>
    </div>

    <aside class="min-w-0 space-y-3 xl:pt-11" :aria-label="t('ui.operation.explorer')">
      <RequestPanel :operation="operation" :document="document" />
      <CodeBlock
        v-if="response"
        :code="
          responseView === 'schema' && responseMedia?.schema
            ? JSON.stringify(responseMedia.schema, null, 2)
            : responseMedia
              ? responseExample
              : t('ui.operation.noResponseBody')
        "
        :label="t('ui.operation.responses')"
        max-height="28rem"
      >
        <template #label>
          <UTabs
            v-model="responseCode"
            :items="statusTabs"
            :content="false"
            color="neutral"
            variant="link"
            size="xs"
            :ui="{ list: 'p-0', trigger: 'px-1.5 font-mono' }"
          />
        </template>
        <template #actions>
          <UCheckbox
            :model-value="responseView === 'schema'"
            :label="t('ui.schema.title')"
            color="neutral"
            size="xs"
            @update:model-value="responseView = $event === true ? 'schema' : 'example'"
          />
        </template>
        <template v-if="responseView === 'schema'" #default>
          <div class="max-h-[28rem] overflow-auto px-3 py-2">
            <SchemaTree
              v-if="responseMedia?.schema"
              :document="document"
              :schema="responseMedia.schema"
            />
            <p v-else class="py-2 text-xs text-muted">{{ t('ui.operation.noResponseSchema') }}</p>
          </div>
        </template>
        <template #footer>{{ response.description }}</template>
      </CodeBlock>
    </aside>
  </article>
</template>
