// src/api/services/deviceService.ts
import request from '@/api/core/request'
import type { DeviceModel, DeviceQueryParams } from '@/api/types/device'

// 1:1 映射后端接口 URL
enum Api {
    List = '/Devices/GetDevices',
    Count = '/Devices/GetDevicesTotalCount'
}

/**
 * 获取设备列表数据
 * 对应 DevicesApiService.cs -> GetDevicesAsync
 * 方法: POST, 参数: JSON Body
 */
export const fetchDeviceList = (data: DeviceQueryParams) => {
    // 注意：后端使用 CamelCase，request 拦截器通常不需要特殊处理，除非后端要 PascalCase
    // 根据 ApiClient.cs 分析，后端配置了 JsonNamingPolicy.CamelCase，所以前端直接传小驼峰即可
    return request.post<DeviceModel[]>(Api.List, data)
}

/**
 * 获取设备总数
 * 对应 DevicesApiService.cs -> GetDeviceRegionCountAsync
 * ⚠️ 重点坑：C#代码显示 url = $"{Url}?country={region}"，且 body 为 null
 */
export const fetchDeviceCount = (country?: string) => {
    return request.post<number>(Api.Count, null, {
        // 必须放在 params 里，Axios 会把它拼接到 URL 后面
        params: { country: country || '' }
    })
}