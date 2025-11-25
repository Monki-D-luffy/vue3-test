<template>
    <div class="firmware-layout-wrapper">

        <DeviceStatsOverview :summary="summary" />

        <div class="card-base main-content-card">
            <DeviceTableToolbar v-model:filters="filters" :products="products" :loading="loading" @search="handleSearch"
                @refresh="handleRefresh" @export="handleExport" />

            <DeviceListTable ref="tableComponentRef" :device-list="deviceList" :loading="loading"
                :pagination="pagination" @selection-change="handleSelectionChange" @page-change="handlePageChange"
                @size-change="handleSizeChange" @open-detail="openDetail" @unbind="handleUnbind" />
        </div>

        <DeviceBatchActionBar :selected-count="selectedRows.length" @batch-delete="handleBatchDelete"
            @batch-restart="handleBatchRestart" @batch-enable="handleBatchEnable" @clear-selection="clearSelection" />

        <ExpDeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceTableToolbar from './components/DeviceTableToolbar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import ExpDeviceDetailDrawer from '@/components/ExpDeviceDetailDrawer.vue'

import { useDeviceList } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { fetchProducts } from '@/api'
import type { Device, Product } from '@/types'

// --- 状态逻辑 ---
const {
    loading,
    deviceList,
    pagination,
    fetchDevices,
    handleSizeChange: _handleSizeChange,
    handleCurrentChange: _handleCurrentChange
} = useDeviceList()

const { summary, fetchSummary } = useDeviceSummary()

const filters = reactive({
    keyword: '',
    productId: '',
    isBound: ''
})

const products = ref<Product[]>([])
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable>>()

onMounted(async () => {
    pagination.currentPage = 1
    loadData()
    fetchSummary('')
    products.value = await fetchProducts()
})

const handleSearch = () => { pagination.currentPage = 1; loadData() }
const handleRefresh = () => { loadData(); fetchSummary(''); ElMessage.success('已刷新') }
const loadData = () => fetchDevices({ ...filters })

const handlePageChange = (val: number) => { _handleCurrentChange(val); loadData() }
const handleSizeChange = (val: number) => { _handleSizeChange(val); loadData() }

const handleSelectionChange = (rows: Device[]) => { selectedRows.value = rows }
const clearSelection = () => { tableComponentRef.value?.clearSelection(); selectedRows.value = [] }

const openDetail = (row: Device) => { currentDevice.value = row; drawerVisible.value = true }
const handleUnbind = (row: Device) => {
    ElMessageBox.confirm(`确认解绑 ${row.name}?`, '警告', { type: 'warning' })
        .then(() => { ElMessage.success('已解绑'); loadData() })
}
const handleExport = () => ElMessage.info('正在导出...')

// Mock 批量操作
const handleBatchDelete = () => { ElMessage.success('批量删除成功'); clearSelection(); loadData() }
const handleBatchRestart = () => { ElMessage.success('批量重启指令已发送'); clearSelection() }
const handleBatchEnable = () => { ElMessage.success('批量启用成功'); clearSelection() }
</script>

<style scoped>
/* 🔥 适配 AppLayout 滚动 🔥 */
.firmware-layout-wrapper {
    /* 高度自动，内容越多越高 */
    height: auto !important;
    min-height: 100%;
    width: 100%;

    /* 移除 overflow-y: visible，因为现在靠 AppLayout 滚动 */
    /* 但保留它也无害，主要是 height: auto 起作用 */

    padding: 20px;
    padding-bottom: 120px;
    /* 底部留白，给悬浮栏和分页器空间 */
    box-sizing: border-box;
}

.main-content-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    display: block;
}
</style>