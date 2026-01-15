// src/api/core/request.ts
import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
    AxiosError
} from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'

// --- 类型扩展 ---
declare module 'axios' {
    export interface AxiosRequestConfig {
        _silent?: boolean;      // true = 报错时不弹窗
        _retry?: boolean;       // 内部标记：是否是重试请求
        _isUpload?: boolean;    // 内部标记：是否为文件上传
    }
}

// --- 环境变量与 Mock 策略 ---
const STORAGE_KEY_MOCK = 'USE_MOCK_DATA'
const isMockMode = localStorage.getItem(STORAGE_KEY_MOCK) === 'true'

const baseURL = isMockMode
    ? (import.meta.env.VITE_API_URL_MOCK || 'http://localhost:3000')
    : (import.meta.env.VITE_API_URL_REAL || '/api')

console.log(`%c[Network] Current Mode: ${isMockMode ? 'MOCK 🚧' : 'REAL 🌍'}`, 'color: #fff; background: #409EFF; padding: 4px 8px; border-radius: 4px;', baseURL)

// --- 实例创建 ---
const service: AxiosInstance = axios.create({
    baseURL,
    timeout: 15000,
})

// --- 并发锁 (用于刷新 Token) ---
let isRefreshing = false
let requestsQueue: Array<(token: string) => void> = []

const processQueue = (error: any, token: string | null = null) => {
    requestsQueue.forEach(cb => cb(token as string))
    requestsQueue = []
    if (error) requestsQueue.forEach(cb => cb(error))
}

// --- 请求拦截器 ---
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 1. 自动处理 Content-Type (修复文件上传)
        if (!config.headers['Content-Type']) {
            if (config._isUpload) {
                delete config.headers['Content-Type'] // 让浏览器自动生成 boundary
            } else {
                config.headers['Content-Type'] = 'application/json;charset=utf-8'
            }
        }

        // 2. 注入 Token
        const authStore = useAuthStore()
        const token = authStore.token

        // 白名单跳过
        const url = config.url || ''
        const isAuthRequest = url.includes('/auth/login') || url.includes('/identity/api/Login')

        if (token && !isAuthRequest) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

// --- 响应拦截器 ---
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const { data, headers, config } = response

        // 场景 A: Json-server (Mock 兼容)
        if (Array.isArray(data) && headers['x-total-count']) {
            return { items: data, total: parseInt(headers['x-total-count'], 10) || 0 } as any
        }

        // 场景 B: 标准后端响应
        if (data && typeof data === 'object' && 'code' in data) {
            if (data.code === 200 || data.success === true) {
                return data.data
            } else {
                if (!config._silent) ElMessage.error(data.message || '操作失败')
                return Promise.reject(new Error(data.message || 'Error'))
            }
        }
        return data
    },
    async (error: AxiosError) => {
        const config = error.config
        if (!config) return Promise.reject(error)

        const authStore = useAuthStore()

        // 401 Token 过期处理
        if (error.response?.status === 401 && !config._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    requestsQueue.push((token) => {
                        if (config.headers) config.headers.Authorization = `Bearer ${token}`
                        resolve(service(config))
                    })
                })
            }

            config._retry = true
            isRefreshing = true

            try {
                const newToken = await authStore.tryAutoLogin() // 假设 Store 有此方法
                if (newToken) {
                    processQueue(null, newToken as string)
                    if (config.headers) config.headers.Authorization = `Bearer ${newToken}`
                    return service(config)
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null)
                authStore.logout()
                if (!document.querySelector('.el-message-box__wrapper')) {
                    ElMessageBox.alert('会话已过期，请重新登录', '提示', {
                        confirmButtonText: '去登录',
                        callback: () => router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
                    })
                }
            } finally {
                isRefreshing = false
            }
        }

        if (!axios.isCancel(error) && !config._silent) {
            ElMessage.error((error.response?.data as any)?.message || error.message || '网络错误')
        }
        return Promise.reject(error)
    }
)

// --- 导出通用方法 ---
export default {
    get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.get(url, { params, ...config })
    },
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.post(url, data, config)
    },
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.put(url, data, config)
    },
    delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
        return service.delete(url, { params, ...config })
    },
    upload<T = any>(url: string, file: File | FormData, config?: AxiosRequestConfig): Promise<T> {
        const formData = file instanceof FormData ? file : new FormData();
        if (file instanceof File) formData.append('file', file);
        return service.post(url, formData, { ...config, _isUpload: true })
    }
}