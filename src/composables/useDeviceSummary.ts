import { ref } from 'vue'
import { fetchDeviceSummary as fetchSummaryApi } from '@/api/modules/device'
import type { DeviceSummary } from '@/types'

export function useDeviceSummary() {
    // 初始化默认值
    const summary = ref<DeviceSummary>({
        total: 0,
        online: 0,
        offline: 0,
        fault: 0,
        activated: 0
    })

    const fetchSummary = async (dataCenter?: string) => {
        try {
            const res: any = await fetchSummaryApi(dataCenter)

            // 1. 解包：先尝试取 res.data，如果不存在则用 res 本身
            // 你的数据结构是 { code: 200, data: { ... } }，所以这里 rawData 会拿到内部那个对象
            const rawData = res?.data || res || {}

            // console.log('Raw Summary Data:', rawData) // 调试用

            // 2. 字段映射 (Mapping)
            // 后端字段 -> 前端标准字段
            const total = Number(rawData.totalDevices || 0)
            const online = Number(rawData.onlineDevices || 0)

            // 3. 计算衍生数据
            // 如果后端没给 offline，我们用 总数 - 在线数 估算
            const offline = rawData.offlineDevices !== undefined
                ? Number(rawData.offlineDevices)
                : (total - online)

            summary.value = {
                total: total,
                online: online,
                offline: offline < 0 ? 0 : offline, // 防止负数

                // alertCount 通常对应“故障”或“告警”状态
                fault: Number(rawData.alertCount || 0),

                // activeDevices 对应我们的 activated
                activated: Number(rawData.activeDevices || 0)
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error)
        }
    }

    return {
        summary,
        fetchSummary
    }
}