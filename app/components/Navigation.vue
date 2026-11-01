<script setup lang="ts">
import type { ApiOperation } from '~/utils/openapi'
import { groupOperations, operationLink } from '~/utils/navigation'

const props = defineProps<{
  operations: ApiOperation[]
  selectedId?: string
}>()
const { t } = useI18n()
const localePath = useLocalePath()
const search = defineModel<string>({ default: '' })
const emit = defineEmits<{ select: [id: string] }>()
const collapsedPlatforms = ref<string[]>([])
const expandedCategories = ref<string[]>([])

const groups = computed(() => {
  const query = search.value.trim().toLowerCase()
  return groupOperations(
    props.operations.filter(
      (operation) =>
        !query ||
        [
          operation.method,
          operation.path,
          operation.platform,
          operation.category,
          operation.endpoint,
          operation.tag,
          operation.summary,
          operation.description,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query),
    ),
  )
})

watch(
  () => props.selectedId,
  (id) => {
    const operation = props.operations.find((operation) => operation.id === id)
    if (!operation) return
    const key = `${operation.platform}/${operation.category}`
    if (!expandedCategories.value.includes(key)) expandedCategories.value.push(key)
    collapsedPlatforms.value = collapsedPlatforms.value.filter((platform) => platform !== operation.platform)
  },
  { immediate: true },
)

function togglePlatform(id: string) {
  collapsedPlatforms.value = collapsedPlatforms.value.includes(id)
    ? collapsedPlatforms.value.filter((platform) => platform !== id)
    : [...collapsedPlatforms.value, id]
}

function toggleCategory(key: string) {
  expandedCategories.value = expandedCategories.value.includes(key)
    ? expandedCategories.value.filter((category) => category !== key)
    : [...expandedCategories.value, key]
}
</script>

<template>
  <nav :aria-label="t('site.reference')" class="flex h-full min-h-0 flex-col">
    <div class="shrink-0 px-3 pt-3 pb-3 lg:pt-0">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        :placeholder="t('site.searchEndpoints')"
        :aria-label="t('site.searchEndpoints')"
        color="neutral"
        variant="soft"
        size="sm"
        class="w-full"
        :ui="{ base: 'rounded-lg text-xs bg-muted ring-0', leadingIcon: 'size-3.5' }"
      >
        <template v-if="search" #trailing>
          <button type="button" class="flex items-center text-muted hover:text-highlighted" :aria-label="t('site.clearSearch')" @click="search = ''">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
        </template>
      </UInput>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-5">
      <NuxtLink
        :to="localePath('index')"
        :aria-current="!selectedId ? 'page' : undefined"
        class="mb-4 flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-xs text-muted transition-colors hover:bg-muted hover:text-highlighted aria-[current=page]:bg-reference-selected aria-[current=page]:font-medium aria-[current=page]:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        @click="emit('select', '')"
      >
        <UIcon name="i-lucide-layout-dashboard" class="size-4" />
        {{ t('site.overview') }}
      </NuxtLink>

      <div class="mb-2 flex items-center justify-between px-3 text-[10px] font-medium tracking-wide text-muted">
        <span>{{ t('workspace.platformDirectory') }}</span>
        <span class="font-mono">{{ groups.length }}</span>
      </div>

      <section v-for="platform in groups" :key="platform.id" class="mb-2">
        <h2>
          <button type="button" class="group/platform flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :aria-expanded="Boolean(search.trim()) || !collapsedPlatforms.includes(platform.id)" @click="togglePlatform(platform.id)">
            <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-muted transition-transform" :class="{ 'rotate-90': search.trim() || !collapsedPlatforms.includes(platform.id) }" />
            <PlatformIcon :platform="platform.id" compact />
            <span class="min-w-0 flex-1 truncate text-xs font-semibold text-highlighted">{{ platform.label }}</span>
            <span class="font-mono text-[10px] text-muted">{{ platform.categories.reduce((count, category) => count + category.operations.length, 0) }}</span>
          </button>
        </h2>

        <div v-if="search.trim() || !collapsedPlatforms.includes(platform.id)" class="mt-0.5 ml-3.5 border-l border-default pl-1.5">
          <div v-for="category in platform.categories" :key="category.id" class="mb-0.5">
            <h3>
              <button type="button" class="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-muted hover:bg-muted hover:text-highlighted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :aria-expanded="Boolean(search.trim()) || expandedCategories.includes(`${platform.id}/${category.id}`)" @click="toggleCategory(`${platform.id}/${category.id}`)">
                <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 transition-transform" :class="{ 'rotate-90': search.trim() || expandedCategories.includes(`${platform.id}/${category.id}`) }" />
                <UIcon name="i-lucide-folder" class="size-3.5 shrink-0 text-amber-500/75" />
                <span class="min-w-0 flex-1 truncate" :title="category.label">{{ category.label }}</span>
                <span class="font-mono text-[10px] opacity-60">{{ category.operations.length }}</span>
              </button>
            </h3>
            <div v-if="search.trim() || expandedCategories.includes(`${platform.id}/${category.id}`)" class="mt-0.5 mb-1 space-y-0.5">
              <NuxtLink
                v-for="operation in category.operations"
                :key="operation.id"
                :to="localePath(operationLink(operation))"
                :aria-current="selectedId === operation.id ? 'page' : undefined"
                class="flex min-h-8 items-center gap-2 rounded-md py-1.5 pr-2 pl-5 text-xs text-muted transition-colors hover:bg-muted hover:text-highlighted aria-[current=page]:bg-reference-selected aria-[current=page]:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                :title="`${operation.summary}\n${operation.method} ${operation.path}`"
                @click="emit('select', operation.id)"
              >
                <MethodBadge :method="operation.method" class="min-w-7! px-1! text-[9px]!" />
                <span class="min-w-0 flex-1 truncate">{{ operation.summary }}</span>
                <span v-if="selectedId === operation.id" class="size-1 shrink-0 rounded-full bg-primary" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!groups.length" class="px-3 py-10 text-center text-xs text-muted">
        <UIcon name="i-lucide-search-x" class="mb-3 size-7 opacity-50" />
        <p>{{ t('site.noMatches') }}</p>
        <UButton :label="t('site.clearSearch')" color="primary" variant="link" size="xs" class="mt-2" @click="search = ''" />
      </div>
    </div>
  </nav>
</template>
