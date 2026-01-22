<template>
    <div class="firmware-page h-full flex flex-col">
        <ExpFirmwareHeader :stats="{ total: pagination.total, verified: verifiedCount }" @refresh="handleRefresh" />

        <div class="flex-1 overflow-hidden p-6">
            <div class="h-full bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col">
                <ExpFirmwareVersionPanel :product="product" :firmware-list="firmwareList" :loading="loading"
                    :repo-status="repoStatus" :pagination="pagination" @upload="openUploadWizard" @verify="handleVerify"
                    @delete="handleDelete" @page-change="getFirmwares(product.id)" />
            </div>
        </div>

        <ExpFirmwareUploadWizard v-model="wizardVisible" :product="product" :repo-status="repoStatus"
            :linked-repos="linkedRepos" @success="handleRefresh" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import type { Product } from '@/types'

// Components
import ExpFirmwareHeader from '../components/firmware/ExpFirmwareHeader.vue'
import ExpFirmwareVersionPanel from '../components/firmware/ExpFirmwareVersionPanel.vue'
import ExpFirmwareUploadWizard from '../components/firmware/ExpFirmwareUploadWizard.vue'

// Inject Product Context
const product = inject<Product>('productContext') || { id: '', name: 'Unknown' } as Product

const {
    loading,
    firmwareList,
    pagination,
    repoStatus,
    linkedRepos,
    checkProductContext,
    getFirmwares,
    verifyFirmwarePure,
    removeFirmwarePure
} = useFirmwareManagement()

// State
const wizardVisible = ref(false)

// Computed
const verifiedCount = computed(() => firmwareList.value.filter(f => f.verified).length)

// ⚡️ 修复核心：监听 product.id，防止因为异步加载导致 ID 为空时就去查询
watch(() => product.id, (newId) => {
    if (newId) {
        console.log('📦 Product Context Ready:', newId)
        checkProductContext(newId)
    }
}, { immediate: true })

// Handlers
const handleRefresh = () => {
    if (product.id) {
        checkProductContext(product.id)
    }
}

const openUploadWizard = () => {
    wizardVisible.value = true
}

const handleVerify = async (row: any) => {
    await verifyFirmwarePure(row)
    handleRefresh()
}

const handleDelete = async (row: any) => {
    await removeFirmwarePure(row)
    handleRefresh()
}
</script>

<style scoped>
.firmware-page {
    background-color: var(--el-bg-color-page);
}
</style>