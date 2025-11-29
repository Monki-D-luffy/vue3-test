// src/utils/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

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
        const isAuthRequest = config.url && (config.url.endsWith('/auth/login') || config.url.endsWith('/auth/register'));

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

// 3. 响应拦截器
service.interceptors.response.use(
    (response: AxiosResponse) => {
        const res = response.data

        // 二进制数据直接返回
        if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
            return res
        }
        // 如果是列表数据，尝试把 header 里的 x-total-count 注入到 res 对象里（如果是对象的话）
        if (res && typeof res === 'object' && response.headers['x-total-count']) {
            res.total = Number(response.headers['x-total-count'])
        }
        // 兼容处理：有些后端直接返回数组或不带 code 的对象
        // 如果存在 code 且不为 200，视为业务错误
        if (res && res.code !== undefined && res.code !== 200) {
            if (!response.config._silent) {
                ElMessage.error(res.message || '系统错误')
            }
            return Promise.reject(new Error(res.message || 'Error'))
        }

        // 默认返回 response.data (即 res)，保持与原有逻辑一致
        return res
    },
    (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthRequest = requestUrl.endsWith('/auth/login') || requestUrl.endsWith('/auth/register');
        const isSilent = error.config?._silent;

        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // ✨ 关键逻辑保留：如果是登录/注册接口的 401，说明是账号密码错误，不处理为“会话过期”
                    if (!isAuthRequest) {
                        if (!isSilent) ElMessage.error('会话已过期，请重新登录')
                        localStorage.removeItem('authToken')
                        const currentPath = router.currentRoute.value.fullPath;

                        // 避免重复跳转
                        if (window.location.pathname !== '/login') {
                            // 使用 router.push 比 window.location.href 体验更好
                            router.push(`/login?redirect=${encodeURIComponent(currentPath || '/')}`)
                        }
                    }
                    break
                case 403:
                    if (!isSilent) ElMessage.error('拒绝访问')
                    break
                case 404:
                    if (!isSilent) ElMessage.error('请求资源不存在')
                    break
                case 500:
                    if (!isSilent) ElMessage.error('服务器内部错误')
                    break
                default:
                    if (!isSilent) ElMessage.error(error.message || '网络连接异常')
            }
        } else {
            if (!isSilent) ElMessage.error('网络连接异常，请检查网络')
        }

        return Promise.reject(error)
    }
)

export default service