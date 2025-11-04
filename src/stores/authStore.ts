// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
// import axios from 'axios'
import router from '@/router' // 导入路由实例
import { ElMessage } from 'element-plus'
import api from '@/api'
// 1. 定义我们API的基础URL
// const API_BASE_URL = 'http://192.168.1.100/api'

// 2. 定义一个类型，匹配您提供的后端数据
//    (这在TypeScript中是最佳实践)
interface UserInfo {
  nickname: string
  email: string
  userId: string
  [key: string]: any // 其他字段
}

// 3. 定义并导出 store
export const useAuthStore = defineStore('auth', () => {
  // --- State (状态) ---
  // 用 ref() 来定义响应式状态
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfo | null>(null)

  // --- Actions (动作) ---
  
  // 登录动作
  const login = async (account: any, password: any) => {
    try {
      // 4. 调用模拟的登录 API
      //    (我们下一步会在 mockjs 中创建这个 /api/auth/login 接口)
      const response = await api.post(`/auth/login`, {
        account,
        password
      })

      // 5. 检查后端返回的数据
      if (response.data && response.data.code === 200) {
        // 6. 登录成功！
        //    将 token 和用户信息存入 state
        token.value = response.data.data.token
        userInfo.value = response.data.data
        
        // 7. (可选) 将 token 存入浏览器的 localStorage，以便刷新后保持登录
        if (token.value !== null) {
          localStorage.setItem('authToken', token.value)
        }
        
        ElMessage.success('登录成功！')
        
        // 8. 登录成功后，跳转到主看板页面
        router.push('/dashboard')

      } else {
        // 处理后端返回的“登录失败”
        ElMessage.error(response.data.message || '登录失败')
      }
    } catch (error) {
      // 处理网络错误
      ElMessage.error('登录请求失败，请检查网络或联系管理员')
      console.error(error)
    }
  }

  // 登出动作
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('authToken')
    ElMessage.info('您已退出登录')
    router.push('/login')
  }

  // --- Getters (计算属性) ---
  // (暂时用不到，但可以先留着)

  // 5. 将 state 和 actions 暴露出去
  return {
    token,
    userInfo,
    login,
    logout
  }
})