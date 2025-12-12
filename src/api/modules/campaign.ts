import request from '@/utils/request'
import type { UpgradeTask, ApiResponse } from '@/types'

export const estimateUpgradeImpact = async (
    productId: string,
    firmwareId: string,
    filters: any
): Promise<{ total: number; online: number }> => {
    // 模拟延迟
    await new Promise(r => setTimeout(r, 400))
    const total = Math.floor(Math.random() * 50) + 5
    return { total: total, online: Math.floor(total * 0.6) }
}

export const createUpgradeCampaign = (payload: any) => {
    return request.post('/campaigns', payload)
}

export const fetchCampaigns = async (params: any = {}): Promise<{ items: UpgradeTask[], total: number }> => {
    // 泛型定义：Get请求，返回类型是 { items: [], total: number }
    const res = await request.get<{ items: UpgradeTask[], total: number }>('/campaigns', { params })
    //直接使用 res.items (因为拦截器已经去掉了最外层的 code:200 data 壳)
    return {
        items: res.items || [],
        total: res.total || 0
    }
}

export const deleteUpgradeCampaign = (campaignId: string) => {
    return request.delete(`/campaigns/${campaignId}`)
}