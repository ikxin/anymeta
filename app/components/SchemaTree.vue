<script setup lang="ts">
import { resolveSchema, schemaType } from '~/utils/openapi'
import type { ApiSchema, OpenApiDocument } from '~/utils/openapi'

const props = withDefaults(
  defineProps<{
    document: OpenApiDocument
    schema: ApiSchema
    name?: string
    required?: boolean
    depth?: number
  }>(),
  {
    required: false,
    depth: 0,
  },
)

const { t } = useI18n()
const resolved = computed(() => resolveSchema(props.document, props.schema))
const expanded = ref(props.depth === 0)
const maximumDepth = 6

const fields = computed(() =>
  Object.entries(resolved.value.properties ?? {}).map(([name, schema]) => ({
    name,
    schema,
    required: resolved.value.required?.includes(name) ?? false,
  })),
)

const combinations = computed(() =>
  [
    { key: 'oneOf', label: t('ui.schema.oneOf'), schemas: resolved.value.oneOf },
    { key: 'anyOf', label: t('ui.schema.anyOf'), schemas: resolved.value.anyOf },
    { key: 'allOf', label: t('ui.schema.allOf'), schemas: resolved.value.allOf },
  ].filter((group) => group.schemas?.length),
)

const additionalSchema = computed(() => {
  const additional = resolved.value.additionalProperties
  return additional && typeof additional === 'object' ? additional : undefined
})

const hasChildren = computed(() =>
  Boolean(
    fields.value.length ||
    resolved.value.items ||
    additionalSchema.value ||
    combinations.value.length,
  ),
)

const canExpand = computed(() => hasChildren.value && props.depth < maximumDepth)
const nullable = computed(
  () =>
    resolved.value.nullable ||
    (Array.isArray(resolved.value.type) && resolved.value.type.includes('null')),
)

const constraints = computed(() => {
  const schema = resolved.value
  const values: string[] = []
  if (schema.format) values.push(t('ui.schema.format', { value: schema.format }))
  if (schema.minimum !== undefined) values.push(t('ui.common.minimum', { value: schema.minimum }))
  if (schema.maximum !== undefined) values.push(t('ui.common.maximum', { value: schema.maximum }))
  if (schema.additionalProperties === false)
    values.push(t('ui.schema.additionalPropertiesForbidden'))
  if (schema.additionalProperties === true) values.push(t('ui.schema.additionalPropertiesAllowed'))
  return values
})

const hasDetails = computed(() =>
  Boolean(
    resolved.value.description ||
    resolved.value.$ref ||
    constraints.value.length ||
    resolved.value.enum?.length ||
    resolved.value.default !== undefined ||
    resolved.value.example !== undefined ||
    (hasChildren.value && !canExpand.value),
  ),
)

function formatValue(value: unknown) {
  const serialized = JSON.stringify(value)
  if (serialized === undefined) return 'undefined'
  return serialized.length > 240 ? `${serialized.slice(0, 240)}…` : serialized
}

function updateExpanded(event: Event) {
  expanded.value = (event.target as HTMLDetailsElement).open
}
</script>

<template>
  <div class="min-w-0 border-b border-default text-sm last:border-b-0">
    <component
      :is="canExpand ? 'details' : 'div'"
      :open="canExpand ? expanded : undefined"
      class="group/schema"
      @toggle="updateExpanded"
    >
      <component
        :is="canExpand ? 'summary' : 'div'"
        class="flex min-h-9 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 py-2"
        :class="
          canExpand
            ? 'cursor-pointer list-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden'
            : ''
        "
      >
        <UIcon
          v-if="canExpand"
          name="i-lucide-chevron-right"
          class="size-3.5 shrink-0 text-dimmed transition-transform"
          :class="expanded ? 'rotate-90' : ''"
          aria-hidden="true"
        />
        <span v-else class="w-3.5 shrink-0" aria-hidden="true" />
        <span class="min-w-0 break-all font-mono text-xs font-semibold text-highlighted">{{
          name ?? t('ui.schema.title')
        }}</span>
        <span class="font-mono text-[11px] text-muted">{{ schemaType(resolved) }}</span>
        <span v-if="required" class="text-[11px] text-amber-700 dark:text-amber-500">{{
          t('ui.common.required')
        }}</span>
        <span v-if="nullable" class="text-[11px] text-muted">{{ t('ui.schema.nullable') }}</span>
      </component>

      <div v-if="hasDetails" class="space-y-1.5 pb-2 pl-5.5 text-xs leading-5 text-muted">
        <p v-if="resolved.description" class="whitespace-pre-wrap break-words">
          {{ resolved.description }}
        </p>
        <p v-if="resolved.$ref" class="break-all font-mono text-dimmed">
          {{ t('ui.schema.reference', { value: resolved.$ref }) }}
        </p>
        <div v-if="constraints.length" class="flex flex-wrap gap-x-4 gap-y-1 text-dimmed">
          <span v-for="constraint in constraints" :key="constraint">{{ constraint }}</span>
        </div>
        <div v-if="resolved.enum?.length" class="flex flex-wrap items-start gap-1.5">
          <span class="shrink-0">{{ t('ui.schema.allowedValues') }}</span>
          <code
            v-for="(value, index) in resolved.enum.slice(0, 16)"
            :key="index"
            class="max-w-full break-all rounded bg-elevated px-1.5 text-toned"
            >{{ formatValue(value) }}</code
          >
          <span v-if="resolved.enum.length > 16" class="text-dimmed">{{
            t('ui.schema.moreValues', { count: resolved.enum.length - 16 })
          }}</span>
        </div>
        <p v-if="resolved.default !== undefined" class="break-words">
          {{ t('ui.common.defaultLabel') }}
          <code class="break-all text-toned">{{ formatValue(resolved.default) }}</code>
        </p>
        <p v-if="resolved.example !== undefined" class="break-words">
          {{ t('ui.common.exampleLabel') }}
          <code class="break-all text-toned">{{ formatValue(resolved.example) }}</code>
        </p>
        <p v-if="hasChildren && !canExpand" class="text-dimmed">
          {{ t('ui.schema.maximumDepth') }}
        </p>
      </div>

      <div v-if="canExpand && expanded" class="ml-1.5 border-l border-default pl-4">
        <SchemaTree
          v-for="field in fields"
          :key="field.name"
          :document="document"
          :schema="field.schema"
          :name="field.name"
          :required="field.required"
          :depth="depth + 1"
        />
        <SchemaTree
          v-if="resolved.items"
          :document="document"
          :schema="resolved.items"
          :name="t('ui.schema.arrayItem')"
          :depth="depth + 1"
        />
        <SchemaTree
          v-if="additionalSchema"
          :document="document"
          :schema="additionalSchema"
          :name="t('ui.schema.additionalProperty')"
          :depth="depth + 1"
        />
        <div v-for="group in combinations" :key="group.key" class="py-2">
          <p class="mb-1 text-xs font-medium text-muted">{{ group.label }}</p>
          <SchemaTree
            v-for="(branch, index) in group.schemas"
            :key="index"
            :document="document"
            :schema="branch"
            :name="t('ui.schema.numberedSchema', { index: index + 1 })"
            :depth="depth + 1"
          />
        </div>
      </div>
    </component>
  </div>
</template>
