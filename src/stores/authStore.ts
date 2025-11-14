// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import api, { register as apiRegister } from '@/api' // 确保引入了 api 中的 register
import type { UserInfo, UserRegisterData } from '@/types'
import { STORAGE_KEYS } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const userInfo = ref<UserInfo | null>(null)

  // --- Actions ---

  // 登录动作
  const login = async (account: string, password: string) => {
    try {
      const response = await api.post(`/auth/login`, { account, password })
      // 兼容处理：response.data 可能是直接的数据，也可能是 { data: ... } 结构
      const data = response.data?.data || response.data;

      token.value = data.token
      userInfo.value = data

      if (token.value) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token.value)
      }

      ElMessage.success('登录成功！')
      return true
    } catch (error) {
      console.warn('Login failed:', error)
      return false
    }
  }

  // [新增] 注册动作 - 之前可能缺少了这个，或者没有 return 它
  const register = async (registerData: UserRegisterData) => {
    try {
      // 调用 API 层的新注册接口
      const data = await apiRegister(registerData);

      // 注册成功后直接帮用户登录
      token.value = data.token || null;
      userInfo.value = data;

      if (token.value) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token.value);
      }

      ElMessage.success(`欢迎加入，${data.nickname || '用户'}！`);
      return true;
    } catch (error) {
      console.warn('Registration failed:', error);
      return false;
    }
  }

  // 登出动作
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    ElMessage.info('您已退出登录')
  }

  // 自动登录尝试
  const tryAutoLogin = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (storedToken) {
      token.value = storedToken
    }
  }

  return {
    token,
    userInfo,
    login,
    register, // <--- 【关键】必须在这里导出，组件才能使用 authStore.register
    logout,
    tryAutoLogin
  }
})