// src/stores/authStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
// ✅ 替换引用：导入 login 和 register
import { login as apiLogin, register as apiRegister } from '@/api'
import type { UserInfo, UserRegisterData } from '@/types'
import { STORAGE_KEYS } from '@/types' // 确保你的 types/index.ts 里有这个常量，或者直接用字符串 'authToken'

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const userInfo = ref<UserInfo | null>(null)

  // --- Actions ---

  // 登录动作
  const login = async (account: string, password: string) => {
    try {
      // ✅ 使用 API 模块调用
      // 注意：request.ts 默认返回 response.data (即后端返回的 body)
      const res: any = await apiLogin({ account, password })

      // 兼容处理：如果后端返回 { code: 200, data: { token: '...' } }
      // 这里的 res 就是那个对象
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

  // 注册动作
  const register = async (registerData: UserRegisterData) => {
    try {
      // ✅ 使用 API 模块调用
      const res: any = await apiRegister(registerData);
      const data = res.data || res;

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

  return {
    token,
    userInfo,
    login,
    register,
    logout
  }
})