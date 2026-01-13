// src/utils/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

// 扩展 AxiosRequestConfig 以支持自定义属性
declare module 'axios' {
    export interface AxiosRequestConfig {
        _silent?: boolean; // 如果为 true，请求出错时不弹出全局 ElMessage
    }
}

// 1. 创建 axios 实例
const service: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// 2. 请求拦截器
service.interceptors.request.use(
    (config) => {
        // 登录和注册接口不需要 Token
        const url = config.url || '';
        const isAuthRequest =
            url.includes('/auth/login') ||
            url.includes('/api/Login/') ||  // 匹配 C# 后端路径
            url.includes('/api/Register/');

        // 如果不是认证接口，则尝试注入 Token
        if (!isAuthRequest) {
            const token = localStorage.getItem('authToken') // 统一使用 'authToken' 这个 key
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

// 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const { data, headers } = response

        // ============================================================
        // 适配场景 A: JSON Server (Mock) 列表响应
        // 特征: data 是数组，total 在 x-total-count header 中
        // ============================================================
        if (Array.isArray(data) && headers['x-total-count']) {
            return {
                items: data,
                total: parseInt(headers['x-total-count'], 10) || 0
            } as any
        }

        // ============================================================
        // 适配场景 B: JSON Server (Mock) 单个对象响应 (无 code 包装)
        // 特征: data 是对象但没有 code 字段 (通常是直接返回资源)
        // ============================================================
        if (data && typeof data === 'object' && !('code' in data) && !Array.isArray(data)) {
            // 假设这是直接返回的数据实体
            return data
        }

        // ============================================================
        // 适配场景 C: 标准后端响应 (Standard API)
        // 结构: { code: 200, data: ..., message: ... }
        // ============================================================
        // 某些接口可能直接返回 ApiResponse 结构，我们需要解包
        if (data && typeof data === 'object' && 'code' in data) {
            const apiRes = data as ApiResponse<any>
            if (apiRes.code === 200 || apiRes.success) {
                // 如果 data 字段里已经是分页结构 { items, total }，直接返回
                // 否则返回 data 本身
                return apiRes.data
            } else {
                ElMessage.error(apiRes.message || '请求失败')
                return Promise.reject(new Error(apiRes.message || 'Error'))
            }
        }

        // 其他情况，直接返回 data (兜底)
        return data
    },
    (error) => {
        const msg = error.response?.data?.message || error.message || '网络请求错误'
        ElMessage.error(msg)
        return Promise.reject(error)
    }
)

/**
 * 封装后的请求方法，自动推断返回类型
 * 这里的 T 通常是 data 的类型 (如 User, Device[], PaginatedResponse<Device>)
 */
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