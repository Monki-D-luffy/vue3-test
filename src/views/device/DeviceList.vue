<template>
    <div class="firmware-layout-wrapper">

        <div class="page-header mb-6">
            <div class="header-left">
                <h1 class="page-title">设备明细</h1>
                <span class="page-subtitle">实时监控设备运行状态与配置详情</span>
            </div>
            <div class="header-right">
                <el-select v-model="filters.dataCenter" placeholder="切换区域 / 数据中心" size="large" class="datacenter-select"
                    effect="light" @change="handleDataCenterChange">
                    <template #prefix>
                        <el-icon>
                            <Location />
                        </el-icon>
                    </template>
                    <el-option label="全部区域" value="" key="ALL_REGIONS" />
                    <el-option v-for="(label, value) in dataCenterMap" :key="value" :label="label" :value="value" />
                </el-select>
            </div>
        </div>

        <DeviceStatsOverview :summary="summary" />

        <DeviceFilterBar :filters="filters" @update:filters="handleFilterUpdate" :products="products"
            :loading="loading || isExporting" @search="handleSearch" @reset="handleReset" @refresh="handleRefresh"
            @export="handleExport" />

        <div class="card-base main-content-card">
            <DeviceListTable ref="tableComponentRef" :device-list="deviceList" :loading="loading"
                :pagination="pagination" @selection-change="handleSelectionChange" @page-change="handlePageChange"
                @size-change="handleSizeChange" @open-detail="openDetail" @unbind="handleTriggerUnbind"
                @view-logs="handleViewLogs" />
        </div>

        <DeviceBatchActionBar :selected-count="selectedRows.length" @batch-delete="handleBatchDelete"
            @batch-restart="handleBatchRestart" @batch-enable="handleBatchEnable" @clear-selection="clearSelection" />

        <DeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" @refresh="loadData" />

        <DeviceUnbindDialog v-model="unbindDialogVisible" :device="deviceToUnbind" @success="handleUnbindSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

// 组件引入
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
// 🔥 引入全局解绑组件
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'

// Composables & API
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { fetchProducts } from '@/api'
import type { Device, Product } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import { DATA_CENTER_MAP } from '@/constants/dictionaries'

const router = useRouter()
const dataCenterMap = DATA_CENTER_MAP

const {
    loading,
    deviceList,
    pagination,
    fetchDevices,
    handleSizeChange: _handleSizeChange,
    handleCurrentChange: _handleCurrentChange,
} = useDeviceList()

const { summary, fetchSummary } = useDeviceSummary()
const { isExporting, exportData } = useDataExport()

// 状态管理
const filters = reactive({
    keyword: '',
    productId: '',
    isBound: '',
    dateRange: null as null | [string, string],
    dataCenter: ''
})

const products = ref<Product[]>([])
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable>>()

// 🔥 解绑弹窗状态
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)

// 初始化
onMounted(async () => {
    pagination.currentPage = 1
    loadData()
    fetchSummary('')
    products.value = await fetchProducts()
})

// --- 核心业务逻辑 ---

// 1. 监听数据中心变化
const handleDataCenterChange = (val: string) => {
    fetchSummary(val)
    handleSearch()
    const centerName = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

// 2. 解绑流程
const handleTriggerUnbind = (row: Device) => {
    deviceToUnbind.value = row
    unbindDialogVisible.value = true
}

const handleUnbindSuccess = () => {
    // 解绑成功后：刷新列表 + 刷新统计
    loadData()
    fetchSummary(filters.dataCenter)
    // 弹窗的关闭由组件内部的 update:modelValue 自动处理
}

// 3. 查看日志跳转
const handleViewLogs = (row: Device) => {
    router.push({
        name: 'device-log',
        query: {
            id: row.id,
            name: row.name
        }
    })
}

// --- 常规处理函数 ---

const handleFilterUpdate = (newFilters: any) => {
    Object.assign(filters, newFilters)
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadData()
}

const handleReset = () => {
    filters.keyword = ''
    filters.productId = ''
    filters.isBound = ''
    filters.dateRange = null
    // 数据中心通常不重置，或者根据需求重置 filters.dataCenter = ''

    pagination.currentPage = 1
    loadData()
    ElMessage.success('筛选条件已重置')
}

const handleRefresh = () => {
    loadData()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

const loadData = () => {
    fetchDevices({ ...filters })
}

const handlePageChange = (val: number) => { _handleCurrentChange(val); loadData() }
const handleSizeChange = (val: number) => { _handleSizeChange(val); loadData() }
const handleSelectionChange = (rows: Device[]) => { selectedRows.value = rows }
const clearSelection = () => { tableComponentRef.value?.clearSelection(); selectedRows.value = [] }
const openDetail = (row: Device) => { currentDevice.value = row; drawerVisible.value = true }

const handleUnbind = (row: Device) => {
    // 这里保留旧的直接解绑方法作为备用，或者直接废弃，目前模板中已改用 handleTriggerUnbind
    ElMessageBox.confirm(`确认解绑 ${row.name}?`, '警告', { type: 'warning' })
        .then(() => { ElMessage.success('已解绑'); loadData() })
}

// --- 导出逻辑 ---
const exportColumns = [
    { label: '设备名称', key: 'name' },
    { label: '设备SN', key: 'sn' },
    { label: '产品名称', key: 'productName' },
    { label: '数据中心', key: 'dataCenter' },
    { label: '状态', key: 'status' },
    { label: '固件版本', key: 'firmwareVersion' },
    { label: '激活时间', key: 'gmtActive' },
    { label: '最后在线', key: 'gmtLastOnline' }
]

const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        productName: device.productInfo || products.value.find(p => p.id === device.productId)?.name || '未知产品',
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}

const handleExport = () => {
    const params = buildDeviceListParams(filters)
    exportData('/devices', params, exportColumns, '设备列表', exportProcessor)
}

// --- 批量操作 ---
const handleBatchDelete = () => { ElMessage.success('批量删除成功'); clearSelection(); loadData() }
const handleBatchRestart = () => { ElMessage.success('批量重启指令已发送'); clearSelection() }
const handleBatchEnable = () => { ElMessage.success('批量启用成功'); clearSelection() }
</script>

<style scoped>
.firmware-layout-wrapper {
    height: auto !important;
    min-height: 100%;
    width: 100%;
    padding: 24px 32px;
    padding-bottom: 120px;
    box-sizing: border-box;
}

/* 头部样式 */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
}

.page-subtitle {
    font-size: 14px;
    color: #64748b;
}

.datacenter-select {
    width: 200px;
}

.mb-6 {
    margin-bottom: 24px;
}

.main-content-card {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    display: block;
}
</style>