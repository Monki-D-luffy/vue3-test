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
                @size-change="handleSizeChange" @open-detail="openDetail" @unbind="handleUnbind"
                @view-logs="handleViewLogs" />
        </div>

        <DeviceBatchActionBar :selected-count="selectedRows.length" @batch-delete="handleBatchDelete"
            @batch-restart="handleBatchRestart" @batch-enable="handleBatchEnable" @clear-selection="clearSelection" />

        <DeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location } from '@element-plus/icons-vue' // 引入图标

import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'

import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { fetchProducts } from '@/api'
import type { Device, Product } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import { DATA_CENTER_MAP } from '@/constants/dictionaries' // 引入字典

const router = useRouter()
const dataCenterMap = DATA_CENTER_MAP

// ... Composables ...
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

// 状态
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

onMounted(async () => {
    pagination.currentPage = 1
    loadData()
    fetchSummary('')
    products.value = await fetchProducts()
})

// 🔥 核心逻辑：数据中心切换
const handleDataCenterChange = (val: string) => {
    // 1. 刷新统计卡片
    fetchSummary(val)
    // 2. 刷新表格数据
    handleSearch()
    ElMessage.success(`已切换至 ${dataCenterMap[val] || '全部区域'}`)
}

// 🔥 核心逻辑：查看日志跳转
const handleViewLogs = (row: Device) => {
    router.push({
        name: 'device-log',
        query: {
            id: row.id,
            name: row.name
        }
    })
}

// ... 其他原有逻辑保持不变 ...
const handleFilterUpdate = (newFilters: any) => Object.assign(filters, newFilters)
const handleSearch = () => { pagination.currentPage = 1; loadData() }
const handleReset = () => {
    filters.keyword = ''; filters.productId = ''; filters.isBound = ''; filters.dateRange = null;
    // 注意：通常 Reset 不重置顶部的数据中心，除非你有特定需求
    pagination.currentPage = 1; loadData()
    ElMessage.success('筛选条件已重置')
}
const handleRefresh = () => { loadData(); fetchSummary(filters.dataCenter); ElMessage.success('数据已刷新') }
const loadData = () => { fetchDevices({ ...filters }) }

const handlePageChange = (val: number) => { _handleCurrentChange(val); loadData() }
const handleSizeChange = (val: number) => { _handleSizeChange(val); loadData() }
const handleSelectionChange = (rows: Device[]) => { selectedRows.value = rows }
const clearSelection = () => { tableComponentRef.value?.clearSelection(); selectedRows.value = [] }
const openDetail = (row: Device) => { currentDevice.value = row; drawerVisible.value = true }
const handleUnbind = (row: Device) => { ElMessageBox.confirm(`确认解绑?`, '警告', { type: 'warning' }).then(() => { ElMessage.success('已解绑'); loadData() }) }

// 导出相关
const exportColumns = [
    { label: '设备名称', key: 'name' }, { label: '设备SN', key: 'sn' }, { label: '产品名称', key: 'productName' },
    { label: '数据中心', key: 'dataCenter' }, { label: '状态', key: 'status' },
    { label: '激活时间', key: 'gmtActive' }, { label: '最后在线', key: 'gmtLastOnline' }
]
const exportProcessor = (data: Device[]) => data.map(d => ({ ...d, gmtActive: formatDateTime(d.gmtActive), gmtLastOnline: formatDateTime(d.gmtLastOnline) }))
const handleExport = () => { exportData('/devices', buildDeviceListParams(filters), exportColumns, '设备列表', exportProcessor) }

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
    /* 增加页面边距 */
    padding-bottom: 120px;
    box-sizing: border-box;
}

/* 头部样式 */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    /* 底部对齐 */
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