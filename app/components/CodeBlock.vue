<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    code: string
    label?: string
    maxHeightClass?: string
  }>(),
  {
    label: 'JSON',
    maxHeightClass: 'max-h-112',
  },
)

const { t } = useI18n()
const toast = useToast()
const copied = ref(false)
const lineCount = computed(() => (props.code || t('ui.code.empty')).split('\n').length)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const tokenClasses = {
  key: 'text-[#2b6297] dark:text-[#86a9d4]',
  command: 'text-[#2b6297] dark:text-[#86a9d4]',
  string: 'text-[#367452] dark:text-[#a1bea3]',
  literal: 'text-[#a65a25] dark:text-[#d3a276]',
  keyword: 'text-[#79549c] dark:text-[#b19bcd]',
} as const

const tokens = computed(() => {
  const source = props.code || t('ui.code.empty')
  const result: { text: string; kind?: keyof typeof tokenClasses }[] = []
  const pattern =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?)|\b(const|let|await|return|import|from)\b|(--[\w-]+)|\b(curl|fetch|console)\b/g
  let offset = 0
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > offset) result.push({ text: source.slice(offset, index) })
    const kind = match[1]
      ? /^\s*:/.test(source.slice(index + match[0].length))
        ? 'key'
        : 'string'
      : match[2] || match[3]
        ? 'literal'
        : match[4]
          ? 'keyword'
          : 'command'
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
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.add({
      title: t('ui.code.copyFailed'),
      description: t('ui.code.copyManually'),
      color: 'error',
    })
  }
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-default bg-reference-panel">
    <div class="flex min-h-10 items-center justify-between gap-3 border-b border-default bg-default/60 px-3 py-1">
      <div class="min-w-0 flex-1 font-mono text-[10px] text-muted">
        <slot name="label">{{ label }}</slot>
      </div>
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
      <div
        class="flex overflow-auto font-mono text-[11px] leading-6"
        :class="maxHeightClass"
        tabindex="0"
        role="region"
        :aria-label="label"
      >
        <div class="sticky left-0 shrink-0 border-r border-default bg-reference-panel px-3 py-3 text-right text-muted/50 select-none" aria-hidden="true">
          <span v-for="line in lineCount" :key="line" class="block">{{ line }}</span>
        </div>
        <pre class="min-w-max flex-1 px-4 py-3"><code><span v-for="(token, index) in tokens" :key="index" :class="token.kind ? tokenClasses[token.kind] : undefined">{{ token.text }}</span></code></pre>
      </div>
    </slot>
    <div v-if="$slots.footer" class="border-t border-default px-4 py-3 text-[11px] leading-5 text-muted">
      <slot name="footer" />
    </div>
  </div>
</template>
