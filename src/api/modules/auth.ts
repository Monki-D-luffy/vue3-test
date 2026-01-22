import request from '@/api/core/request'
import type { LoginParams, LoginResult } from '@/api/types/auth'

// --- 类型定义 ---
export interface LoginRequest {
    userName: string;
    password: string;
    productName?: string;
}

export interface LoginResponseData {
    accessToken: string;
    refreshToken: string;
    accessExpired: number;
    userId: string;
    email: string;
    role?: string;
    nickname?: string;
    iconUrl?: string;
    isEnabled: boolean;
}

// --- 接口方法 ---
export const login = (data: LoginRequest) => {
    // 🔍【排错日志 API】确认 API 层收到的数据是否正确
    console.log('📡 [API Layer] 发起请求, 数据:', data);

    // 注意：这里不需要再加 /api 前缀，因为 request.ts 或 vite 代理会处理
    // 最终路径由 vite 代理 /api/identity -> https://iotserver.../manager-identity/
    return request.post<LoginResult>('/identity/api/Login/LoginByPwd', data)
}

/**
 * 刷新令牌接口
 * 修正: 之前的 /RefreshToken 报 404 (Not Found)，修正为 /Refresh
 */
export const refreshTokenApi = (token: string) => {
    console.log('🔄 [API] 正在调用修正后的刷新接口: /identity/api/Login/Refresh');
    return request.post<LoginResult>('/identity/api/Login/Refresh', {
        refreshToken: token
    })
}

// 兼容旧引用
export const refreshToken = refreshTokenApi;

export const register = async (data: any) => {
    return Promise.resolve({})
}