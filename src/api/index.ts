// src/api/index.ts
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { STORAGE_KEYS, } from '@/types'


const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

//  全局请求拦截器 (只依赖 localStorage)
api.interceptors.request.use(
  (config) => {
    // 1. 登录请求，直接放行
    if (config.url && config.url.endsWith('/auth/login')) {
      return config
    }

    // 2. 对于其他所有请求，只从 localStorage 中读取 token
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

// 全局响应拦截器 (用于处理 401) 
api.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数
    // 如果 mockjs 返回的数据 code 不是 200，我们也当作错误处理
    if (response.data && response.data.code && response.data.code !== 200) {
      // 登录失败（401）由 mockjs 自己处理，这里只处理其他错误
      if (response.data.code !== 401) {
        ElMessage.error(response.data.message || '请求失败')
      }
      return Promise.reject(new Error(response.data.message || 'Error'))
    }
    // 拦截器中，我们返回的是完整的 response，在 API 函数中再解构 .data
    return response
  },
  (error) => {
    // 超出 2xx 范围的状态码（比如真实的 401, 500）都会触发该函数
    if (error.response && error.response.status === 401) {
      // 401 (未授权) 是后端的标准回答
      ElMessage.error('会话已过期，请重新登录。')

      // (可选) 清理本地存储
      localStorage.removeItem(STORAGE_KEYS.TOKEN)

      // 跳转到登录页 (假设您的登录页路径是 /login)
      // 使用原生跳转，强制刷新页面，确保内存数据清空
      // 避免 api -> router -> view -> store -> api 的循环依赖
      window.location.href = '/login'
    } else {
      // 其他网络错误
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)


/**
 * 模拟服务器的统一响应结构
 */
export interface ApiResponse<T> {
  code: number
  message: string
  success: boolean
  data: T
}

/**
 * 产品类型 (用于固件关联)
 */
export interface Product {
  id: string
  name: string
  type: string
}

/**
 * 固件信息类型
 */
export interface Firmware {
  id: string
  version: string
  productId: string
  productName: string
  releaseNotes: string
  fileUrl: string
  uploadedAt: string
}

/**
 * 固件上传数据结构
 */
export interface FirmwareUploadData {
  version: string
  productId: string
  releaseNotes: string
}

/**
 * 升级任务状态类型
 */
export type UpgradeTaskStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed' | 'idle'

/**
 * 升级任务类型
 */
export interface UpgradeTask {
  id: string
  deviceId: string
  deviceName: string
  firmwareId: string
  firmwareVersion: string
  status: UpgradeTaskStatus
  progress: number
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  _page: number
  _limit: number
  [key: string]: any // 允许其他筛选条件
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

/**
 * 模拟服务器的统一响应结构
 */
export interface ApiResponse<T> {
  code: number
  message: string
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

/**
 * 1. 获取固件列表 (分页)
 * @param params 分页和筛选参数
 */
export const fetchFirmwares = async (params: PaginationParams): Promise<PaginatedResponse<Firmware>> => {
  // api.get 返回的是 AxiosResponse，其数据在 response.data
  // response.data 是我们的 ApiResponse<T> 结构
  // response.data.data 才是真正的固件数组
  const response = await api.get<ApiResponse<Firmware[]>>('/firmwares', { params })

  // 从响应头获取 json-server 提供的总数
  const totalCount = response.headers['x-total-count'] || 0

  return {
    items: response.data.data,
    total: +totalCount // 确保是数字
  }
}

/**
 * 获取所有产品列表 (用于上传固件时的下拉菜单)
 */
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get<ApiResponse<Product[]>>('/products')
  return response.data.data // 直接返回产品数组
}

/**
 * 2. 上传新固件
 * @param data 固件信息
 */
export const uploadFirmware = async (data: FirmwareUploadData): Promise<Firmware> => {
  const response = await api.post<ApiResponse<Firmware>>('/firmwares', data)
  return response.data.data // 返回创建的固件对象
}

/**
 * 3. 触发设备升级
 * @param deviceId 设备ID
 */
export const startDeviceUpgrade = async (deviceId: string): Promise<UpgradeTask> => {
  const response = await api.post<ApiResponse<UpgradeTask>>('/devices/upgrade', { deviceId })
  return response.data.data // 返回新创建的升级任务
}

/**
 * 4. 轮询升级任务状态
 * @param taskId 任务ID
 */
export const getUpgradeTaskStatus = async (taskId: string): Promise<UpgradeTask> => {
  const response = await api.get<ApiResponse<UpgradeTask>>(`/upgrade-task/${taskId}`)
  return response.data.data // 返回更新后的任务状态
}

/**
 * 更新固件信息 (用于验证/发布)
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
// 默认导出 axios 实例
export default api