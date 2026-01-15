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
        // 1. 身份认证服务代理 (Identity Server)
        // 用途：登录获取 Token
        // 匹配: /api/identity/api/Login/... -> https://iotserver.dabbsson.cn/manager-identity/api/Login/...
        '/api/identity': {
          target: 'https://iotserver.dabbsson.cn/manager-identity/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/identity/, ''),
          secure: false
        },

        // ✨ [新增] 2. IoT Manager 业务后端代理 (Manager Server)
        // 用途：获取设备列表、产品列表等
        // 匹配: /api/manager/api/Devices/... -> https://iotserver.dabbsson.cn/manager/api/Devices/...
        '/api/manager': {
          target: 'https://iotserver.dabbsson.cn/manager/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/manager/, ''),
          secure: false
        },

        // 3. 常规 Mock 代理 (兜底策略)
        // 用途：处理尚未接入真实后端的请求
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },

        // 4. AI 服务代理
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