<template>
  <RouterView />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { RouterView } from 'vue-router'

// 这个 onMounted 会在整个应用“外壳”加载时执行一次
onMounted(() => {
  // 我们将创建一个 "tryAutoLogin" 函数来做这件事
  const authStore = useAuthStore()
  authStore.tryAutoLogin()
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>