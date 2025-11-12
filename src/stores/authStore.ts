// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import api from '@/api'
import type { UserInfo } from '@/types'        // ✨ 引入统一类型
import { STORAGE_KEYS } from '@/types'         // ✨ 引入常量

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const userInfo = ref<UserInfo | null>(null)

  // --- Actions ---

  // 登录动作
  const login = async (account: string, password: string) => {
    try {
      // 调用 API
      // 注意：我们的拦截器已经处理了 HTTP 错误和 code !== 200 的情况
      // 所以这里只要能拿到 response，说明业务是成功的
      const response = await api.post(`/auth/login`, {
        account,
        password
      })

      // 这里的类型检查依赖于你的 api 响应泛型，假设 api.post 返回的是 AxiosResponse<ApiResponse<LoginResult>>
      // 为了简化，我们假设拦截器已经剥离了外层，或者我们直接信任数据
      const data = response.data?.data || response.data;

      // 登录成功
      token.value = data.token
      userInfo.value = data // 假设后端把 userInfo 混在同一个对象里，或者 data.userInfo

      if (token.value) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token.value)
      }

      ElMessage.success('登录成功！')
      return true

    } catch (error) {
      // ✨ [关键修复]：拦截器已经弹出了错误提示 (ElMessage.error)，
      // 这里我们只做控制台记录，不再弹出第二个提示，避免骚扰用户。
      console.warn('Login failed:', error)
      return false
    }
  }

  // 登出动作
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    ElMessage.info('您已退出登录')
    // 路由跳转建议在组件层处理，或者在 store 外部使用 router
  }

  // 自动登录尝试 (简单版)
  const tryAutoLogin = async () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (storedToken) {
      token.value = storedToken
      // 这里通常应该调用一个 getUserInfo 接口验证 token 有效性并获取用户信息
      // try {
      //    const res = await api.get('/auth/me');
      //    userInfo.value = res.data.data;
      // } catch (e) { logout() }
    }
  }

  return {
    token,
    userInfo,
    login,
    logout,
    tryAutoLogin
  }
})