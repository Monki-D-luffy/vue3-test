<template>
    <div class="firmware-layout-wrapper">

        <DeviceStatsOverview :summary="summary" />

        <DeviceFilterBar :filters="filters" @update:filters="handleFilterUpdate" :products="products"
            :loading="loading || isExporting" @search="handleSearch" @reset="handleReset" @refresh="handleRefresh"
            @export="handleExport" />

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
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'

// --- Composables ---
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { fetchProducts } from '@/api'
import type { Device, Product } from '@/types'
import { useDataExport } from '@/composables/useDataExport'
import { formatDateTime } from '@/utils/formatters'

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
const { isExporting, exportData } = useDataExport()

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
// 🔥 定义导出列 (Excel 表头)
const exportColumns = [
    { label: '设备名称', key: 'name' },
    { label: '设备SN', key: 'sn' },
    { label: '产品名称', key: 'productName' },
    { label: '当前状态', key: 'status' },
    { label: '固件版本', key: 'firmwareVersion' },
    { label: '激活时间', key: 'gmtActive' },
    { label: '最后在线', key: 'gmtLastOnline' }
]

// 🔥 定义数据处理器 (清洗数据)
const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        // 确保导出时产品名称正确显示 (假设后端返回了 productInfo 或 productId)
        productName: device.productInfo || products.value.find(p => p.id === device.productId)?.name || '未知产品',
        // 格式化时间
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}
const handleExport = () => {
    // 1. 构建查询参数 (复用列表的筛选条件)
    const params = buildDeviceListParams(filters)

    // 2. 调用通用导出方法
    // exportData(API路径, 参数, 列定义, 文件名前缀, 数据处理器)
    exportData(
        '/devices',
        params,
        exportColumns,
        '设备列表',
        exportProcessor
    )
}
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