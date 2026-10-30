<script setup lang="ts">
import type { ApiOperation } from '~/utils/openapi'
import { operationLink } from '~/utils/api-navigation'

const { document, operations } = useApiReference()
const { t } = useI18n()
const localePath = useLocalePath()
const groups = computed(() => {
  const result = new Map<string, ApiOperation[]>()
  for (const operation of operations.value) {
    const group = result.get(operation.tag) || []
    group.push(operation)
    result.set(operation.tag, group)
  }
  return Array.from(result, ([tag, operations]) => ({ tag, operations }))
})

useSeoMeta({
  title: () => t('site.pageTitle'),
  description: () => t('site.pageDescription'),
})
</script>

<template>
  <div class="grid min-w-0 gap-9 xl:grid-cols-2 xl:gap-x-12">
    <header>
      <h1 class="text-2xl font-semibold leading-8 tracking-tight text-highlighted">
        {{ document?.info?.title || 'AnyMeta API' }}
      </h1>
      <p class="mt-4 text-sm leading-7">{{ t('site.description') }}</p>
    </header>

    <div class="min-w-0 space-y-6 xl:pt-11">
      <section v-for="group in groups" :key="group.tag">
        <h2 class="mb-2 text-[15px] font-semibold leading-6 text-highlighted">{{ group.tag }}</h2>
        <div
          class="divide-y divide-default overflow-hidden rounded-md border border-default bg-reference-panel"
        >
          <NuxtLink
            v-for="operation in group.operations"
            :key="operation.id"
            :to="localePath(operationLink(operation))"
            :aria-label="operation.summary"
            :title="operation.summary"
            class="flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <ApiMethodBadge :method="operation.method" class="w-9" />
            <code class="min-w-0 break-all text-xs leading-5">{{ operation.path }}</code>
          </NuxtLink>
        </div>
      </section>
      <UAlert
        v-if="!operations.length"
        color="neutral"
        variant="subtle"
        :title="t('site.noEndpointsTitle')"
        :description="t('site.noEndpointsDescription')"
      />
    </div>
  </div>
</template>
