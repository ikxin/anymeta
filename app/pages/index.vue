<script setup lang="ts">
import { groupOperations, operationLink } from '~/utils/navigation'
import { parameterValue } from '~/utils/openapi'

const { operations } = useReference()
const { t } = useI18n()
const localePath = useLocalePath()
const origin = useRequestURL().origin
const groups = computed(() => groupOperations(operations.value))
const activePlatform = ref('')
const search = ref('')
const showAll = ref(false)
const categoryCount = computed(() =>
  groups.value.reduce((count, platform) => count + platform.categories.length, 0),
)
const filteredOperations = computed(() => {
  const query = search.value.trim().toLowerCase()
  return operations.value.filter(
    (operation) =>
      (!activePlatform.value || operation.platform === activePlatform.value) &&
      (!query ||
        `${operation.summary} ${operation.path} ${operation.method}`.toLowerCase().includes(query)),
  )
})
const visibleOperations = computed(() =>
  showAll.value ? filteredOperations.value : filteredOperations.value.slice(0, 8),
)
const firstOperation = computed(() =>
  operations.value.find(
    (operation) =>
      operation.platform === 'github' && operation.category === 'repos' && operation.endpoint === 'get',
  ) || operations.value[0],
)
const sampleOperation = computed(() =>
  operations.value.find(
    (operation) =>
      operation.platform === 'npmjs' && operation.category === 'packages' && operation.endpoint === 'get',
  ) || firstOperation.value,
)
const sampleCode = computed(() => {
  const operation = sampleOperation.value
  if (!operation) return ''
  const path = operation.path.replace(/\{([^{}]+)\}/g, (placeholder, name: string) => {
    const parameter = operation.parameters.find(
      (parameter) => parameter.in === 'path' && parameter.name === name,
    )
    const value = parameter ? parameterValue(parameter) : ''
    return value ? encodeURIComponent(value) : placeholder
  })
  return `curl --request ${operation.method} \\\n  '${origin}${path}'`
})
const steps = computed(() => [
  { title: t('workspace.selectEndpoint'), description: t('workspace.selectEndpointDescription') },
  { title: t('workspace.configureRequest'), description: t('workspace.configureRequestDescription') },
  { title: t('workspace.inspectResponse'), description: t('workspace.inspectResponseDescription') },
])

watch([activePlatform, search], () => {
  showAll.value = false
})

useSeoMeta({
  title: () => t('site.pageTitle'),
  description: () => t('site.pageDescription'),
})
</script>

