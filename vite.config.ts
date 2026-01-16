// vite.config.ts
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
        // 1. 身份认证 (保持不变)
        '/api/identity': {
          target: 'https://iotserver.dabbsson.cn/manager-identity/',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/identity/, ''),
          secure: false
        },

        // 2. 业务接口代理 (核心修改)
        // 捕获所有 /api/Product, /api/Devices 等请求
        // 转发到 https://iotserver.dabbsson.cn/manager/api/...
        '/api': {
          target: 'https://iotserver.dabbsson.cn/manager/',
          changeOrigin: true,
          secure: false,
          // 注意: 真实后端路径本身包含 /api，所以不需要 rewrite 去掉它
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