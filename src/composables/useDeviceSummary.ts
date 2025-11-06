// 统计数据
import { ref } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

export function useDeviceSummary() {
    const summary = ref({
        total: 0,
        activated: 0,
        online: 0
    })

    // 接收 dataCenter 作为参数，使其更灵活
    const fetchSummary = async (dataCenter: string) => {
        try {
            const response = await api.get(`/devices/summary`, {
                params: { dataCenter }
            })
            summary.value = response.data.data
        } catch (error) {
            ElMessage.error('获取统计数据失败')
            console.error(error)
        }
    }

    return {
        summary,
        fetchSummary
    }
}