<template>
  <div class="mx-auto max-w-7xl p-5 sm:p-8 xl:p-10">
    <div class="mb-7 flex items-center gap-2 text-[11px] text-muted">
      <UIcon name="i-lucide-house" class="size-3.5" />
      <span>AnyMeta</span>
      <UIcon name="i-lucide-chevron-right" class="size-3" />
      <span class="text-highlighted">{{ t('site.overview') }}</span>
    </div>

    <header class="relative mb-7 overflow-hidden">
      <div class="pointer-events-none absolute inset-y-0 right-0 w-64 bg-[radial-gradient(var(--ui-border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-80 [mask-image:linear-gradient(to_right,transparent,black)]" aria-hidden="true" />
      <div class="relative flex flex-wrap items-end justify-between gap-5">
        <div class="max-w-2xl">
          <div class="mb-3 flex items-center gap-2 text-[11px] font-medium text-primary">
            <span class="h-px w-5 bg-primary" />
            {{ t('workspace.publicProject') }}
          </div>
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-[30px] sm:leading-10">{{ t('site.tagline') }}</h1>
          <p class="mt-2.5 max-w-xl text-xs leading-6 text-muted">{{ t('site.intro') }}</p>
        </div>
        <UButton
          v-if="firstOperation"
          :to="localePath(operationLink(firstOperation))"
          :label="t('workspace.getStarted')"
          trailing-icon="i-lucide-arrow-right"
          size="sm"
          class="rounded-lg px-4 shadow-sm shadow-primary/10"
        />
      </div>
    </header>

    <section class="mb-8 grid grid-cols-2 overflow-hidden rounded-xl border border-default bg-default lg:grid-cols-4" :aria-label="t('site.overview')">
      <div class="border-r border-b border-default p-4 lg:border-b-0 xl:p-5">
        <div class="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted"><span>{{ t('workspace.platforms') }}</span><UIcon name="i-lucide-blocks" class="size-4" /></div>
        <div class="flex items-baseline gap-2"><span class="text-3xl font-semibold tracking-tight text-highlighted">{{ groups.length.toString().padStart(2, '0') }}</span><span class="size-1.5 rounded-full bg-primary" /></div>
      </div>
      <div class="border-b border-default p-4 lg:border-r lg:border-b-0 xl:p-5">
        <div class="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted"><span>{{ t('workspace.endpoints') }}</span><UIcon name="i-lucide-network" class="size-4" /></div>
        <span class="text-3xl font-semibold tracking-tight text-highlighted">{{ operations.length }}</span>
      </div>
      <div class="border-r border-default p-4 xl:p-5">
        <div class="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted"><span>{{ t('workspace.categories') }}</span><UIcon name="i-lucide-folder-tree" class="size-4" /></div>
        <span class="text-3xl font-semibold tracking-tight text-highlighted">{{ categoryCount }}</span>
      </div>
      <div class="p-4 xl:p-5">
        <div class="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted"><span>{{ t('workspace.authentication') }}</span><UIcon name="i-lucide-shield-check" class="size-4 text-reference-get" /></div>
        <span class="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-highlighted sm:text-sm"><span class="size-1.5 shrink-0 rounded-full bg-reference-get" />{{ t('site.noAuth') }}</span>
      </div>
    </section>

    <div class="grid min-w-0 items-start gap-7 xl:grid-cols-[minmax(0,1fr)_260px] 2xl:grid-cols-[minmax(0,1fr)_280px]">
      <div class="min-w-0 space-y-7">
        <section>
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted"><UIcon name="i-lucide-boxes" class="size-4 text-muted" />{{ t('workspace.platformDirectory') }}</h2>
            <button v-if="activePlatform" type="button" class="text-[11px] text-primary hover:underline" @click="activePlatform = ''">{{ t('workspace.allPlatforms') }}</button>
            <span v-else class="text-[11px] text-muted">{{ t('workspace.selectPlatform') }}</span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="platform in groups"
              :key="platform.id"
              type="button"
              :aria-pressed="activePlatform === platform.id"
              aria-controls="endpoint-list"
              class="group rounded-xl border bg-default p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :class="activePlatform === platform.id ? 'border-primary/60 ring-1 ring-primary/10' : 'border-default'"
              @click="activePlatform = activePlatform === platform.id ? '' : platform.id"
            >
              <div class="mb-3 flex items-center gap-3">
                <PlatformIcon :platform="platform.id" />
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-[13px] font-semibold text-highlighted">{{ platform.label }}</h3>
                  <span class="text-[10px] text-muted">{{ t('site.endpointCount', platform.categories.reduce((count, category) => count + category.operations.length, 0)) }}</span>
                </div>
                <UIcon :name="activePlatform === platform.id ? 'i-lucide-check' : 'i-lucide-list-filter'" class="size-3.5 self-start text-muted transition-colors group-hover:text-primary" />
              </div>
              <p class="min-h-10 text-xs leading-5 text-muted">{{ t(`workspace.platformDescriptions.${platform.id}`) }}</p>
              <div class="mt-3 flex items-center gap-1.5 border-t border-default pt-3">
                <span v-for="category in platform.categories.slice(0, 2)" :key="category.id" class="max-w-26 truncate rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted">{{ category.label }}</span>
                <span v-if="platform.categories.length > 2" class="font-mono text-[10px] text-muted">+{{ platform.categories.length - 2 }}</span>
              </div>
            </button>
          </div>
        </section>

        <section id="endpoint-list" class="min-w-0">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 class="flex items-center gap-2 text-sm font-semibold text-highlighted"><UIcon name="i-lucide-list-tree" class="size-4 text-muted" />{{ t('site.allEndpoints') }}<span class="rounded bg-elevated px-1.5 py-0.5 font-mono text-[10px] font-normal text-muted">{{ filteredOperations.length }}</span></h2>
            <UInput v-model="search" icon="i-lucide-search" :placeholder="t('site.searchEndpoints')" :aria-label="t('site.searchEndpoints')" color="neutral" size="xs" class="w-full sm:w-48" :ui="{ base: 'rounded-lg text-[11px]' }" />
          </div>
          <div class="overflow-hidden rounded-xl border border-default bg-default">
            <div class="flex items-center gap-3 border-b border-default bg-muted/50 px-4 py-2.5 text-[10px] text-muted">
              <span class="w-11 shrink-0">{{ t('workspace.method') }}</span>
              <span class="flex-1">{{ t('workspace.endpointName') }}</span>
              <span class="hidden w-25 sm:block">{{ t('workspace.platform') }}</span>
              <span class="w-3" />
            </div>
            <div class="divide-y divide-default">
              <NuxtLink
                v-for="operation in visibleOperations"
                :key="operation.id"
                :to="localePath(operationLink(operation))"
                class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <MethodBadge :method="operation.method" class="w-11" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-medium text-highlighted">{{ operation.summary }}</p>
                  <code class="mt-0.5 block truncate text-[10px] text-muted">{{ operation.path }}</code>
                </div>
                <span class="hidden w-25 shrink-0 items-center gap-1.5 text-[10px] text-muted sm:flex"><PlatformIcon :platform="operation.platform" compact />{{ groups.find((platform) => platform.id === operation.platform)?.label }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-muted group-hover:text-primary" />
              </NuxtLink>
            </div>
            <div v-if="!visibleOperations.length" class="px-5 py-10 text-center text-xs text-muted">
              <UIcon name="i-lucide-search-x" class="mb-3 size-7 opacity-50" />
              <p>{{ operations.length ? t('site.noMatches') : t('site.noEndpointsDescription') }}</p>
              <UButton v-if="operations.length" :label="t('site.clearSearch')" variant="link" size="xs" class="mt-2" @click="search = ''; activePlatform = ''" />
            </div>
            <button v-if="filteredOperations.length > 8" type="button" class="flex min-h-10 w-full items-center justify-center gap-1.5 border-t border-default text-[11px] text-muted hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :aria-expanded="showAll" @click="showAll = !showAll">
              {{ t(showAll ? 'workspace.showLess' : 'workspace.viewAll') }}
              <UIcon :name="showAll ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3" />
            </button>
          </div>
        </section>
      </div>

      <aside class="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-1">
        <section class="overflow-hidden rounded-xl border border-default bg-default">
          <div class="flex items-center gap-2 border-b border-default px-5 py-4"><UIcon name="i-lucide-zap" class="size-4 text-primary" /><h2 class="text-xs font-semibold text-highlighted">{{ t('workspace.quickStart') }}</h2></div>
          <ol class="space-y-5 p-5">
            <li v-for="(step, index) in steps" :key="index" class="flex gap-3">
              <div class="flex size-7 shrink-0 items-center justify-center rounded-lg border border-default bg-reference-panel font-mono text-[10px] text-muted">0{{ index + 1 }}</div>
              <div><h3 class="mt-1 text-[11px] font-medium text-highlighted">{{ step.title }}</h3><p class="mt-1 text-[11px] leading-5 text-muted">{{ step.description }}</p></div>
            </li>
          </ol>
          <div class="mx-5 mb-5 rounded-lg bg-reference-selected p-3">
            <div class="flex items-center gap-2 text-[11px] font-medium text-primary"><UIcon name="i-lucide-shield-check" class="size-3.5" />{{ t('site.noToken') }}</div>
            <p class="mt-1.5 text-[10px] leading-5 text-muted">{{ t('site.proxyAuth') }}</p>
          </div>
        </section>
        <section v-if="sampleCode" class="self-start overflow-hidden rounded-xl border border-default bg-default">
          <div class="px-5 pt-4 pb-3"><h2 class="text-xs font-semibold text-highlighted">{{ t('workspace.oneRequest') }}</h2><p class="mt-1.5 text-[11px] leading-5 text-muted">{{ t('workspace.oneRequestDescription') }}</p></div>
          <CodeBlock :code="sampleCode" label="cURL" class="rounded-none! border-x-0! border-b-0!" />
          <NuxtLink v-if="sampleOperation" :to="localePath(operationLink(sampleOperation))" class="flex items-center justify-between border-t border-default px-4 py-3 text-[11px] text-primary hover:bg-muted">
            {{ t('ui.request.tryItOut') }}<UIcon name="i-lucide-arrow-right" class="size-3.5" />
          </NuxtLink>
        </section>
      </aside>
    </div>
  </div>
</template>
