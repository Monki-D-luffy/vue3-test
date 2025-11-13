import { ref } from 'vue'
import {
    fetchFirmwares,
    updateFirmware,
    deleteFirmware,
} from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Firmware } from '@/types'



export function useFirmwareManagement(productId?: string) {
    const loading = ref(false)
    const firmwareList = ref<Firmware[]>([])

    // 获取列表
    const getFirmwares = async (pid: string) => {
        if (!pid) return
        loading.value = true
        try {
            const res = await fetchFirmwares({
                _page: 1,
                _limit: 100,
                productId: pid,
                _sort: 'uploadedAt',
                _order: 'desc'
            })
            firmwareList.value = res.items
        } catch (error) {
            console.error(error)
            ElMessage.error('获取固件列表失败')
        } finally {
            loading.value = false
        }
    }

    // 验证固件
    const verifyFirmware = async (row: Firmware, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `确认将版本 ${row.version} 标记为"验证通过"吗？\n标记后，该版本将出现在批量升级的候选列表中。`,
                '验证确认',
                { confirmButtonText: '通过验证', type: 'success' }
            )

            await updateFirmware(row.id, { verified: true })
            ElMessage.success(`版本 ${row.version} 已就绪`)
            if (onSuccess) onSuccess()
        } catch (e) {
            // cancel
        }
    }

    // 删除固件
    const removeFirmware = async (row: Firmware, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `确定删除版本 ${row.version} 吗？此操作不可恢复。`,
                '删除警告',
                { confirmButtonText: '删除', type: 'warning' }
            )
            await deleteFirmware(row.id)
            ElMessage.success('删除成功')
            if (onSuccess) onSuccess()
        } catch (e) {
            // cancel
        }
    }

    return {
        loading,
        firmwareList,
        getFirmwares,
        verifyFirmware,
        removeFirmware
    }
}