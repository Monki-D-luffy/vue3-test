// src/composables/useDeviceSummary.ts
import { ref } from 'vue'
import { fetchDeviceSummary } from '@/api/modules/device'
import type { DeviceSummary } from '@/types'

// 1. 定义后端原始数据的接口 (Based on your old working code)
// 这是一个 DTO (Data Transfer Object)，只在这一层使用，不对外暴露
interface RawDeviceSummary {
    totalDevices?: number | string;
    onlineDevices?: number | string;
    offlineDevices?: number | string;
    alertCount?: number | string;  // 对应 fault
    activeDevices?: number | string; // 对应 activated
    [key: string]: any; // 允许其他字段
}

// 2. 纯净的前端默认值
const DEFAULT_SUMMARY: DeviceSummary = {
    total: 0,
    online: 0,
    offline: 0,
    fault: 0,
    activated: 0,
    upgrade: 0
}

export function useDeviceSummary() {
    const loading = ref(false)
    // 确保初始化就有默认值，防止 UI 渲染报错
    const summary = ref<DeviceSummary>({ ...DEFAULT_SUMMARY })

    const fetchSummary = async (dataCenter?: string) => {
        loading.value = true
        try {
            // 获取原始数据，暂时断言为 any 或 RawDeviceSummary 以便处理
            const res = await fetchDeviceSummary(dataCenter) as unknown as RawDeviceSummary

            // 兼容逻辑：有时 axios 拦截器处理得太干净，有时又留了一层 data
            // 你的旧代码逻辑：const rawData = res?.data || res || {}
            const rawData = (res && 'data' in res ? res.data : res) || {}

            // 3. 核心修复：数据适配 (Adapter)
            // 将后端字段 (totalDevices) 映射到前端标准字段 (total)
            const total = Number(rawData.totalDevices || 0)
            const online = Number(rawData.onlineDevices || 0)

            // 保留你旧代码中的计算逻辑：如果没有 offlineDevices，则自动计算
            const offline = rawData.offlineDevices !== undefined
                ? Number(rawData.offlineDevices)
                : (total - online)

            summary.value = {
                total: total,
                online: online,
                offline: offline < 0 ? 0 : offline, // 防止负数
                fault: Number(rawData.alertCount || 0),   // 映射 alertCount -> fault
                activated: Number(rawData.activeDevices || 0), // 映射 activeDevices -> activated
                upgrade: 0 // 后端暂无此字段，给默认值
            }

        } catch (error) {
            console.error('Failed to fetch summary:', error)
            // 出错时保留上一次的数据或重置，增强容错性
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