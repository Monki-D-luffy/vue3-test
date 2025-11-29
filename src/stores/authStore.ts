// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
// 确保正确导入 API
import { login as apiLogin, register as apiRegister } from '@/api'
import type { UserInfo, UserRegisterData } from '@/types'
import { STORAGE_KEYS } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const userInfo = ref<UserInfo | null>(null)

  // --- Actions ---

  // 1. 登录动作
  const login = async (account: string, password: string) => {
    try {
      const res: any = await apiLogin({ account, password })
      // 兼容处理
      const data = res.data || res;

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

  // 2. 注册动作
  const register = async (registerData: UserRegisterData) => {
    try {
      const res: any = await apiRegister(registerData);
      const data = res.data || res;

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

  // 3. 登出动作
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    // ElMessage.info('您已退出登录') // 可选提示
  }

  // ✅ 4. [修复核心Bug] 自动登录尝试
  // 这个方法通常在 App.vue 挂载时调用，用于检查本地 Token 是否有效
  const tryAutoLogin = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!storedToken) return false;

    try {
      // 如果后端有 /auth/me 接口用于验证 token，应该在这里调用
      // 目前假设只要有 token 就视为已登录，或者你可以尝试请求一次用户信息

      // 示例：如果有 getUserInfo API
      // const user = await apiGetUserInfo();
      // userInfo.value = user;

      token.value = storedToken;
      return true;
    } catch (error) {
      // Token 无效
      logout();
      return false;
    }
  }

  return {
    token,
    userInfo,
    login,
    register,
    logout,
    tryAutoLogin // ✅ 必须导出
  }
})