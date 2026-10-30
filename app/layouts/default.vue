<script setup lang="ts">
import type { OpenApiDocument } from '~/utils/openapi'

const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const search = ref('')
const navigationOpen = ref(false)
const {
  data: document,
  status,
  error,
  refresh,
} = await useFetch<OpenApiDocument>('/_openapi.json', { key: 'anymeta-openapi' })
const { operations } = useApiReference()
const selectedId = computed(() =>
  typeof route.params.operation === 'string' ? route.params.operation : undefined,
)

watch(
  () => route.path,
  () => {
    navigationOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-default">
    <a
      href="#api-content"
      class="sr-only rounded bg-primary px-4 py-2 text-inverted focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50"
      >{{ t('site.skipToContent') }}</a
    >

    <aside
      class="fixed inset-y-0 left-0 z-20 hidden w-70 flex-col border-r border-default bg-default lg:flex"
    >
      <div class="flex h-14 shrink-0 items-center justify-between px-5">
        <NuxtLink
          :to="localePath('index')"
          class="text-sm font-semibold tracking-tight text-highlighted"
          :aria-label="t('site.home')"
          >AnyMeta</NuxtLink
        >
        <span v-if="document?.info?.version" class="font-mono text-[11px] text-muted"
          >v{{ document.info.version }}</span
        >
      </div>
      <ApiNavigation
        v-model="search"
        :operations="operations"
        :selected-id="selectedId"
        class="min-h-0 flex-1"
      />
      <div class="flex h-12 shrink-0 items-center justify-between border-t border-default px-3">
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
        />
        <div class="flex items-center gap-1">
          <LanguageSwitcher />
          <UColorModeButton size="xs" />
        </div>
      </div>
    </aside>

    <header
      class="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-default bg-default px-3 lg:hidden"
    >
      <div class="flex items-center gap-2">
        <USlideover
          v-model:open="navigationOpen"
          side="left"
          :title="t('site.reference')"
          :description="t('site.navigationDescription')"
          :ui="{ content: 'max-w-80', body: 'p-0 sm:p-0' }"
        >
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="t('site.openNavigation')"
          />
          <template #body>
            <ApiNavigation
              v-model="search"
              :operations="operations"
              :selected-id="selectedId"
              @select="navigationOpen = false"
            />
          </template>
        </USlideover>
        <NuxtLink
          :to="localePath('index')"
          class="text-sm font-semibold text-highlighted"
          :aria-label="t('site.home')"
          >AnyMeta</NuxtLink
        >
      </div>
      <div class="flex items-center gap-1">
        <UButton
          to="/_openapi.json"
          external
          :locale="false"
          target="_blank"
          icon="i-lucide-file-json"
          :aria-label="t('site.openapiDocument')"
          color="neutral"
          variant="ghost"
          size="xs"
        />
        <LanguageSwitcher />
        <UColorModeButton size="xs" />
      </div>
    </header>

    <div class="lg:ml-70">
      <main
        id="api-content"
        class="mx-auto w-full min-w-0 max-w-360 px-5 pt-9 pb-16 sm:px-8 sm:pt-12 sm:pb-20 lg:px-[clamp(32px,4vw,60px)] lg:pt-18 lg:pb-24"
        tabindex="-1"
      >
        <div
          v-if="status === 'pending'"
          class="space-y-5"
          role="status"
          :aria-label="t('site.loading')"
        >
          <USkeleton class="h-7 w-56" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-60 w-full" />
        </div>
        <UAlert
          v-else-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="t('site.loadErrorTitle')"
          :description="t('site.loadErrorDescription')"
        >
          <template #actions
            ><UButton :label="t('site.retry')" color="error" variant="outline" @click="refresh()"
          /></template>
        </UAlert>
        <slot v-else-if="document" />
      </main>
    </div>
  </div>
</template>
