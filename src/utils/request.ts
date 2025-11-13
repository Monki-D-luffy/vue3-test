// src/utils/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { STORAGE_KEYS } from '@/types/index' // 引用你定义的常量
import router from '@/router'

// 1. 创建 axios 实例
const service: AxiosInstance = axios.create({
    // 基础 URL，通常在 .env 文件中配置 VITE_API_BASE_URL
    // 如果没配置，默认使用 /api (配合 Vite 的 proxy)
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000, // 请求超时时间
    headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

// 2. 请求拦截器 (Request Interceptor)
service.interceptors.request.use(
    (config) => {
        // 在发送请求之前做些什么
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
        if (token && config.headers) {
            // 按照常见的 JWT 标准，添加 Bearer 前缀
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        // 对请求错误做些什么
        console.error('Request Error:', error)
        return Promise.reject(error)
    }
)

// 3. 响应拦截器 (Response Interceptor)
service.interceptors.response.use(
    (response: AxiosResponse) => {
        // HTTP 状态码为 2xx 时进入这里
        const res = response.data

        // 这里的逻辑取决于你们后端的约定。
        // 假设后端返回结构是 { code: 200, data: ..., message: ... }

        // 如果是二进制数据(文件下载)，直接返回
        if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
            return res
        }

        // 校验业务状态码 (假设 200 代表成功)
        // 注意：json-server 默认直接返回数据对象，没有 code 字段，
        // 所以如果你是用 json-server 模拟，需要放宽判断：
        if (res.code !== undefined && res.code !== 200) {
            ElMessage.error(res.message || '系统错误')

            // 401: Token 过期或未登录
            if (res.code === 401) {
                localStorage.removeItem(STORAGE_KEYS.TOKEN)
                router.push('/login')
            }
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            // 兼容 json-server 或标准接口
            return response // 建议返回完整 response 或 response.data，看个人习惯。为了通用性，这里建议返回 res (response.data)
        }
    },
    (error) => {
        // HTTP 状态码超出 2xx 范围
        console.error('Response Error:', error)

        let message = '网络连接异常'
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    message = '未授权，请重新登录'
                    localStorage.removeItem(STORAGE_KEYS.TOKEN)
                    router.push('/login')
                    break
                case 403:
                    message = '拒绝访问'
                    break
                case 404:
                    message = '请求资源不存在'
                    break
                case 500:
                    message = '服务器内部错误'
                    break
                default:
                    message = `连接错误 ${error.response.status}`
            }
        }

        ElMessage.error(message)
        return Promise.reject(error)
    }
)

export default service