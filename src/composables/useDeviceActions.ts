// 处理设备操作，如删除
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useDeviceActions() {

    // 删除设备逻辑
    // onSuccess 是一个回调函数，删除成功后执行（通常用于刷新列表）
    const handleDelete = async (row: any, onSuccess?: () => void) => {
        try {
            await ElMessageBox.confirm(
                `您确定要删除设备 "${row.name}" (ID: ${row.id}) 吗？此操作不可撤销。`,
                '删除确认',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                }
            )

            await api.delete(`/devices/${row.id}`)
            ElMessage.success('设备删除成功！')

            // 如果提供了回调函数，则执行它
            if (onSuccess) {
                onSuccess()
            }

        } catch (error) {
            if (error !== 'cancel') {
                ElMessage.error('删除失败，请稍后重试')
                console.error(error)
            } else {
                ElMessage.info('已取消删除')
            }
        }
    }

    return {
        handleDelete
    }
}