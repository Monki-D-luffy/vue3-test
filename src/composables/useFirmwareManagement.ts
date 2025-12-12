// src/composables/useFirmwareManagement.ts
import { ref, reactive } from 'vue'
// ✅ 核心修复：指向正确的模块路径，而不是 '@/api'
import {
    fetchFirmwares,
    updateFirmware,
    deleteFirmware,
} from '@/api/modules/firmware'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Firmware } from '@/types'

export function useFirmwareManagement(productId?: string) {
    const loading = ref(false)
    const firmwareList = ref<Firmware[]>([])

    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 获取列表 (保留之前的修复，它是工作的)
    const getFirmwares = async (pid: string) => {
        if (!pid) return
        loading.value = true
        try {
            const params = {
                _page: pagination.currentPage,
                _limit: pagination.pageSize,
                productId: pid,
                _sort: 'uploadedAt',
                _order: 'desc'
            }

            const res: any = await fetchFirmwares(params)

            if (Array.isArray(res)) {
                firmwareList.value = res
                pagination.total = res.length
            } else if (res && Array.isArray(res.items)) {
                firmwareList.value = res.items
                pagination.total = Number(res.total || 0)
            } else {
                firmwareList.value = []
                pagination.total = 0
            }

        } catch (error) {
            console.error('Failed to fetch firmwares:', error)
            ElMessage.error('获取固件列表失败')
            firmwareList.value = []
        } finally {
            loading.value = false
        }
    }

    const handlePaginationChange = (pid: string) => {
        if (pid) getFirmwares(pid)
    }

    // 动作：验证固件
    const verifyFirmware = async (row: Firmware, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `确认将版本 ${row.version} 标记为"验证通过"吗？`,
                '验证确认',
                { confirmButtonText: '通过验证', type: 'success' }
            )
            // 调用 API
            await updateFirmware(row.id, { verified: true })

            ElMessage.success(`版本 ${row.version} 已就绪`)
            if (onSuccess) onSuccess()
        } catch (e) {
            // 如果不是用户取消操作，打印错误
            if (e !== 'cancel') console.error('Verify failed:', e)
        }
    }

    // 动作：删除固件
    const removeFirmware = async (row: Firmware, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `确定删除版本 ${row.version} 吗？`,
                '删除警告',
                { confirmButtonText: '删除', type: 'warning' }
            )
            // 调用 API
            await deleteFirmware(row.id)

            ElMessage.success('删除成功')
            if (onSuccess) onSuccess()
        } catch (e) {
            if (e !== 'cancel') console.error('Delete failed:', e)
        }
    }

    return {
        loading,
        firmwareList,
        pagination,
        getFirmwares,
        handlePaginationChange,
        verifyFirmware,
        removeFirmware
    }
}