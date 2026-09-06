<script setup lang="ts">
const props = withDefaults(defineProps<{
  code: string
  label?: string
  maxHeight?: string
}>(), {
  label: 'JSON',
  maxHeight: '28rem',
})

const { t } = useI18n()
const toast = useToast()
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const tokens = computed(() => {
  const source = props.code || t('ui.code.empty')
  const result: { text: string, kind?: string }[] = []
  const pattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?)|\b(const|let|await|return|import|from)\b|(--[\w-]+)|\b(curl|fetch|console)\b/g
  let offset = 0
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > offset) result.push({ text: source.slice(offset, index) })
    const kind = match[1]
      ? /^\s*:/.test(source.slice(index + match[0].length)) ? 'key' : 'string'
      : match[2] || match[3] ? 'literal' : match[4] ? 'keyword' : 'command'
    result.push({ text: match[0], kind })
    offset = index + match[0].length
  }
  if (offset < source.length) result.push({ text: source.slice(offset) })
  return result
})

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    toast.add({ title: t('ui.code.copyFailed'), description: t('ui.code.copyManually'), color: 'error' })
  }
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>

<template>
  <div class="reference-panel api-code">
    <div class="reference-panel-header">
      <div class="min-w-0 flex-1 text-xs text-muted"><slot name="label">{{ label }}</slot></div>
      <slot name="actions" />
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="copied ? t('ui.code.copied') : t('ui.code.copy')"
        :title="copied ? t('ui.code.copied') : t('ui.code.copy')"
        color="neutral"
        variant="ghost"
        size="xs"
        :disabled="!code"
        @click="copy"
      />
    </div>
    <slot>
      <pre :style="{ maxHeight }" class="overflow-auto px-3 py-3 font-mono text-xs leading-[1.7]" tabindex="0" :aria-label="label"><code><span v-for="(token, index) in tokens" :key="index" :class="token.kind ? 'code-' + token.kind : undefined">{{ token.text }}</span></code></pre>
    </slot>
    <div v-if="$slots.footer" class="border-t border-default px-3 py-2 text-xs text-muted"><slot name="footer" /></div>
  </div>
</template>
