// src/utils/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

// 1. 动态决定 Base URL
// 读取 DebugMockSwitch 组件设置的开关状态
const STORAGE_KEY = 'USE_MOCK_DATA'
const isMockMode = localStorage.getItem(STORAGE_KEY) === 'true'

const baseURL = isMockMode
    ? (import.meta.env.VITE_API_URL_MOCK || 'http://localhost:3000')
    : (import.meta.env.VITE_API_URL_REAL || '/api')

// 打印当前模式，方便调试
console.log(`%c[Network] Current Mode: ${isMockMode ? 'MOCK 🚧' : 'REAL 🌍'}`, 'color: #fff; background: #409EFF; padding: 4px 8px; border-radius: 4px;', baseURL)

// 2. 创建 axios 实例
const service: AxiosInstance = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// 扩展 AxiosRequestConfig
declare module 'axios' {
    export interface AxiosRequestConfig {
        _silent?: boolean;
    }
}

// 3. 请求拦截器
service.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        // 适配多种后端认证路径风格
        const isAuthRequest =
            url.includes('/auth/login') ||
            url.includes('/api/Login/') ||
            url.includes('/identity/api/Login');

        if (!isAuthRequest) {
            // 统一使用 'authToken'，与 authStore 保持一致
            const token = localStorage.getItem('authToken')
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    (error) => {
        console.error('Request Error:', error)
        return Promise.reject(error)
    }
)

// 4. 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const { data, headers } = response

        // 场景 A: Json-server 分页列表 (Array + x-total-count)
        if (Array.isArray(data) && headers['x-total-count']) {
            return {
                items: data,
                total: parseInt(headers['x-total-count'], 10) || 0
            } as any
        }

        // 场景 B: 标准后端/Mock 包装响应 { code: 200, data: ... }
        if (data && typeof data === 'object' && 'code' in data) {
            const apiRes = data as ApiResponse<any>
            // 兼容 code === 200 或 success === true
            if (apiRes.code === 200 || apiRes.success) {
                return apiRes.data
            } else {
                if (!response.config._silent) {
                    ElMessage.error(apiRes.message || '请求失败')
                }
                return Promise.reject(new Error(apiRes.message || 'Error'))
            }
        }

        // 场景 C: 直接返回数据实体 (无 code 包装)
        return data
    },
    (error) => {
        const msg = error.response?.data?.message || error.message || '网络请求错误'
        if (!error.config?._silent) {
            ElMessage.error(msg)
        }
        return Promise.reject(error)
    }
)

const request = {
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return service.get(url, config) as Promise<T>
    },
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.post(url, data, config) as Promise<T>
    },
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.put(url, data, config) as Promise<T>
    },
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return service.delete(url, config) as Promise<T>
    },
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.patch(url, data, config) as Promise<T>
    },
}

export default request