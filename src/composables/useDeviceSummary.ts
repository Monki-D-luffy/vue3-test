// src/composables/useDeviceSummary.ts
import { ref } from 'vue'
// ✅ 引入具体的 API 函数，不再引入整个 api 对象
import { fetchDeviceSummary as fetchSummaryApi } from '@/api/modules/device'

export function useDeviceSummary() {
    const loading = ref(false)
    const summary = ref({
        total: 0,
        online: 0,
        active: 0,
        abnormal: 0 // 确保这里有默认值防止 undefined 报错
    })

    const fetchSummary = async (dataCenter: string = '') => {
        loading.value = true
        try {
            // ✅ 调用 API 模块
            // request.ts 拦截器返回的是 response.data
            // 假设后端返回结构为 { total: 100, online: 50, ... }
            const data: any = await fetchSummaryApi(dataCenter)

            // ✅ 赋值逻辑：优先使用返回数据，失败则回退到默认值
            // 这里做了字段兼容，以防后端字段名不一致（例如 totalDevices vs total）
            if (data) {
                summary.value = {
                    total: data.total || data.totalDevices || 0,
                    online: data.online || data.onlineDevices || 0,
                    active: data.active || data.activeDevices || data.activated || 0,
                    abnormal: data.abnormal || 0
                }
            }
        } catch (error) {
            console.error('Fetch summary failed:', error)
            // 出错时保持默认值或重置
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        summary,
        fetchSummary
    }
}