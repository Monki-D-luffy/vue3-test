// src/api/index.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
// 注意：为了防止循环依赖，建议不要在这里直接 import router
// 如果需要跳转登录页，可以使用 window.location.href = '/login'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

// =================================================================
// 1. 拦截器配置
// =================================================================

// 全局请求拦截器
api.interceptors.request.use(
  (config) => {
    // 1. 登录请求，直接放行
    if (config.url && config.url.endsWith('/auth/login')) {
      return config
    }

    // 2. 从 localStorage 读取 token
    const token = localStorage.getItem('authToken')

    // 3. 如果 token 存在，就附上
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 全局响应拦截器
api.interceptors.response.use(
  (response) => {
    // 如果 code 不是 200，视为业务错误
    if (response.data && response.data.code && response.data.code !== 200) {
      if (response.data.code !== 401) {
        ElMessage.error(response.data.message || '请求失败')
      }
      return Promise.reject(new Error(response.data.message || 'Error'))
    }
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      ElMessage.error('会话已过期，请重新登录。')
      localStorage.removeItem('authToken')
      // 强制跳转回登录页
      window.location.href = '/login'
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

// =================================================================
// 2. 类型定义
// =================================================================

export interface ApiResponse<T> {
  code: number
  message: string
  success: boolean
  data: T
}

export interface Product {
  id: string
  name: string
  type: string
}

export interface Firmware {
  id: string
  version: string
  productId: string
  productName: string;
  releaseNotes: string
  fileUrl: string
  uploadedAt: string
  // ✨ [修复] 补全 verified 属性，用于标记固件是否已验证通过
  verified?: boolean
}

export interface FirmwareUploadData {
  version: string
  productId: string
  releaseNotes: string
}

export type UpgradeTaskStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed' | 'idle'

export interface UpgradeTask {
  id: string
  deviceId: string // 注意：mock-server 中的结构可能需要适配
  deviceName?: string
  firmwareId: string
  firmwareVersion: string
  status: UpgradeTaskStatus
  progress: number
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
}

export interface PaginationParams {
  _page: number
  _limit: number
  [key: string]: any
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

// =================================================================
// 3. API 函数
// =================================================================

/**
 * 获取固件列表 (分页)
 */
export const fetchFirmwares = async (params: PaginationParams): Promise<PaginatedResponse<Firmware>> => {
  const response = await api.get<ApiResponse<Firmware[]>>('/firmwares', { params })
  const totalCount = response.headers['x-total-count'] || 0
  return {
    items: response.data.data,
    total: +totalCount
  }
}

/**
 * 获取所有产品列表
 */
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>('/products')
  return response.data.data
}

/**
 * 上传新固件
 */
export const uploadFirmware = async (data: FirmwareUploadData): Promise<Firmware> => {
  const response = await api.post<ApiResponse<Firmware>>('/firmwares', {
    ...data,
    verified: false // 默认为未验证
  })
  return response.data.data
}

/**
 * ✨ (新增) 更新固件信息 (用于验证/发布)
 * PATCH /firmwares/:id
 */
export const updateFirmware = async (id: string, updates: Partial<Firmware>): Promise<Firmware> => {
  const response = await api.patch<ApiResponse<Firmware>>(`/firmwares/${id}`, updates)
  return response.data.data
}

/**
 * ✨ (新增) 删除固件
 */
export const deleteFirmware = async (id: string): Promise<void> => {
  await api.delete(`/firmwares/${id}`)
}

/**
 * 触发单设备升级 (旧功能，保留用于 DeviceDetail)
 */
export const startDeviceUpgrade = async (deviceId: string): Promise<UpgradeTask> => {
  const response = await api.post<ApiResponse<UpgradeTask>>('/devices/upgrade', { deviceId })
  return response.data.data
}

/**
 * 轮询升级任务状态 (旧功能，保留)
 */
export const getUpgradeTaskStatus = async (taskId: string): Promise<UpgradeTask> => {
  const response = await api.get<ApiResponse<UpgradeTask>>(`/upgrade-task/${taskId}`)
  return response.data.data
}

// --- 👇 阶段三 (批量推送) 预埋接口 👇 ---

/**
 * 预估升级任务的影响范围 (Mock)
 * @param productId 产品ID
 * @param firmwareId 目标固件ID
 * @param filters 筛选条件
 */
export const estimateUpgradeImpact = async (
  productId: string,
  firmwareId: string,
  filters: any
): Promise<{ total: number; online: number }> => {
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 600))

  // 模拟返回：随机生成一个数量，假装后端计算了
  const total = Math.floor(Math.random() * 50) + 5
  return {
    total: total,
    online: Math.floor(total * 0.6)
  }
}

/**
 * 创建批量升级任务 (Mock)
 */
export const createUpgradeCampaign = async (payload: {
  name: string
  productId: string
  firmwareId: string
  firmwareVersion: string
  targetScope: 'all' | 'filter'
  filters?: any
}): Promise<void> => {
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 1000))

  console.log('--- [Mock API] 创建批量任务 ---', payload)
  return
}

export default api