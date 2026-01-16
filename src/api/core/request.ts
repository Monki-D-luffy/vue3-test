// src/api/core/request.ts
import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
    AxiosError
} from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

declare module 'axios' {
    export interface AxiosRequestConfig {
        _silent?: boolean;
        _retry?: boolean;
        _isUpload?: boolean;
    }
}

const STORAGE_KEY_MOCK = 'USE_MOCK_DATA'
const isMockMode = localStorage.getItem(STORAGE_KEY_MOCK) === 'true'

const baseURL = isMockMode
    ? (import.meta.env.VITE_API_URL_MOCK || 'http://localhost:3000')
    : (import.meta.env.VITE_API_URL_REAL || '/api')

const service: AxiosInstance = axios.create({
    baseURL,
    timeout: 15000,
})

let isRefreshing = false
let requestsQueue: Array<(token: string) => void> = []

const processQueue = (error: any, token: string | null = null) => {
    requestsQueue.forEach(cb => cb(token as string))
    requestsQueue = []
    if (error) requestsQueue.forEach(cb => cb(error))
}

service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (!config.headers['Content-Type']) {
            if (config._isUpload) {
                delete config.headers['Content-Type']
            } else {
                config.headers['Content-Type'] = 'application/json;charset=utf-8'
            }
        }

        const authStore = useAuthStore()
        const token = authStore.token
        const url = config.url || ''
        const isAuthRequest = url.includes('/auth/login') || url.includes('/identity/api/Login')

        if (token && !isAuthRequest) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

service.interceptors.response.use(
    (response: AxiosResponse) => {
        const { data, headers, config } = response

        // ✨ Fix: 优先处理 Blob/文件流响应
        // 防止将 Excel/PDF 文件当做 JSON 解析导致 "code undefined" 报错
        const contentType = headers['content-type'] || '';
        const isJson = contentType.includes('application/json');

        // 如果不是 JSON，或者是 Blob 类型，直接返回 data (透传文件流)
        if (!isJson || config.responseType === 'blob' || config.responseType === 'arraybuffer') {
            return data;
        }

        // 场景 A: Json-server (Mock 兼容)
        if (Array.isArray(data) && headers['x-total-count']) {
            return { items: data, total: parseInt(headers['x-total-count'], 10) || 0 } as any
        }

        // 场景 B: 真实后端 / 标准响应
        if (data && typeof data === 'object') {
            const isSuccess =
                data.code === 200 ||
                data.success === true ||
                data.Success === true;

            if (isSuccess) {
                return data
            } else {
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
                const newToken = await authStore.refreshSession()
                if (newToken) {
                    processQueue(null, newToken)
                    if (config.headers) config.headers.Authorization = `Bearer ${newToken}`
                    return service(config)
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null)
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