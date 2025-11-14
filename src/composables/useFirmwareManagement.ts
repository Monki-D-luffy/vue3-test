import { ref, reactive } from 'vue'
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

    // ✨ 新增：分页状态
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 获取列表 (支持分页)
    const getFirmwares = async (pid: string) => {
        if (!pid) return
        loading.value = true
        try {
            // ✨ 传入分页参数
            const res = await fetchFirmwares({
                _page: pagination.currentPage,
                _limit: pagination.pageSize,
                productId: pid,
                _sort: 'uploadedAt',
                _order: 'desc'
            })
            firmwareList.value = res.items
            pagination.total = res.total // ✨ 更新总数
        } catch (error) {
            console.error(error)
            ElMessage.error('获取固件列表失败')
        } finally {
            loading.value = false
        }
    }

    // ✨ 新增：分页变化回调
    const handlePaginationChange = (pid: string) => {
        if (pid) getFirmwares(pid)
    }

    // 纯净 API 动作
    const verifyFirmwarePure = async (id: string) => {
        await updateFirmware(id, { verified: true })
    }

    const removeFirmwarePure = async (id: string) => {
        await deleteFirmware(id)
    }

    // 传统交互封装
    const verifyFirmware = async (row: Firmware, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `确认将版本 ${row.version} 标记为"验证通过"吗？`, '验证确认',
                { confirmButtonText: '通过验证', type: 'success' }
            )
            await verifyFirmwarePure(row.id)
            ElMessage.success(`版本 ${row.version} 已就绪`)
            if (onSuccess) onSuccess()
        } catch (e) { /* cancel */ }
    }

    const removeFirmware = async (row: Firmware, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `确定删除版本 ${row.version} 吗？`, '删除警告',
                { confirmButtonText: '删除', type: 'warning' }
            )
            await removeFirmwarePure(row.id)
            ElMessage.success('删除成功')
            if (onSuccess) onSuccess()
        } catch (e) { /* cancel */ }
    }

    return {
        loading,
        firmwareList,
        pagination, // 导出分页对象
        getFirmwares,
        handlePaginationChange, // 导出分页回调
        verifyFirmware,
        removeFirmware,
        verifyFirmwarePure,
        removeFirmwarePure
    }
}