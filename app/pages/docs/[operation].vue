<script setup lang="ts">
definePageMeta({ key: route => route.path })

const route = useRoute()
const { t } = useI18n()
const { document, operations } = useApiReference()
const operationId = typeof route.params.operation === 'string' ? route.params.operation : ''
const operationIndex = computed(() => operations.value.findIndex(operation => operation.id === operationId))
const operation = computed(() => operations.value[operationIndex.value])

if (!operation.value) {
  throw createError({ statusCode: 404, statusMessage: 'Endpoint not found', fatal: true })
}

useSeoMeta({
  title: () => `${operation.value?.summary || t('site.endpointFallback')} · AnyMeta`,
  description: () => operation.value?.description || t('site.endpointDescription'),
})
</script>

<template>
  <ApiOperation v-if="operation && document" :key="operation.id" :operation="operation" :document="document" />
</template>
