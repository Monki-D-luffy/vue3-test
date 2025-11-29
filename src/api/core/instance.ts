// src/api/core/instance.ts
import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = '/api'

const api = axios.create({
    baseURL: API_BASE_URL
})

// 扩展 Axios 配置类型
declare module 'axios' {
    export interface AxiosRequestConfig {
        _silent?: boolean;
    }
}

// 请求拦截器
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

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        if (response.data && response.data.code && response.data.code !== 200) {
            if (response.data.code !== 401) ElMessage.error(response.data.message || '请求失败')
            return Promise.reject(new Error(response.data.message || 'Error'))
        }
        return response
    },
    (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthRequest = requestUrl.endsWith('/auth/login') || requestUrl.endsWith('/auth/register');

        if (error.response && error.response.status === 401) {
            if (!isAuthRequest) {
                ElMessage.error('会话已过期，请重新登录。')
                localStorage.removeItem('authToken')
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
            }
        } else {
            if (!error.config?._silent) ElMessage.error(error.message || '网络错误')
        }
        return Promise.reject(error)
    }
)

export default api