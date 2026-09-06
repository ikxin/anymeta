<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t } = useI18n()
const uiLocale = useUiLocale()
const localePath = useLocalePath()
const localeHead = useLocaleHead({ seo: false })
const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => t(notFound.value ? 'site.pageNotFound' : 'site.errorTitle'))

useHead(() => ({ htmlAttrs: localeHead.value.htmlAttrs }))
useSeoMeta({ title: () => `${title.value} · AnyMeta`, robots: 'noindex' })
</script>

<template>
  <UApp :locale="uiLocale">
    <main class="flex min-h-screen items-center justify-center bg-default px-6 py-16">
      <div class="max-w-md text-center">
        <p class="mb-3 font-mono text-sm text-primary">{{ error.statusCode }}</p>
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted">{{ title }}</h1>
        <p class="mt-4 text-sm leading-7 text-muted">{{ t(notFound ? 'site.pageNotFoundDescription' : 'site.errorDescription') }}</p>
        <UButton class="mt-6" icon="i-lucide-arrow-left" :label="t('site.backToReference')" @click="clearError({ redirect: localePath('index') })" />
      </div>
    </main>
  </UApp>
</template>
