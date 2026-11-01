<script setup lang="ts">
defineProps<{ method: string }>()
</script>

<template>
  <span
    class="inline-flex min-w-9 shrink-0 items-center justify-center rounded px-1.5 font-mono text-[10px] font-bold leading-5 data-[method=GET]:bg-reference-get/10 data-[method=GET]:text-reference-get data-[method=POST]:bg-reference-post/10 data-[method=POST]:text-reference-post data-[method=DELETE]:bg-error/10 data-[method=DELETE]:text-error data-[method=PUT]:bg-info/10 data-[method=PUT]:text-info data-[method=PATCH]:bg-warning/10 data-[method=PATCH]:text-warning"
    :data-method="method.toUpperCase()"
  >
    {{ method.toUpperCase() }}
  </span>
</template>
