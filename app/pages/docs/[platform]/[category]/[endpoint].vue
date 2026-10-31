<script setup lang="ts">
import { findOperationByRoute } from '~/utils/navigation'

definePageMeta({ key: (route) => route.path })

const route = useRoute()
const { t } = useI18n()
const { document, operations } = useReference()
const operation = computed(() => findOperationByRoute(operations.value, route.params))

if (!operation.value) {
  throw createError({ statusCode: 404, statusMessage: 'Endpoint not found', fatal: true })
}

useSeoMeta({
  title: () => `${operation.value?.summary || t('site.endpointFallback')} · AnyMeta`,
  description: () => operation.value?.description || t('site.endpointDescription'),
})
</script>

<template>
  <Operation
    v-if="operation && document"
    :key="operation.id"
    :operation="operation"
    :document="document"
  />
</template>
