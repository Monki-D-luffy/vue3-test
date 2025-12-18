import request from '@/utils/request'
import type { UserRegisterData, UserInfo, ApiResponse } from '@/types'

export const login = (data: any) => {
    return request.post('/auth/login', data)
}

export const register = async (data: UserRegisterData): Promise<UserInfo> => {
    const res = await request.post<any>('/auth/register', data)
    return res.data // 根据 request.ts 的拦截器，这里其实返回的就是 response.data
}