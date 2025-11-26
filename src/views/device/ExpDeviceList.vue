<template>
    <div class="firmware-layout-wrapper">

        <DeviceStatsOverview :summary="summary" />

        <DeviceFilterBar :filters="filters" @update:filters="handleFilterUpdate" :products="products" :loading="loading"
            @search="handleSearch" @reset="handleReset" @refresh="handleRefresh" @export="handleExport" />

        <div class="card-base main-content-card">
            <DeviceListTable ref="tableComponentRef" :device-list="deviceList" :loading="loading"
                :pagination="pagination" @selection-change="handleSelectionChange" @page-change="handlePageChange"
                @size-change="handleSizeChange" @open-detail="openDetail" @unbind="handleUnbind" />
        </div>

        <DeviceBatchActionBar :selected-count="selectedRows.length" @batch-delete="handleBatchDelete"
            @batch-restart="handleBatchRestart" @batch-enable="handleBatchEnable" @clear-selection="clearSelection" />

        <DeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 组件引入 ---
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
// 🔥 引用路径更新：去掉 Exp 前缀
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'

// --- Composables ---
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
    handleCurrentChange: _handleCurrentChange,
} = useDeviceList()

const { summary, fetchSummary } = useDeviceSummary()

const filters = reactive({
    keyword: '',
    productId: '',
    isBound: '',
    dateRange: null as null | [string, string]
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

const handleFilterUpdate = (newFilters: any) => {
    Object.assign(filters, newFilters)
}

// --- 核心逻辑 ---
const handleSearch = () => {
    pagination.currentPage = 1
    loadData()
}

const handleReset = () => {
    filters.keyword = ''
    filters.productId = ''
    filters.isBound = ''
    filters.dateRange = null

    pagination.currentPage = 1
    loadData()
    ElMessage.success('筛选条件已重置')
}

const handleRefresh = () => {
    loadData()
    fetchSummary('')
    ElMessage.success('数据已刷新')
}

const loadData = () => {
    fetchDevices({ ...filters })
}

// --- 事件处理 ---
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
const handleBatchDelete = () => { ElMessage.success('批量删除成功'); clearSelection(); loadData() }
const handleBatchRestart = () => { ElMessage.success('批量重启指令已发送'); clearSelection() }
const handleBatchEnable = () => { ElMessage.success('批量启用成功'); clearSelection() }
</script>

<style scoped>
/* 页面容器样式 */
.firmware-layout-wrapper {
    height: auto !important;
    min-height: 100%;
    width: 100%;
    padding: 20px;
    padding-bottom: 120px;
    box-sizing: border-box;
}

/* 主内容卡片 */
.main-content-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    display: block;
}
</style>