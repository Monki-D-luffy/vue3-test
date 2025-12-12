import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { Firmware } from '@/types'
// 引用你原本已有的 API 函數
import {
    fetchFirmwares,
    updateFirmware, // 對應驗證功能 (更新狀態)
    deleteFirmware  // 對應刪除功能
} from '@/api/modules/firmware'

export function useFirmwareManagement() {
    const loading = ref(false)
    const firmwareList = ref<Firmware[]>([])
    // 你的原始分頁邏輯
    const pagination = reactive({
        currentPage: 1,
        pageSize: 10,
        total: 0
    })

    // 獲取固件列表
    const getFirmwares = async (productId: string) => {
        if (!productId) return

        loading.value = true
        try {
            // 根據你的 API 定義調用 fetchFirmwares
            const res = await fetchFirmwares({
                productId,
                page: pagination.currentPage,
                limit: pagination.pageSize,
                _page: 0,
                _limit: 0
            })

            // 處理回傳結構，兼容 items/list 格式
            if (res && Array.isArray(res.items)) {
                firmwareList.value = res.items
                pagination.total = res.total || 0
            } else if (Array.isArray(res)) {
                firmwareList.value = res
                pagination.total = res.length
            }

        } catch (error) {
            console.error('獲取固件列表失敗:', error)
            firmwareList.value = []
        } finally {
            loading.value = false
        }
    }

    const handlePaginationChange = (productId: string) => {
        getFirmwares(productId)
    }

    // --- 橋接函數 ---

    /**
     * 驗證固件 (Pure版 - 不處理 UI Loading，只回傳 Promise)
     * 對應 UI 中的 verifyFirmwarePure
     * 實際上是呼叫 updateFirmware 來更新 verified 狀態
     */
    const verifyFirmwarePure = async (id: string | number) => {
        // 使用你現有的 updateFirmware API
        // 假設後端接受 { verified: true } 來標記驗證通過
        return await updateFirmware(String(id), { verified: true })
    }

    /**
     * 刪除固件 (Pure版)
     * 對應 UI 中的 removeFirmwarePure
     * 實際上是呼叫 deleteFirmware
     */
    const removeFirmwarePure = async (id: string | number) => {
        // 使用你現有的 deleteFirmware API
        return await deleteFirmware(String(id))
    }

    return {
        loading,
        firmwareList,
        pagination,
        getFirmwares,
        handlePaginationChange,
        // 導出 UI 元件需要的函數名稱
        verifyFirmwarePure,
        removeFirmwarePure
    }
}