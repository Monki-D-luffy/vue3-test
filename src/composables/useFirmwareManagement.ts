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
        removeFirmwarePure
    }
}