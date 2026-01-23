// src/composables/useFirmwareManagement.ts

import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { Firmware } from '@/types'
import * as FirmwareApi from '@/api/modules/firmware'
import { createOTATaskDraft, type CreateOTATaskDraftRequest } from '@/api/modules/iot-ota'

export function useFirmwareManagement() {
    const loading = ref(false)
    const firmwareList = ref<Firmware[]>([])

    // 状态标记：unknown=未检查, linked=有关联库, unlinked=无关联库
    const repoStatus = ref<'unlinked' | 'linked' | 'unknown'>('unknown')
    const linkedRepos = ref<Array<{ id: string; name: string; type: number; channel: number }>>([])

    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0,
    })

    // 1. 初始化检查 (Context Check)
    const checkProductContext = async (productId: string) => {
        // console.log(`🧠 [Logic] 开始检查产品上下文: ${productId}`)
        repoStatus.value = 'unknown'
        try {
            const repos = await FirmwareApi.fetchLinkedRepos(productId)
            linkedRepos.value = repos

            if (repos.length > 0) {
                repoStatus.value = 'linked'
                // 上下文检查完毕，顺便拉取一次固件（此时 repos 肯定有值）
                await getFirmwares(productId, repos)
            } else {
                repoStatus.value = 'unlinked'
                firmwareList.value = []
            }
        } catch (e) {
            console.error('Context check failed', e)
        }
    }

    // 2. 获取列表 (前端伪分页)
    const getFirmwares = async (
        productId: string,
        knownRepos?: Array<{ id: string; name: string; type: number }>,
    ) => {
        loading.value = true
        try {
            // 🛑 核心修复点：不要盲目信任 linkedRepos 的初始空数组
            // 只有当明确传入了 knownRepos，或者当前状态确认为 'linked' 时，才使用缓存
            let reposToUse = knownRepos

            if (!reposToUse) {
                if (repoStatus.value === 'linked' && linkedRepos.value.length > 0) {
                    // 缓存命中：确实有关联库，直接用
                    reposToUse = linkedRepos.value
                    console.log('🧠 [Logic] 命中仓库缓存，跳过重复请求')
                } else {
                    // 缓存未命中（状态是 unknown 或 unlinked），传 undefined 给 API，强制 API 重新拉取
                    reposToUse = undefined
                    console.log('🧠 [Logic] 无有效缓存，通知 API 重新拉取仓库列表')
                }
            }

            // API 调用：如果 reposToUse 是 undefined，API 内部会自己去 fetchLinkedRepos
            const allList = await FirmwareApi.fetchFirmwaresByProduct(productId, reposToUse)

            // 更新总数
            pagination.total = allList.length

            // 内存分页切片
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

    const handlePaginationChange = (productId: string) => {
        getFirmwares(productId)
    }

    // --- Actions ---

    const createRepoAction = async (params: {
        name: string
        type: number
        channel: number
        note?: string
    }) => {
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

    const verifyFirmwarePure = async (repoId: string, version: string, note?: string) => {
        await FirmwareApi.verifyFirmware(repoId, version, note)
    }

    const removeFirmwarePure = async (repoId: string, version: string) => {
        await FirmwareApi.deleteFirmware(repoId, version)
    }

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
        updateAction,
    }
}