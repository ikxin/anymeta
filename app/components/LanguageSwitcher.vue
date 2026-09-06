<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()
const toast = useToast()
const switching = ref(false)
const items = computed(() => locales.value.map(item => ({
  label: item.name || item.code,
  icon: item.code === locale.value ? 'i-lucide-check' : undefined,
  disabled: switching.value,
  onSelect: () => changeLocale(item.code),
})))

async function changeLocale(code: typeof locale.value) {
  if (code === locale.value || switching.value) return
  switching.value = true
  try {
    await setLocale(code)
  } catch {
    toast.add({ title: t('site.switchError'), color: 'error' })
  } finally {
    switching.value = false
  }
}
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <UButton icon="i-lucide-languages" color="neutral" variant="ghost" size="xs" :aria-label="t('site.chooseLanguage')" :title="t('site.chooseLanguage')" :loading="switching" />
  </UDropdownMenu>
</template>
