import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert' // 确保上面的安装成功，否则这里会报红

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    mkcert(), // 插件会自动处理证书，并填充到下面的 https 对象中
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 开发服务器配置
  server: {
    // 修复：使用 {} 代替 true，以符合 ServerOptions 类型定义
    https: {},
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 转发给我们的 Mock 服务器
        changeOrigin: true,
        // 根据你的注释：mock-server 已有 /api 前缀，无需 rewrite
      }
    }
  }
})