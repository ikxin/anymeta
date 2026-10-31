<script setup lang="ts">
defineProps<{ method: string }>()
</script>

<template>
  <span
    class="shrink-0 font-mono text-[10px] font-semibold leading-[18px] data-[method=GET]:text-reference-get data-[method=POST]:text-reference-post data-[method=DELETE]:text-error data-[method=PUT]:text-warning data-[method=PATCH]:text-warning"
    :data-method="method.toUpperCase()"
  >
    {{ method.toUpperCase() }}
  </span>
</template>
