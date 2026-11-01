<script setup lang="ts">
import type { OpenApiDocument } from '~/utils/openapi'
import { findOperationByRoute, groupOperations, operationLink } from '~/utils/navigation'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const search = ref('')
const navigationOpen = ref(false)
const navigationVisible = ref(true)
const openedIds = ref<string[]>([])
const {
  data: document,
  status,
  error,
  refresh,
} = await useFetch<OpenApiDocument>('/_openapi.json', { key: 'anymeta-openapi' })
const { operations } = useReference()
const selectedOperation = computed(() => findOperationByRoute(operations.value, route.params))
const selectedId = computed(() => selectedOperation.value?.id)
const platforms = computed(() =>
  groupOperations(operations.value).flatMap((platform) => {
    const operation = platform.categories[0]?.operations[0]
    return operation
      ? [{ id: platform.id, label: platform.label, to: localePath(operationLink(operation)) }]
      : []
  }),
)
const selectedPlatform = computed(() =>
  platforms.value.find((platform) => platform.id === selectedOperation.value?.platform),
)
const navigationOperations = computed(() =>
  selectedPlatform.value
    ? operations.value.filter((operation) => operation.platform === selectedPlatform.value?.id)
    : operations.value,
)
const openedOperations = computed(() =>
  openedIds.value.flatMap((id) => {
    const operation = operations.value.find((operation) => operation.id === id)
    return operation ? [operation] : []
  }),
)
const origin = useRequestURL().origin
const workspaceContent = useTemplateRef<HTMLElement>('workspaceContent')

watch(
  selectedId,
  (id) => {
    if (id && !openedIds.value.includes(id)) openedIds.value.push(id)
  },
  { immediate: true },
)

watch(
  () => route.params.platform,
  () => {
    search.value = ''
  },
)

watch(
  () => route.path,
  () => {
    navigationOpen.value = false
    workspaceContent.value?.scrollTo({ top: 0 })
  },
)

function closeTab(id: string) {
  const index = openedIds.value.indexOf(id)
  openedIds.value = openedIds.value.filter((openedId) => openedId !== id)
  if (selectedId.value !== id) return
  const nextId = openedIds.value[Math.max(0, index - 1)]
  const next = operations.value.find((operation) => operation.id === nextId)
  navigateTo(next ? localePath(operationLink(next)) : localePath('index'))
}
</script>

