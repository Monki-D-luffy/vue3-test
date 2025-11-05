// src/api/index.ts
import axios from 'axios'
// 1. 不再导入 Pinia/authStore！
// import { useAuthStore } from '@/stores/authStore' 
import { ElMessage } from 'element-plus'
import router from '@/router' // 我们需要 router 来实现 "401 踢回登录页"

const API_BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

// 3. ✨✨✨ 全局请求拦截器 (只依赖 localStorage) ✨✨✨
api.interceptors.request.use(
  (config) => {
    // 1. 登录请求，直接放行
    if (config.url && config.url.endsWith('/auth/login')) {
      return config
    }

    // 2. 对于其他所有请求，只从 localStorage 中读取 token
    const token = localStorage.getItem('authToken')

    // 3. 如果 token 存在，就附上
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 4. (重要) 如果 token 不存在，也不要报错，
    //    让路由守卫 (router/index.ts) 来处理页面跳转，
    //    让 mock 后端 (mock/index.ts) 来返回 401 错误。
    console.log('检查token是否存在: ', config);

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 5. ✨✨✨ 全局响应拦截器 (用于处理 401) ✨✨✨
//    (这是新加的，但非常重要)
api.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数
    // 如果 mockjs 返回的数据 code 不是 200，我们也当作错误处理
    if (response.data && response.data.code && response.data.code !== 200) {
      // 登录失败（401）由 mockjs 自己处理，这里只处理其他错误
      if (response.data.code !== 401) {
        ElMessage.error(response.data.message || '请求失败')
      }
      return Promise.reject(new Error(response.data.message || 'Error'))
    }
    return response
  },
  (error) => {
    // 超出 2xx 范围的状态码（比如真实的 401, 500）都会触发该函数
    if (error.response && error.response.status === 401) {
      // 401 (未授权) 是后端的标准回答
      ElMessage.error('会话已过期，请重新登录。')

      // (可选) 清理本地存储
      localStorage.removeItem('authToken')

      // 跳转到登录页 (假设您的登录页路径是 /login)
      router.push('/login')
    } else {
      // 其他网络错误
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default api