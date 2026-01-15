import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // 🌍 真实后端地址 (来自你的文档 "后端请求链接.md")
  // 务必使用 HTTP，因为 C# 代码中配置的是 http://...:6101
  const REAL_BACKEND_TARGET = 'http://192.168.5.143:6101'

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
      https: true, // 前端保持 HTTPS (mkcert)
      host: '0.0.0.0',
      proxy: {
        // ❌ [删除] 以前的 identity 代理，不再需要云端验证
        // '/api/identity': { ... },

        // ✅ [统一] 所有 /api 请求直连本地 C# 后端
        '/api': {
          target: REAL_BACKEND_TARGET,
          changeOrigin: true,
          secure: false,
          // ⚠️ 关键：你的后端接口本身就有 /api 前缀 (例如 /api/Login/LoginByPwd)
          // 所以不需要 rewrite 去掉它，直接透传即可
        },

        // AI 服务代理保持不变
        '/ai-proxy': {
          target: env.VITE_AI_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-proxy/, ''),
          secure: false,
        }
      }
    }
  }
})