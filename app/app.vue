<script setup lang="ts">
const localeHead = useLocaleHead({ seo: false })
useHead(() => ({ htmlAttrs: localeHead.value.htmlAttrs }))
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
