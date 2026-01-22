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

      // 解析逻辑
      const rootData = res.data || res || {};
      const innerData = rootData.Data || rootData.data || {};

      const accessTokenVal =
        innerData.Access_Token ||
        innerData.access_Token ||
        innerData.accessToken ||
        rootData.accessToken;

      const refreshTokenVal =
        innerData.Refresh_Token ||
        innerData.refresh_Token ||
        innerData.refreshToken ||
        rootData.refreshToken;

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

  // 4. 自动登录
  const tryAutoLogin = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    if (!storedToken) return false
    token.value = storedToken
    if (storedRefresh) refreshToken.value = storedRefresh
    return true
  }

  // 5. 刷新令牌 (核心修复)
  const refreshSession = async (): Promise<string | null> => {
    if (!refreshToken.value) {
      console.warn('⚠️ [Store] 刷新失败：本地没有 Refresh Token')
      logout()
      return null
    }

    try {
      const time = new Date().toLocaleTimeString();
      console.log(`%c🔄 [${time}] 正在尝试刷新 Token...`, 'color: #e6a23c; font-weight: bold;')

      const res: any = await refreshTokenApi(refreshToken.value)

      // 🔍 调试日志：打印完整结构
      console.log('📦 [Store] 刷新接口原始响应:', JSON.stringify(res, null, 2));

      // --- 终极解析逻辑 ---
      let newAccessToken = '';
      let newRefreshToken = '';

      // 1. 提取最深层的数据对象
      const root = res || {};
      const data = root.data || root.Data || root;

      // 2. 暴力匹配 (针对您日志中的 access_Token)
      if (typeof data === 'string') {
        newAccessToken = data;
      } else {
        newAccessToken =
          data.access_Token || // ✅ 针对您的后端: access_Token
          data.Access_Token ||
          data.accessToken ||
          data.token ||
          root.accessToken ||
          root.access_Token;   // 有时候在最外层

        newRefreshToken =
          data.refresh_Token || // ✅ 针对您的后端: refresh_Token
          data.Refresh_Token ||
          data.refreshToken ||
          root.refreshToken;
      }

      if (newAccessToken) {
        setToken(newAccessToken, newRefreshToken || refreshToken.value)
        return newAccessToken
      }

      // 如果还是失败，抛出带详细数据的错误
      console.error('❌ [Store] 无法解析 Token。数据对象 Keys:', Object.keys(data));
      throw new Error('刷新接口返回了 200 但未找到 Token 字段')

    } catch (error) {
      console.error('❌ [Store] Token 刷新失败:', error)
      logout()
      return null
    }
  }

  const setToken = (access: string, refresh: string | null) => {
    const time = new Date().toLocaleTimeString();
    token.value = access
    localStorage.setItem(STORAGE_KEYS.TOKEN, access)
    if (refresh) {
      refreshToken.value = refresh
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh)
    }
    console.log(`%c✅ [${time}] Token 更新成功!`, 'color: #67c23a; font-weight: bold;')
  }

  return { token, refreshToken, userInfo, login, register, logout, tryAutoLogin, refreshSession }
})