<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()
const toast = useToast()
const switching = ref(false)
const flags: Record<string, string> = {
  en: 'i-flag-us-4x3',
  'zh-cn': 'i-flag-cn-4x3',
  'zh-tw': 'i-flag-tw-4x3',
  ja: 'i-flag-jp-4x3',
  ko: 'i-flag-kr-4x3',
}
const items = computed(() =>
  locales.value.map((item) => ({
    label: item.name || item.code,
    value: item.code,
    icon: flags[item.code],
  })),
)

async function changeLocale(value: string) {
  const code = locales.value.find((item) => item.code === value)?.code
  if (!code || code === locale.value || switching.value) return
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
  <USelectMenu
    :model-value="locale"
    :items="items"
    value-key="value"
    :icon="flags[locale]"
    :search-input="false"
    :content="{ align: 'end' }"
    color="neutral"
    variant="ghost"
    size="sm"
    class="w-28"
    :aria-label="t('site.chooseLanguage')"
    :title="t('site.chooseLanguage')"
    :loading="switching"
    :disabled="switching"
    @update:model-value="changeLocale"
  />
</template>
