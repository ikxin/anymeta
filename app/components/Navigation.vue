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
</script>

<template>
  <nav :aria-label="t('site.reference')" class="flex h-full min-h-0 flex-col">
    <div class="shrink-0 px-3 pb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        :placeholder="t('site.searchEndpoints')"
        :aria-label="t('site.searchEndpoints')"
        color="neutral"
        size="sm"
        class="w-full"
        :ui="{ base: 'rounded border-default text-xs' }"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <NuxtLink
        :to="localePath('index')"
        :aria-current="!selectedId ? 'page' : undefined"
        class="mb-2 flex min-h-8 items-center gap-2 rounded px-2.5 py-1.5 text-[13px] leading-5 text-muted transition-colors duration-120 ease-linear hover:bg-reference-selected hover:text-highlighted aria-[current=page]:bg-reference-selected aria-[current=page]:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        @click="emit('select', '')"
      >
        {{ t('site.overview') }}
      </NuxtLink>

      <section v-for="platform in groups" :key="platform.id" class="mt-5">
        <h2 class="mb-1 px-2.5 text-xs font-semibold leading-6 text-highlighted">
          {{ platform.label }}
        </h2>
        <details
          v-for="category in platform.categories"
          :key="category.id"
          :open="Boolean(search.trim())"
          class="group/navigation mb-1"
        >
          <summary
            class="flex min-h-8 cursor-pointer list-none items-center gap-2 rounded px-2.5 py-1.5 text-[13px] font-medium leading-5 text-muted transition-colors duration-120 ease-linear hover:bg-reference-selected hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
          >
            <span class="min-w-0 flex-1 truncate" :title="category.label">{{
              category.label
            }}</span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3.5 shrink-0 text-muted transition-transform group-open/navigation:rotate-90"
            />
          </summary>
          <div class="ml-3 border-l border-default pl-1">
            <NuxtLink
              v-for="operation in category.operations"
              :key="operation.id"
              :to="localePath(operationLink(operation))"
              :aria-current="selectedId === operation.id ? 'page' : undefined"
              class="flex min-h-8 items-center gap-2 rounded px-2.5 py-1.5 text-[13px] leading-5 text-muted transition-colors duration-120 ease-linear hover:bg-reference-selected hover:text-highlighted aria-[current=page]:bg-reference-selected aria-[current=page]:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :title="operation.summary"
              @click="emit('select', operation.id)"
            >
              <span class="min-w-0 flex-1 truncate">{{ operation.summary }}</span>
              <MethodBadge :method="operation.method" class="w-9 text-right" />
            </NuxtLink>
          </div>
        </details>
      </section>

      <div v-if="!groups.length" class="px-2 py-8 text-center text-xs text-muted">
        <p>{{ t('site.noMatches') }}</p>
        <UButton
          :label="t('site.clearSearch')"
          color="neutral"
          variant="link"
          size="xs"
          @click="search = ''"
        />
      </div>
    </div>
  </nav>
</template>
