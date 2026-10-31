<script setup lang="ts">
import type { ApiOperation, ApiParameter, OpenApiDocument } from '~/utils/openapi'
import { parameterKey, useRequest } from '~/composables/useRequest'
import { schemaType } from '~/utils/openapi'

const props = defineProps<{ operation: ApiOperation; document: OpenApiDocument }>()
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
  curl,
  javascript,
  execute,
  reset,
  resetBody,
  cancel,
} = useRequest(props.operation, props.document)

const requestOpen = ref(false)
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
</script>

<template>
  <section
    class="overflow-hidden rounded-md border border-default bg-reference-panel"
    :aria-label="t('ui.request.codeExamples')"
  >
    <CodeBlock
      :code="codeTab === 'curl' ? curl : javascript"
      :label="codeTab === 'curl' ? 'cURL' : 'JavaScript'"
      max-height="24rem"
      class="rounded-none! border-0!"
    >
      <template #label>
        <div class="flex min-w-0 items-center gap-2">
          <MethodBadge :method="operation.method" class="shrink-0" />
          <span class="truncate font-mono text-[11px] text-muted" :title="operation.path">{{
            operation.path
          }}</span>
        </div>
      </template>
      <template #actions>
        <USelect
          v-model="codeTab"
          :items="codeTabs"
          :aria-label="t('ui.request.codeExamples')"
          variant="ghost"
          color="neutral"
          size="xs"
          class="w-25 shrink-0"
        />
      </template>
    </CodeBlock>

    <div class="flex justify-end border-t border-default px-2 py-1.5">
      <UModal
        v-model:open="requestOpen"
        :title="t('ui.request.tryItOut')"
        :description="`${operation.method} ${operation.path}`"
        :ui="{
          content: 'max-w-2xl rounded-md',
          header: 'min-h-14 px-5 py-3',
          body: 'p-5 sm:p-5',
          title: 'text-sm',
          description: 'sr-only',
        }"
      >
        <UButton
          :label="t('ui.request.tryItOut')"
          icon="i-lucide-play"
          color="neutral"
          size="xs"
          class="rounded"
        />

        <template #body>
          <form class="space-y-5" novalidate @submit.prevent="execute">
            <div
              class="flex min-w-0 items-start gap-2 rounded-md border border-default bg-muted/40 px-3 py-2.5"
            >
              <MethodBadge :method="operation.method" class="mt-0.5 shrink-0" />
              <span class="break-all font-mono text-xs leading-6">{{ requestUrl }}</span>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <UTabs
                v-model="requestTab"
                :items="requestTabs"
                :content="false"
                variant="link"
                color="neutral"
                size="sm"
                class="min-w-0"
              />
              <UButton
                :label="t('ui.request.reset')"
                icon="i-lucide-rotate-ccw"
                size="xs"
                color="neutral"
                variant="ghost"
                :disabled="pending"
                @click="reset"
              />
            </div>

            <fieldset :disabled="pending" class="min-w-0 space-y-4">
              <template v-if="requestTab === 'body'">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <USelect
                    v-if="contentTypes.length > 1"
                    v-model="contentType"
                    :items="contentTypes"
                    color="neutral"
                    size="xs"
                    :aria-label="t('ui.request.bodyContentType')"
                  />
                  <span v-else class="font-mono text-[11px] text-muted">{{ contentType }}</span>
                  <div class="flex items-center gap-1">
                    <UButton
                      :label="t('ui.request.restoreExample')"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :disabled="pending"
                      @click="resetBody"
                    />
                    <UButton
                      v-if="contentType.includes('json')"
                      :label="t('ui.request.format')"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :disabled="pending"
                      @click="formatBody"
                    />
                  </div>
                </div>
                <UFormField
                  :label="t('ui.common.requestBody')"
                  name="body"
                  :required="operation.requestBody?.required"
                  :error="fieldErrors.body"
                >
                  <UTextarea
                    v-model="body"
                    :rows="10"
                    :disabled="pending"
                    color="neutral"
                    class="w-full"
                    :ui="{ base: 'font-mono text-xs leading-6' }"
                    :spellcheck="false"
                    :placeholder="t('ui.request.bodyPlaceholder')"
                  />
                </UFormField>
              </template>
              <template v-else>
                <div
                  v-if="requestTab === 'headers'"
                  class="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs leading-6 text-muted"
                >
                  <div>Accept: application/json</div>
                  <div v-if="hasBody">Content-Type: {{ contentType }}</div>
                </div>
                <UFormField
                  v-for="parameter in visibleParameters"
                  :key="parameterKey(parameter)"
                  :label="parameter.name"
                  :name="parameterKey(parameter)"
                  :required="parameter.required"
                  :hint="
                    parameter.in === 'path'
                      ? t('ui.request.path')
                      : parameter.in === 'query'
                        ? t('ui.request.query')
                        : undefined
                  "
                  :error="fieldErrors[parameterKey(parameter)]"
                >
                  <div v-if="parameter.schema?.enum" class="flex gap-2">
                    <USelect
                      v-model="values[parameterKey(parameter)]"
                      :items="enumItems(parameter)"
                      :placeholder="
                        parameter.required
                          ? t('ui.request.selectValue')
                          : t('ui.request.omitParameter')
                      "
                      :disabled="pending"
                      color="neutral"
                      class="min-w-0 flex-1 font-mono"
                    />
                    <UButton
                      v-if="!parameter.required"
                      icon="i-lucide-x"
                      color="neutral"
                      variant="outline"
                      :aria-label="t('ui.request.clearParameter', { name: parameter.name })"
                      :disabled="pending || !values[parameterKey(parameter)]"
                      @click="values[parameterKey(parameter)] = ''"
                    />
                  </div>
                  <UInput
                    v-else
                    v-model="values[parameterKey(parameter)]"
                    :placeholder="
                      parameter.required
                        ? schemaType(parameter.schema || {})
                        : t('ui.request.optionalParameter')
                    "
                    :disabled="pending"
                    color="neutral"
                    class="w-full"
                    :ui="{ base: 'font-mono text-xs' }"
                  />
                </UFormField>
                <p v-if="!visibleParameters.length" class="py-2 text-xs text-muted">
                  {{
                    requestTab === 'headers'
                      ? t('ui.request.noAdditionalHeaders')
                      : t('ui.request.noParameters')
                  }}
                </p>
              </template>
            </fieldset>

            <UAlert
              v-if="error"
              color="error"
              variant="subtle"
              :description="error"
              :ui="{ description: 'text-xs' }"
            />

            <div class="flex gap-2 border-t border-default pt-4">
              <UButton
                type="submit"
                icon="i-lucide-play"
                :label="pending ? t('ui.request.sending') : t('ui.request.send')"
                :loading="pending"
                color="neutral"
                class="rounded-md"
              />
              <UButton
                v-if="pending"
                :label="t('ui.request.cancel')"
                color="neutral"
                variant="outline"
                @click="cancel"
              />
            </div>
          </form>

          <section
            v-if="pending || result"
            class="mt-6 border-t border-default pt-5"
            :aria-label="t('ui.request.liveResponse')"
            aria-live="polite"
            :aria-busy="pending"
          >
            <div v-if="pending" class="flex items-center gap-2 text-xs text-muted" role="status">
              <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />{{
                t('ui.request.waiting')
              }}
            </div>
            <template v-else-if="result">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-[15px] font-semibold leading-6 text-highlighted">
                  {{ t('ui.request.response') }}
                </h2>
                <div class="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                  <UBadge :color="responseColor" variant="soft" size="sm"
                    >{{ result.status }} {{ result.statusText }}</UBadge
                  >
                  <span>{{ t('ui.request.duration', { value: result.duration }) }}</span>
                  <span>{{ sizeLabel }}</span>
                </div>
              </div>
              <UTabs
                v-model="responseTab"
                :items="responseTabs"
                :content="false"
                variant="link"
                color="neutral"
                size="sm"
                class="mb-3"
              />
              <CodeBlock
                :code="responseTab === 'body' ? result.body : result.headers"
                :label="
                  responseTab === 'body' ? result.contentType : t('ui.request.responseHeaders')
                "
              />
            </template>
          </section>
        </template>
      </UModal>
    </div>
  </section>
</template>
