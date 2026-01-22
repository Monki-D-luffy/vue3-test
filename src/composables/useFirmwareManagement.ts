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
        // console.log(`🧠 [Logic] 开始检查产品上下文: ${productId}`)
        repoStatus.value = 'unknown'
        try {
            const repos = await FirmwareApi.fetchLinkedRepos(productId)
            linkedRepos.value = repos

            if (repos.length > 0) {
                // console.log(`🧠 [Logic] 发现 ${repos.length} 个关联库，状态 -> linked`)
                repoStatus.value = 'linked'
                await getFirmwares(productId)
            } else {
                // console.warn(`🧠 [Logic] 未发现关联库，状态 -> unlinked`)
                repoStatus.value = 'unlinked'
                firmwareList.value = []
            }
        } catch (e) {
            console.error('Context check failed', e)
        }
    }

    // 2. 获取列表 (前端分页)
    const getFirmwares = async (productId: string) => {
        loading.value = true
        try {
            // 获取全量数据 (API 已经做了聚合)
            const allList = await FirmwareApi.fetchFirmwaresByProduct(productId)

            // 简单的内存分页 (因为 API 是聚合拉取，后端分页在多库场景下较难处理，暂由前端切片)
            // 如果列表变得非常大，后续需要在 API 层优化聚合逻辑
            pagination.total = allList.length
            const start = (pagination.currentPage - 1) * pagination.pageSize
            const end = start + pagination.pageSize
            firmwareList.value = allList.slice(start, end)

        } catch (error) {
            console.error('Failed to fetch firmwares:', error)
            firmwareList.value = []
        } finally {
            loading.value = false
        }
    }

    // 分页处理
    const handlePaginationChange = (productId: string) => {
        getFirmwares(productId)
    }

    // --- Actions (纯函数，供 UI 组件调用) ---

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

    /**
     * [纯净版] 验证固件
     * 供 ExpFirmwareVerifyModal 调用
     */
    const verifyFirmwarePure = async (repoId: string, version: string, note?: string) => {
        await FirmwareApi.verifyFirmware(repoId, version, note)
    }

    /**
     * [纯净版] 删除固件
     * 供 ExpFirmwareDeleteModal 调用
     */
    const removeFirmwarePure = async (repoId: string, version: string) => {
        await FirmwareApi.deleteFirmware(repoId, version)
    }

    /**
     * [新增] 更新固件信息 (用于侧边栏保存)
     */
    const updateAction = async (row: any, newNote: string) => {
        try {
            loading.value = true
            await FirmwareApi.updateFirmware(row.repoId, row.version, newNote)
            ElMessage.success('固件信息已更新')
            return true
        } catch (e) {
            ElMessage.error('更新失败')
            console.error(e)
            return false
        } finally {
            loading.value = false
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
        handlePaginationChange,
        createRepoAction,
        linkRepoAction,
        uploadAction,
        createTaskAction,
        verifyFirmwarePure,
        removeFirmwarePure,
        updateAction
    }
}