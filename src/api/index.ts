// src/api/index.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type {
  ApiResponse,
  Product,
  Firmware,
  UpgradeTask,
  PaginationParams,
  PaginatedResponse,
  UserInfo,
  UserRegisterData
} from '@/types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

// 1. 拦截器配置
declare module 'axios' {
  export interface AxiosRequestConfig {
    _silent?: boolean;
  }
}

api.interceptors.request.use(
  (config) => {
    // 登录和注册接口不需要 Token
    if (config.url && (config.url.endsWith('/auth/login') || config.url.endsWith('/auth/register'))) {
      return config
    }
    const token = localStorage.getItem('authToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code && response.data.code !== 200) {
      if (response.data.code !== 401) ElMessage.error(response.data.message || '请求失败')
      return Promise.reject(new Error(response.data.message || 'Error'))
    }
    return response
  },
  (error) => {
    // 获取请求的 URL，判断是否是登录或注册接口
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.endsWith('/auth/login') || requestUrl.endsWith('/auth/register');

    if (error.response && error.response.status === 401) {
      // ✨ 关键修复：如果是登录/注册接口的 401，说明是账号密码错误，不处理为“会话过期”
      if (!isAuthRequest) {
        ElMessage.error('会话已过期，请重新登录。')
        localStorage.removeItem('authToken')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      // 登录接口的 401 会在这里被抛出，由 authStore 中的 try-catch 捕获并提示“账号或密码错误”
    } else {
      if (!error.config?._silent) ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

// =================================================================
// 3. API 函数
// =================================================================

// --- 认证 Auth ---

export const login = async (data: any) => {
  return api.post('/auth/login', data)
}

export const register = async (data: UserRegisterData): Promise<UserInfo> => {
  const response = await api.post<ApiResponse<UserInfo>>('/auth/register', data)
  return response.data.data
}

// --- 固件与产品 ---

export const fetchFirmwares = async (params: PaginationParams): Promise<PaginatedResponse<Firmware>> => {
  const response = await api.get<ApiResponse<Firmware[]>>('/firmwares', { params })
  const totalCount = response.data.total || response.headers['x-total-count'] || 0
  return {
    items: response.data.data || [],
    total: Number(totalCount)
  }
}

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>('/products')
  // 兼容处理：如果后端返回了标准结构则取 .data，否则（如果返回原始数组）直接用 response.data，如果都失败则返回空数组
  return response.data.data || (Array.isArray(response.data) ? response.data : [])
}

export const uploadFirmware = async (data: any): Promise<Firmware> => {
  const response = await api.post<ApiResponse<Firmware>>('/firmwares', {
    ...data,
    verified: false
  })
  return response.data.data
}

export const updateFirmware = async (id: string, updates: Partial<Firmware>): Promise<Firmware> => {
  const response = await api.patch<ApiResponse<Firmware>>(`/firmwares/${id}`, updates)
  return response.data.data
}

export const deleteFirmware = async (id: string): Promise<void> => {
  await api.delete(`/firmwares/${id}`)
}

// --- 设备相关  ---

// 🔥🔥 核心修复：添加解绑(删除)设备接口
export const deleteDevice = async (id: string): Promise<void> => {
  // json-server 默认支持 DELETE /resource/:id
  await api.delete(`/devices/${id}`)
}

// --- 升级任务 ---

export const startDeviceUpgrade = async (deviceId: string): Promise<UpgradeTask> => {
  const response = await api.post<ApiResponse<UpgradeTask>>('/devices/upgrade', { deviceId })
  return response.data.data
}

export const getUpgradeTaskStatus = async (taskId: string): Promise<UpgradeTask> => {
  const response = await api.get<ApiResponse<UpgradeTask>>(`/upgrade-task/${taskId}`)
  return response.data.data
}

export const estimateUpgradeImpact = async (
  productId: string,
  firmwareId: string,
  filters: any
): Promise<{ total: number; online: number }> => {
  await new Promise(r => setTimeout(r, 400))
  const total = Math.floor(Math.random() * 50) + 5
  return { total: total, online: Math.floor(total * 0.6) }
}

export const createUpgradeCampaign = async (payload: any): Promise<void> => {
  await api.post('/campaigns', payload)
}

export const fetchCampaigns = async (params: any = {}): Promise<{ items: UpgradeTask[], total: number }> => {
  const res = await api.get<ApiResponse<UpgradeTask[]>>('/campaigns', { params })
  const items = res.data.data || []
  let totalCount = res.data.total || res.headers['x-total-count']
  if (totalCount === undefined || totalCount === 0) {
    totalCount = items.length > 0 ? items.length : 0
  }
  return {
    items: items,
    total: Number(totalCount)
  }
}

export const deleteUpgradeCampaign = async (campaignId: string): Promise<void> => {
  await api.delete(`/campaigns/${campaignId}`)
}

export default api