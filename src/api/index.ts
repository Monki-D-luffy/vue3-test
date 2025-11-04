// src/api/index.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus'

// 1. 定义我们 API 的基础 URL
const API_BASE_URL = 'http://192.168.1.100/api'

// 2. 创建一个 axios 的“实例”
//    我们所有的配置都将基于这个实例
const api = axios.create({
  baseURL: API_BASE_URL
})

// 3. ✨✨✨ 添加“请求拦截器”（全局门卫） ✨✨✨
api.interceptors.request.use(
  (config) => {
    // 在请求发送出去之前，执行此函数

    // 4. 让登录请求直接通过，不需要Token
    if (config.url && config.url.endsWith('/auth/login')) {
      return config
    }

    // 5. 对于其他所有请求，我们要附上Token
    //    !! 注意: 必须在这里（函数内部）获取 store 实例
    //    不能在文件顶部获取，否则会因 Pinia 未初始化而报错
    const authStore = useAuthStore()
    
    let token = authStore.token
    
    // 6. 如果 Pinia 中没有，尝试从 localStorage 恢复
    if (!token) {
      token = localStorage.getItem('authToken')
      if (token) {
        authStore.token = token // 顺便恢复到 Pinia 中
      }
    }

    // 7. 如果我们最终找到了 Token，就把它塞进请求头
    if (token) {
      // 'Authorization' 是后端API的标准“通行证”字段
      // 'Bearer ' 是 Token 的标准前缀
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // 8. 如果连 localStorage 里都没有 Token，
      //    (可选) 可以在这里直接阻止请求，并提示用户
      ElMessage.error('您尚未登录，无法执行此操作')
      // 抛出一个错误，阻止这个请求被发送
      return Promise.reject(new Error('未找到Token'))
    }

    // 9. 放行“加工”过的请求
    return config
  },
  (error) => {
    // 处理请求配置时的错误
    return Promise.reject(error)
  }
)

// 4. 导出这个配置好的 api 实例
export default api