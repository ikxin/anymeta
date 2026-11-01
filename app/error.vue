<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: false })
const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => t(notFound.value ? 'site.pageNotFound' : 'site.errorTitle'))

useHead(() => ({ htmlAttrs: localeHead.value.htmlAttrs }))
useSeoMeta({ title: () => `${title.value} · AnyMeta`, robots: 'noindex' })
</script>

<template>
  <UApp>
    <main class="flex min-h-dvh items-center justify-center bg-reference-panel px-5 py-16">
      <div class="w-full max-w-md rounded-2xl border border-default bg-default p-8 text-center sm:p-12">
        <span class="mx-auto mb-7 flex size-11 items-center justify-center rounded-xl bg-primary text-white"><UIcon name="i-lucide-layers-2" class="size-6" /></span>
        <p class="mb-4 font-mono text-6xl font-semibold tracking-tight text-primary/30">{{ error.statusCode }}</p>
        <h1 class="text-xl font-semibold tracking-tight text-highlighted">{{ title }}</h1>
        <p class="mt-3 text-xs leading-6 text-muted">
          {{ t(notFound ? 'site.pageNotFoundDescription' : 'site.errorDescription') }}
        </p>
        <UButton
          class="mt-7 rounded-lg"
          icon="i-lucide-arrow-left"
          :label="t('site.backToReference')"
          @click="clearError({ redirect: localePath('index') })"
        />
      </div>
    </main>
  </UApp>
</template>
