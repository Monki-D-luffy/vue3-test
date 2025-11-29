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
    const res = await request.get<any, ApiResponse<UpgradeTask[]>>('/campaigns', { params })
    const items = res.data || []
    return {
        items,
        total: Number(res.total || items.length)
    }
}

export const deleteUpgradeCampaign = (campaignId: string) => {
    return request.delete(`/campaigns/${campaignId}`)
}