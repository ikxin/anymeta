<script setup lang="ts">
const uiLocale = useUiLocale()
const localeHead = useLocaleHead({ seo: false })
useHead(() => ({ htmlAttrs: localeHead.value.htmlAttrs }))
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
