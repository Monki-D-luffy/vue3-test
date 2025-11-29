import request from '@/utils/request'
import type { Firmware, Product, PaginationParams, PaginatedResponse, ApiResponse } from '@/types'

export const fetchProducts = async (): Promise<Product[]> => {
    const res = await request.get<any, ApiResponse<Product[]>>('/products')
    // 兼容处理
    return res.data || (Array.isArray(res) ? res : [])
}

export const fetchFirmwares = async (params: PaginationParams): Promise<PaginatedResponse<Firmware>> => {
    const res = await request.get<any, ApiResponse<Firmware[]>>('/firmwares', { params })
    return {
        items: res.data || [],
        total: Number(res.total || 0)
    }
}

export const uploadFirmware = async (data: any): Promise<Firmware> => {
    const res = await request.post<any, ApiResponse<Firmware>>('/firmwares', {
        ...data,
        verified: false
    })
    return res.data
}

export const updateFirmware = async (id: string, updates: Partial<Firmware>): Promise<Firmware> => {
    const res = await request.patch<any, ApiResponse<Firmware>>(`/firmwares/${id}`, updates)
    return res.data
}

export const deleteFirmware = (id: string) => {
    return request.delete(`/firmwares/${id}`)
}