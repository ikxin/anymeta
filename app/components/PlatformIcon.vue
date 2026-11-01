<script setup lang="ts">
defineProps<{ platform: string; compact?: boolean; plain?: boolean }>()

const icons: Record<string, string> = {
  github: 'i-lucide-github',
  npmjs: 'i-lucide-boxes',
  crates: 'i-lucide-package',
  pypi: 'i-lucide-flask-conical',
  opencollective: 'i-lucide-circle-dollar-sign',
}

const colors: Record<string, string> = {
  github: 'bg-[#edf0f5] text-[#404858] dark:bg-[#2a303d] dark:text-[#aab4c7]',
  npmjs: 'bg-[#fff0f0] text-[#d65355] dark:bg-[#39282e] dark:text-[#f18c8e]',
  crates: 'bg-[#fbf2e8] text-[#b27840] dark:bg-[#342d26] dark:text-[#d6a773]',
  pypi: 'bg-[#edf5fc] text-[#4285b3] dark:bg-[#253241] dark:text-[#78b2de]',
  opencollective: 'bg-[#f2effd] text-[#7d6bd3] dark:bg-[#302b43] dark:text-[#aa9ae9]',
}
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center"
    :class="[
      compact ? 'size-5 rounded-md' : 'size-10 rounded-xl',
      !plain && (colors[platform] || 'bg-[#f0f2f6] text-[#666f83] dark:bg-[#2a303d] dark:text-[#aab4c7]'),
    ]"
    aria-hidden="true"
  >
    <UIcon :name="icons[platform] || 'i-lucide-box'" :class="compact ? 'size-3.5' : 'size-5'" />
  </span>
</template>
