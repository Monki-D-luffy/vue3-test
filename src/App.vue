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
/* 删除所有旧的 scoped 样式。
  只保留(或添加)这个全局的 body 样式重置，
  这能解决您之前遇到的“登录页偏右”的布局问题。
*/
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>