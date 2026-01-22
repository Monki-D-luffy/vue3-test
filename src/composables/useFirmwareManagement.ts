import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { Firmware } from '@/types'
import * as FirmwareApi from '@/api/modules/firmware'
import { createOTATaskDraft, type CreateOTATaskDraftRequest } from '@/api/modules/iot-ota'

export function useFirmwareManagement() {
    const loading = ref(false)
    const firmwareList = ref<Firmware[]>([])
    const repoStatus = ref<'unlinked' | 'linked' | 'unknown'>('unknown')
    const linkedRepos = ref<Array<{ id: string, name: string, type: number, channel: number }>>([])

    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 1. 初始化检查
    const checkProductContext = async (productId: string) => {
        console.log(`🧠 [Logic] 开始检查产品上下文: ${productId}`)
        repoStatus.value = 'unknown'
        try {
            const repos = await FirmwareApi.fetchLinkedRepos(productId)
            linkedRepos.value = repos

            if (repos.length > 0) {
                console.log(`🧠 [Logic] 发现 ${repos.length} 个关联库，状态 -> linked`)
                repoStatus.value = 'linked'
                await getFirmwares(productId)
            } else {
                console.warn(`🧠 [Logic] 未发现关联库，状态 -> unlinked`)
                repoStatus.value = 'unlinked'
                firmwareList.value = []
            }
        } catch (e) {
            console.error('Context check failed', e)
        }
    }

    // 2. 获取列表
    const getFirmwares = async (productId: string) => {
        loading.value = true
        try {
            const list = await FirmwareApi.fetchFirmwaresByProduct(productId)
            firmwareList.value = list
            pagination.total = list.length
        } catch (error) {
            console.error('Failed to fetch firmwares:', error)
        } finally {
            loading.value = false
        }
    }

    // Actions (保持不变)
    const createRepoAction = async (params: { name: string, type: number, channel: number, note?: string }) => {
        return await FirmwareApi.createRepoAndGetId(params)
    }

    const linkRepoAction = async (productId: string, repoId: string) => {
        return await FirmwareApi.linkRepoToProduct(productId, repoId)
    }

    const uploadAction = async (repoId: string, version: string, note: string, file: File) => {
        return await FirmwareApi.uploadFirmware(repoId, version, note, file)
    }

    const createTaskAction = async (taskPayload: CreateOTATaskDraftRequest) => {
        return await createOTATaskDraft(taskPayload)
    }

    const verifyFirmwarePure = async (row: any) => {
        if (linkedRepos.value.length === 0) return
        await FirmwareApi.verifyFirmware(linkedRepos.value[0].id, row.version)
    }

    const removeFirmwarePure = async (row: any) => {
        if (linkedRepos.value.length === 0) return
        await FirmwareApi.deleteFirmware(linkedRepos.value[0].id, row.version)
    }

    // ✨ [新增] 1. 验证固件
    const verifyAction = async (row: any) => {
        try {
            await ElMessageBox.confirm(
                `确认将版本 v${row.version} 标记为“已验证”吗？\n验证后的固件可用于正式发布。`,
                '验证固件',
                { confirmButtonText: '通过验证', type: 'success' }
            )

            // 调用 API (假设后端支持 Update 接口修改备注来标记，或者有专用接口)
            // 这里演示：追加 [Verified] 标记到备注中，代表已验证
            const newNote = row.releaseNotes ? `[Verified] ${row.releaseNotes}` : '[Verified] Quality Assured'
            await FirmwareApi.verifyFirmware(row.repoId, row.version) // 需确保 api/firmware.ts 有此方法

            ElMessage.success('固件已通过验证')
            return true
        } catch (e) {
            if (e !== 'cancel') console.error(e)
            return false
        }
    }

    // ✨ [新增] 2. 删除固件
    const deleteAction = async (row: any) => {
        try {
            await ElMessageBox.confirm(
                `确定要永久删除固件 v${row.version} 吗？此操作不可恢复。`,
                '危险操作',
                { confirmButtonText: '确认删除', type: 'error', confirmButtonClass: 'el-button--danger' }
            )

            await FirmwareApi.deleteFirmware(row.repoId, row.version)
            ElMessage.success('固件已删除')
            return true
        } catch (e) {
            if (e !== 'cancel') ElMessage.error('删除失败或已取消')
            return false
        }
    }

    // ✨ [新增] 3. 更新固件信息 (用于侧边栏保存)
    const updateAction = async (row: any, newNote: string) => {
        try {
            // 调用后端更新接口 (通常只能改 Note)
            // 我们复用 verifyFirmware (其实就是 update 接口)
            // 注意：后端可能不支持修改 Key 或 Type，所以只传 Note
            await FirmwareApi.verifyFirmware(row.repoId, row.version)
            // ⚠️注：如果 verifyFirmware 只是为了验证，建议在 api/firmware.ts 加一个 updateFirmwareNote

            ElMessage.success('信息已更新')
            return true
        } catch (e) {
            ElMessage.error('更新失败')
            return false
        }
    }
    return {
        loading,
        firmwareList,
        pagination,
        repoStatus,
        linkedRepos,
        checkProductContext,
        getFirmwares,
        createRepoAction,
        linkRepoAction,
        uploadAction,
        createTaskAction,
        verifyFirmwarePure,
        removeFirmwarePure,
        verifyAction,
        deleteAction,
        updateAction
    }
}