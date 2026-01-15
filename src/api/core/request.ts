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

        // 场景 B: 真实后端 / 标准响应
        if (data && typeof data === 'object') {
            // ✨ [增强] 兼容 C# 风格 (Success) 和标准风格 (code=200)
            const isSuccess =
                data.code === 200 ||
                data.success === true ||
                data.Success === true; // C# PascalCase

            if (isSuccess) {
                // 如果后端返回了 Data 字段，优先解包 Data，但保留外层结构以便获取 TotalCount
                // 这里为了通用性，我们返回整个 body，让 Business 层去解构 Data 和 TotalCount
                return data
            } else {
                // 处理明确的业务失败
                if (data.code !== undefined || data.Success === false) {
                    const msg = data.Message || data.message || '操作失败';
                    if (!config._silent) ElMessage.error(msg)
                    return Promise.reject(new Error(msg))
                }
            }
        }
        return data
    },
    async (error: AxiosError) => {
        const config = error.config
        if (!config) return Promise.reject(error)

        const authStore = useAuthStore()

        // ✨ 401 Token 过期处理 (核心补全)
        if (error.response?.status === 401 && !config._retry) {

            // 如果已经在刷新中，将当前请求加入队列等待
            if (isRefreshing) {
                return new Promise((resolve) => {
                    requestsQueue.push((token) => {
                        if (config.headers) config.headers.Authorization = `Bearer ${token}`
                        resolve(service(config)) // 重新发送
                    })
                })
            }

            // 标记开始刷新
            config._retry = true
            isRefreshing = true

            try {
                // 🚀 调用 Store 的刷新动作
                const newToken = await authStore.refreshSession()

                if (newToken) {
                    // 1. 处理队列中的请求
                    processQueue(null, newToken)

                    // 2. 重试当前请求
                    if (config.headers) config.headers.Authorization = `Bearer ${newToken}`
                    return service(config)
                }
            } catch (refreshErr) {
                // 刷新失败，清空队列并报错
                processQueue(refreshErr, null)
                // authStore.logout() 已经在 refreshSession 内部调用了
            } finally {
                // 解除锁定
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