// 统计数据
import { ref } from 'vue'
import api from '@/api'


export function useDeviceSummary() {
    const summary = ref({
        total: 0,
        online: 0,
        activated: 0
    })

    const fetchSummary = async (dataCenter: string = '') => {
        try {
            // 🔥 修改点：将路径从 /devices/summary 改为 /dashboard/stats
            // 如果后端需要 dataCenter 参数，确保它被正确传递
            const params = dataCenter ? { dataCenter } : {}
            const response = await api.get('/dashboard/stats', { params })

            // 确保返回值结构匹配
            // 假设 /dashboard/stats 返回的是 { totalDevices, onlineDevices, activeDevices, ... }
            // 需要根据实际 API 响应做映射
            const data = response.data.data || response.data
            summary.value = {
                total: data.totalDevices || data.total || 0,
                online: data.onlineDevices || data.online || 0,
                activated: data.activeDevices || data.activated || 0
            }
        } catch (error) {
            console.error(error)
        }
    }

    return { summary, fetchSummary }
}