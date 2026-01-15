// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { login as apiLogin, register as apiRegister, refreshTokenApi } from '@/api/modules/auth'
import router from '@/router'
import type { RegisterParams } from '@/api/types/auth'

const STORAGE_KEYS = {
  TOKEN: 'authToken',
  REFRESH_TOKEN: 'authRefreshToken'
}

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const refreshToken = ref<string | null>(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN))
  const userInfo = ref<any>(null)

  // --- Actions ---

  // 1. 登录
  const login = async (account: string, password: string) => {
    try {
      const loginPayload = {
        userName: account,
        password: password,
        productName: 'ManagerIdentity'
      };

      console.log('📦 [Store] 发起登录:', loginPayload);
      const res: any = await apiLogin(loginPayload)

      const rootData = res.data || res || {};
      const innerData = rootData.Data || rootData.data || {};

      const accessTokenVal = innerData.Access_Token || innerData.accessToken || rootData.accessToken;
      const refreshTokenVal = innerData.Refresh_Token || innerData.refreshToken || rootData.refreshToken;

      if (accessTokenVal) {
        setToken(accessTokenVal, refreshTokenVal)
        userInfo.value = innerData
        ElMessage.success('登录成功！')
        return true
      }
      return false
    } catch (error: any) {
      console.error('❌ [Store] 登录失败:', error);
      return false
    }
  }

  // 2. 注册
  const register = async (registerData: RegisterParams) => {
    try {
      await apiRegister(registerData)
      ElMessage.success('注册成功，请登录')
      return true
    } catch (error) {
      console.error('注册失败:', error)
      return false
    }
  }

  // 3. 登出
  const logout = () => {
    console.log('👋 [Store] 用户登出，清除 Token')
    token.value = null
    refreshToken.value = null
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
  }

  // 4. 自动登录 (App.vue 调用)
  const tryAutoLogin = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

    if (!storedToken) return false

    token.value = storedToken
    if (storedRefresh) {
      refreshToken.value = storedRefresh
    }

    return true
  }

  // 5. 刷新令牌 (拦截器调用)
  const refreshSession = async (): Promise<string | null> => {
    if (!refreshToken.value) {
      console.warn('⚠️ [Store] 刷新失败：本地没有 Refresh Token，强制登出')
      logout()
      return null
    }

    try {
      const time = new Date().toLocaleTimeString();
      // 📝 LOG: 开始刷新
      console.log(`%c🔄 [${time}] 正在尝试刷新 Token...`, 'color: #e6a23c; font-weight: bold;')
      console.log(`   👉 使用 RefreshToken: ${refreshToken.value.substring(0, 10)}...`)

      const res: any = await refreshTokenApi(refreshToken.value)

      const rootData = res.data || res || {};
      const innerData = rootData.Data || rootData.data || {};

      const newAccessToken = innerData.Access_Token || innerData.accessToken || rootData.accessToken;
      const newRefreshToken = innerData.Refresh_Token || innerData.refreshToken || rootData.refreshToken;

      if (newAccessToken) {
        setToken(newAccessToken, newRefreshToken || refreshToken.value)
        return newAccessToken
      }

      throw new Error('刷新接口未返回有效 Token')
    } catch (error) {
      console.error('❌ [Store] Token 刷新失败，会话已过期:', error)
      logout()
      return null
    }
  }

  // 辅助：统一设置 Token 并打印日志
  const setToken = (access: string, refresh: string | null) => {
    const time = new Date().toLocaleTimeString();

    token.value = access
    localStorage.setItem(STORAGE_KEYS.TOKEN, access)

    if (refresh) {
      refreshToken.value = refresh
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh)
    }

    // 📝 LOG: 刷新成功
    console.log(`%c✅ [${time}] Token 更新成功!`, 'color: #67c23a; font-weight: bold; font-size: 12px;')
    console.log(`   🔑 New AccessToken: ${access.substring(0, 15)}...`)
  }

  return {
    token,
    refreshToken,
    userInfo,
    login,
    register,
    logout,
    tryAutoLogin,
    refreshSession
  }
})