<template>
  <div class="flex h-dvh min-h-0 flex-col overflow-hidden bg-default">
    <a
      href="#api-content"
      class="sr-only rounded bg-primary px-4 py-2 text-inverted focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50"
      >{{ t('site.skipToContent') }}</a
    >

    <header class="z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-default bg-default px-3 sm:px-5">
      <div class="flex min-w-0 items-center gap-3">
        <USlideover
          v-model:open="navigationOpen"
          side="left"
          :title="selectedPlatform?.label || t('site.reference')"
          :description="t('site.navigationDescription')"
          :ui="{ content: 'max-w-80', body: 'p-0 sm:p-0' }"
        >
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            size="sm"
            class="lg:hidden"
            :aria-label="t('site.openNavigation')"
          />
          <template #body>
            <Navigation
              v-model="search"
              :operations="navigationOperations"
              :selected-id="selectedId"
              @select="navigationOpen = false"
            />
          </template>
        </USlideover>
        <NuxtLink
          :to="localePath('index')"
          class="flex shrink-0 items-center gap-2.5"
          :aria-label="t('site.home')"
        >
          <span class="flex size-8 items-center justify-center rounded-[10px] bg-primary text-white shadow-sm shadow-primary/15">
            <UIcon name="i-lucide-layers-2" class="size-5" />
          </span>
          <span class="text-[17px] font-bold tracking-tight text-highlighted">AnyMeta<span class="text-primary">.</span></span>
        </NuxtLink>
        <span class="mx-2 hidden h-5 w-px bg-accented sm:block" />
        <div class="hidden min-w-0 items-center gap-2 sm:flex">
          <UIcon name="i-lucide-box" class="size-4 shrink-0 text-muted" />
          <span class="truncate text-xs font-medium text-highlighted">{{ t('workspace.title') }}</span>
          <span v-if="document?.info?.version" class="rounded border border-default bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted">
            v{{ document.info.version }}
          </span>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1 sm:gap-2">
        <UButton
          to="/_openapi.json"
          external
          :locale="false"
          target="_blank"
          icon="i-lucide-file-json"
          :aria-label="t('site.openapiDocument')"
          label="OpenAPI"
          color="neutral"
          variant="ghost"
          size="xs"
          class="hidden sm:inline-flex"
        />
        <span class="mx-1 hidden h-4 w-px bg-accented sm:block" />
        <LocaleSelect />
        <UColorModeButton size="sm" />
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="hidden w-16 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-default bg-reference-panel py-4 lg:flex" :aria-label="t('workspace.title')">
        <NuxtLink
          :to="localePath('index')"
          :aria-label="t('site.home')"
          :title="t('site.home')"
          :aria-current="!selectedId ? 'page' : undefined"
          class="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-highlighted aria-[current=page]:bg-reference-selected aria-[current=page]:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <UIcon name="i-lucide-house" class="size-5" />
        </NuxtLink>
        <NuxtLink
          v-for="platform in platforms"
          :key="platform.id"
          :to="platform.to"
          :aria-label="platform.label"
          :title="platform.label"
          :aria-current="selectedPlatform?.id === platform.id ? 'page' : undefined"
          class="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-elevated hover:text-highlighted aria-[current=page]:bg-reference-selected aria-[current=page]:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          @click="navigationVisible = true"
        >
          <PlatformIcon :platform="platform.id" plain />
        </NuxtLink>
      </aside>

      <aside
        v-show="navigationVisible"
        id="desktop-navigation"
        class="hidden w-64 shrink-0 flex-col border-r border-default bg-default lg:flex xl:w-68"
      >
        <div class="flex h-15 shrink-0 items-center justify-between px-4">
          <div class="flex items-center gap-2">
            <PlatformIcon v-if="selectedPlatform" :platform="selectedPlatform.id" compact />
            <span v-else class="flex size-7 items-center justify-center rounded-lg bg-reference-selected text-primary">
              <UIcon name="i-lucide-braces" class="size-4" />
            </span>
            <span class="text-[13px] font-semibold text-highlighted">{{ selectedPlatform?.label || t('workspace.apiCollection') }}</span>
          </div>
          <span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted">{{ navigationOperations.length }}</span>
        </div>
        <Navigation
          v-model="search"
          :operations="navigationOperations"
          :selected-id="selectedId"
          class="min-h-0 flex-1"
        />
      </aside>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div class="flex h-11 shrink-0 items-stretch border-b border-default bg-muted">
          <div class="flex min-w-0 flex-1 overflow-x-auto" :aria-label="t('site.reference')">
            <div class="relative flex min-w-0 shrink-0 items-center border-r border-default text-muted before:absolute before:inset-x-0 before:top-0 before:h-0.5 data-[active=true]:bg-default data-[active=true]:text-highlighted data-[active=true]:before:bg-primary" :data-active="!selectedId">
              <NuxtLink :to="localePath('index')" class="flex h-full items-center gap-2 px-5 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :aria-current="!selectedId ? 'page' : undefined">
                <UIcon name="i-lucide-house" class="size-3.5" />
                {{ t('site.overview') }}
              </NuxtLink>
            </div>
            <div v-for="operation in openedOperations" :key="operation.id" class="relative flex min-w-0 shrink-0 items-center border-r border-default text-muted before:absolute before:inset-x-0 before:top-0 before:h-0.5 data-[active=true]:bg-default data-[active=true]:text-highlighted data-[active=true]:before:bg-primary" :data-active="selectedId === operation.id">
              <NuxtLink :to="localePath(operationLink(operation))" class="flex h-full max-w-60 items-center gap-2 py-2 pr-1 pl-4 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :aria-current="selectedId === operation.id ? 'page' : undefined">
                <MethodBadge :method="operation.method" class="text-[9px]" />
                <span class="truncate">{{ operation.summary }}</span>
              </NuxtLink>
              <button type="button" class="mx-2 flex size-5 shrink-0 items-center justify-center rounded text-muted hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary" :aria-label="t('workspace.closeTab', { name: operation.summary })" @click="closeTab(operation.id)">
                <UIcon name="i-lucide-x" class="size-3" />
              </button>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2 border-l border-default px-3">
            <div class="hidden items-center gap-1.5 text-[11px] text-muted sm:flex" :title="origin">
              <span class="size-1.5 rounded-full bg-reference-get" />
              {{ t('workspace.environment') }}
            </div>
            <UButton
              :icon="navigationVisible ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
              :aria-label="t(navigationVisible ? 'workspace.collapseNavigation' : 'workspace.expandNavigation')"
              color="neutral"
              variant="ghost"
              size="xs"
              class="hidden lg:inline-flex"
              @click="navigationVisible = !navigationVisible"
            />
          </div>
        </div>

        <main id="api-content" ref="workspaceContent" class="min-h-0 min-w-0 flex-1 overflow-y-auto bg-reference-panel" tabindex="-1">
          <div v-if="status === 'pending'" class="mx-auto max-w-6xl space-y-6 p-6 sm:p-10" role="status" :aria-label="t('site.loading')">
            <USkeleton class="h-5 w-36" />
            <USkeleton class="h-9 w-72 max-w-full" />
            <div class="grid gap-4 sm:grid-cols-3">
              <USkeleton v-for="index in 3" :key="index" class="h-28" />
            </div>
            <USkeleton class="h-72 w-full" />
          </div>
          <UAlert v-else-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="t('site.loadErrorTitle')" :description="t('site.loadErrorDescription')" class="m-6">
            <template #actions>
              <UButton :label="t('site.retry')" color="error" variant="outline" @click="refresh()" />
            </template>
          </UAlert>
          <slot v-else-if="document" />
        </main>
      </div>
    </div>
  </div>
</template>
