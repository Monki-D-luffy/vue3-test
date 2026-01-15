// src/api/modules/firmware.ts
import request from '@/api/core/request'
import type { Firmware, PaginationParams, PaginatedResponse, ApiResponse } from '@/types'

// 通用查询参数接口
export interface FirmwareQueryParams extends PaginationParams {
    productId?: string
    q?: string
    _sort?: string
    _order?: string
    [key: string]: any
}

// 获取固件列表
// 返回 Promise<any> 以允许适配器处理
export const fetchFirmwares = (params: FirmwareQueryParams) => {
    return request.get<any>('/firmwares', { params })
}

// 上传固件
export const uploadFirmware = (data: any) => {
    return request.post<Firmware>('/firmwares', {
        ...data,
        verified: false
    })
}

// 更新固件 (关键修复: 移除 async/await 和 .data 解包)
export const updateFirmware = (id: string, updates: Partial<Firmware>) => {
    return request.patch<Firmware>(`/firmwares/${id}`, updates)
}

// 删除固件 (关键修复: 移除 async/await 和 .data 解包)
export const deleteFirmware = (id: string) => {
    return request.delete<void>(`/firmwares/${id}`)
}
