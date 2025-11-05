import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // ▼▼▼ 新增代理配置 ▼▼▼
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 转发给我们的 Mock 服务器
        changeOrigin: true,
        //Bx 因为我们的 mock-server 已经配置了 /api 前缀，所以这里不需要重写路径
      }
    }
  }
  // ▲▲▲ 新增结束 ▲▲▲
})