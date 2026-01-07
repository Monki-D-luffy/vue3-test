import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite' // 引入 loadEnv
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量 (.env.local)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueDevTools(),
      mkcert(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      https: {},
      host: '0.0.0.0',
      proxy: {
        // 1. 常规后端 API 代理 (保持不变，指向 Mock Server)
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        // 2. 新增：AI 服务代理 (指向硅基流动/DeepSeek)
        // 遇到 /ai-proxy 开头的请求，转发到 VITE_AI_API_URL
        '/ai-proxy': {
          target: env.VITE_AI_API_URL, // 读取 .env.local 中的地址
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-proxy/, ''), // 去掉 /ai-proxy 前缀
          secure: false, // 如果是 https 且证书有问题，允许忽略（通常不需要，但加了保险）
        }
      }
    }
  }
})