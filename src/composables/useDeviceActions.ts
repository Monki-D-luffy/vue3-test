// src/composables/useDeviceActions.ts
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Device } from '@/types' // ✨ 使用类型

export function useDeviceActions() {

    // ✨ 给 row 加上类型
    const handleDelete = async (row: Device, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `您确定要删除设备 "${row.name}" (ID: ${row.id}) 吗？此操作不可撤销。`,
                '删除确认',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                    // ✨ 优化：关闭 close-on-click-modal 防止误触
                    closeOnClickModal: false
                }
            )

            await api.delete(`/devices/${row.id}`)
            ElMessage.success('设备删除成功！')

            if (onSuccess) {
                onSuccess()
            }

        } catch (error) {
            if (error !== 'cancel') {
                // 拦截器处理了网络层错误，但业务层如果想给更明确的反馈也可以保留
                // console.error(error)
            } else {
                ElMessage.info('已取消删除')
            }
        }
    }

    return {
        handleDelete
    }
}