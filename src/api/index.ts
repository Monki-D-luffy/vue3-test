// src/api/index.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type {
  ApiResponse,
  Product,
  Firmware,
  FirmwareUploadData,
  UpgradeTask,
  PaginationParams,
  PaginatedResponse
} from '@/types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

// 1. 拦截器配置 (保持不变)
declare module 'axios' {
  export interface AxiosRequestConfig {
    _silent?: boolean;
  }
}

api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.endsWith('/auth/login')) return config
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
    if (error.response && error.response.status === 401) {
      ElMessage.error('会话已过期，请重新登录。')
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    } else {
      if (!error.config?._silent) ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

// =================================================================
// 3. API 函数
// =================================================================

/**
 * 获取固件列表 (分页)
 */
export const fetchFirmwares = async (params: PaginationParams): Promise<PaginatedResponse<Firmware>> => {
  const response = await api.get<ApiResponse<Firmware[]>>('/firmwares', { params })
  // 优先取 body 里的 total
  const totalCount = response.data.total || response.headers['x-total-count'] || 0
  return {
    items: response.data.data || [],
    total: Number(totalCount)
  }
}

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>('/products')
  return response.data.data
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

/**
 * 获取批量任务列表
 * ✨ [修复] 增加 total 的智能兜底，解决分页器不显示的问题
 */
export const fetchCampaigns = async (params: any = {}): Promise<{ items: UpgradeTask[], total: number }> => {
  const res = await api.get<ApiResponse<UpgradeTask[]>>('/campaigns', { params })

  const items = res.data.data || []

  // ✨ 核心修复：如果 mock server 没返回 total，就用当前数据长度兜底
  let totalCount = res.data.total || res.headers['x-total-count']
  if (totalCount === undefined || totalCount === 0) {
    if (items.length > 0) {
      totalCount = items.length // 临时用数组长度作为总数
    } else {
      totalCount = 0
    }
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