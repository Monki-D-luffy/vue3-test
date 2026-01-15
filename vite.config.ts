import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ mode }) => {
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
        // [新增] 1. 身份认证服务代理 (必须放在 /api 之前)
        // 匹配 /api/identity -> 转发到真实后端
        '/api/identity': {
          target: 'https://iotserver.dabbsson.cn/manager-identity/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/identity/, ''), // 去除前缀
          secure: false
        },

        // 2. 常规业务 API 代理 (指向 Mock 或其他业务后端)
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },

        // 3. AI 服务代理
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
