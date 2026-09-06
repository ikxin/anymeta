<script setup lang="ts">
defineProps<{ method: string }>()
</script>

<template>
  <span class="api-method" :data-method="method.toUpperCase()">
    {{ method.toUpperCase() }}
  </span>
</template>
