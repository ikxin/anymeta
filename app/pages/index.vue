<script setup lang="ts">
import { groupOperations, operationLink } from '~/utils/navigation'

const { document, operations } = useReference()
const { t } = useI18n()
const localePath = useLocalePath()
const groups = computed(() => groupOperations(operations.value))

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
      <section v-for="platform in groups" :key="platform.id" class="space-y-4">
        <h2 class="text-lg font-semibold leading-7 text-highlighted">{{ platform.label }}</h2>
        <div v-for="category in platform.categories" :key="category.id">
          <h3 class="mb-2 text-[15px] font-medium leading-6 text-highlighted">{{ category.label }}</h3>
          <div
            class="divide-y divide-default overflow-hidden rounded-md border border-default bg-reference-panel"
          >
            <NuxtLink
              v-for="operation in category.operations"
              :key="operation.id"
              :to="localePath(operationLink(operation))"
              :aria-label="operation.summary"
              :title="operation.summary"
              class="flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <MethodBadge :method="operation.method" class="w-9" />
              <code class="min-w-0 break-all text-xs leading-5">{{ operation.path }}</code>
            </NuxtLink>
          </div>
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
