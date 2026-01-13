// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { login as apiLogin, register as apiRegister } from '@/api/modules/auth' // 确保引用路径正确
import type { UserInfo } from '@/types' // 假设你有这个类型定义，如果没有可暂时用 any

const STORAGE_KEYS = {
  TOKEN: 'token' // 对应你在 request.ts 里用的 key，如果那里用 authToken，这里也要改
}

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const userInfo = ref<UserInfo | null>(null)

  // --- Actions ---

  // 1. 登录动作
  // src/stores/authStore.ts 的 login 部分

  const login = async (account: string, password: string) => {
    try {
      // 🛠️ 构造完全体 Payload
      // 1. 映射变量名: account -> userName
      // 2. 补充必填项: productName
      const loginPayload = {
        userName: account,               // 必须叫 userName
        password: password,
        productName: 'ManagerIdentity'   // 🚨🚨🚨 必须包含这一行，且值不能错！
      };

      console.log('📦 [Store] 正在发送完整 Payload:', loginPayload);

      // 调用 API
      const res: any = await apiLogin(loginPayload)

      const data = res.data || res;
      console.log('✅ [Store] 登录成功, 返回数据:', data);

      token.value = data.accessToken || data.token
      userInfo.value = data

      if (token.value) {
        localStorage.setItem(STORAGE_KEYS.TOKEN || 'token', token.value)
      }

      ElMessage.success('登录成功！')
      return true
    } catch (error: any) {
      console.error('❌ [Store] 登录失败:', error);
      return false
    }
  }

  // 2. 注册动作
  const register = async (registerData: any) => {
    try {
      const res: any = await apiRegister(registerData)
      const data = res.data || res

      token.value = data.token || null
      userInfo.value = data

      if (token.value) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token.value)
      }

      ElMessage.success(`欢迎加入，${data.nickname || '用户'}！`)
      return true
    } catch (error) {
      console.warn('Registration failed:', error)
      return false
    }
  }

  // 3. 登出动作
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
  }

  const tryAutoLogin = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (!storedToken) return false
    token.value = storedToken
    return true
  }

  return {
    token,
    userInfo,
    login,
    register,
    logout,
    tryAutoLogin
  }
})