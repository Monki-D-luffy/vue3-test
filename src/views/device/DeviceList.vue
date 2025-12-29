<template>
    <div class="page-container">
        <PageMainHeader title="设备资源池" subtitle="全网设备资产监控与生命周期管理">
            <template #actions>
                <el-select v-model="filters.dataCenter" placeholder="所有区域" size="default" class="datacenter-select"
                    effect="light" clearable @change="handleDataCenterChange">
                    <template #prefix>
                        <el-icon>
                            <Location />
                        </el-icon>
                    </template>
                    <el-option label="全部区域" value="" />
                    <el-option v-for="(label, value) in dataCenterMap" :key="value" :label="label" :value="value" />
                </el-select>
            </template>
        </PageMainHeader>

        <DeviceStatsOverview :summary="summary" />

        <DeviceFilterBar :filters="filters" :products="products" :loading="loading || isExporting"
            @update:filters="handleFilterUpdate" @search="handleSearch" @reset="handleReset" @refresh="handleRefresh"
            @export="handleExport" />

        <div class="main-table-card">
            <DeviceListTable ref="tableComponentRef" :device-list="deviceList" :loading="loading"
                :pagination="pagination" @selection-change="handleSelectionChange" @page-change="handlePageChange"
                @size-change="handleSizeChange" @open-detail="openDetail" @unbind="handleTriggerUnbind"
                @view-logs="handleViewLogs" />
        </div>

        <DeviceBatchActionBar :selected-count="selectedRows.length" @batch-delete="handleBatchDelete"
            @batch-restart="handleBatchRestart" @batch-enable="handleBatchEnable" @clear-selection="clearSelection" />

        <DeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" @refresh="fetchDevices" />
        <DeviceUnbindDialog v-model="unbindDialogVisible" :device="deviceToUnbind" @success="handleUnbindSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

// 组件引入
import PageMainHeader from '@/components/PageMainHeader.vue'
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'

// 工具与常量
import { DEVICE_EXPORT_COLUMNS } from '@/constants/device'
import { DATA_CENTER_MAP } from '@/constants/dictionaries'
import { formatDateTime } from '@/utils/formatters'

// 组合式函数
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { useProducts } from '@/composables/useProducts'

// ✅ 引入 AI 上下文与 API
import { useDeviceListAi } from '@/composables/context/useDeviceAi'

import type { Device, DeviceListFilters } from '@/types'

const router = useRouter()
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

// --- Core Logic ---
const {
    loading,
    deviceList,
    pagination,
    filters,
    fetchDevices,
    handleSearch,
    handleReset,
    handlePageChange,
    handleSizeChange
} = useDeviceList()

const { summary, fetchSummary } = useDeviceSummary()
const { products, fetchProducts, getProductName } = useProducts()
const { isExporting, exportData } = useDataExport()

// --- Local State ---
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)

// ==========================================
// 🧠 AI 上下文挂载 (一行代码搞定)
// ==========================================
// 只要把页面上的状态扔进去，剩下的交给 Composable 处理
useDeviceListAi({
    filters,
    pagination,
    summary,
    dataCenterMap
});

onMounted(async () => {
    await Promise.all([fetchDevices(), fetchProducts()])
    fetchSummary(filters.dataCenter || '')

})

// ==========================================
// 业务逻辑
// ==========================================

const handleFilterUpdate = (newFilters: Partial<DeviceListFilters>) => {
    Object.assign(filters, newFilters)
}

const handleDataCenterChange = (val: string) => {
    fetchSummary(val)
    handleSearch()
    const centerName = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

const handleRefresh = () => {
    fetchDevices()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

const handleSelectionChange = (rows: Device[]) => {
    selectedRows.value = rows
}

const clearSelection = () => {
    tableComponentRef.value?.clearSelection()
    selectedRows.value = []
}

const openDetail = (row: Device) => {
    currentDevice.value = row
    drawerVisible.value = true
}

const handleViewLogs = (row: Device) => {
    router.push({
        name: 'DeviceLog',
        query: { id: row.id, name: row.name }
    })
}

const handleTriggerUnbind = (row: Device) => {
    deviceToUnbind.value = row
    unbindDialogVisible.value = true
}

const handleUnbindSuccess = () => {
    fetchDevices()
    fetchSummary(filters.dataCenter)
}

// 批量操作
const handleBatchDelete = () => {
    ElMessage.success(`已删除 ${selectedRows.value.length} 个设备`)
    clearSelection()
    fetchDevices()
}
const handleBatchRestart = () => {
    ElMessage.success(`已发送重启指令至 ${selectedRows.value.length} 个设备`)
    clearSelection()
}
const handleBatchEnable = () => {
    ElMessage.success(`已启用 ${selectedRows.value.length} 个设备`)
    clearSelection()
}

// 导出
const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        productName: device.productName || getProductName(device.productId),
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}

const handleExport = () => {
    const params = buildDeviceListParams(filters)
    exportData('/devices', params, DEVICE_EXPORT_COLUMNS, '设备列表', exportProcessor)
}
</script>

<style scoped>
.page-container {
    width: 100%;
    padding-bottom: 40px;
}

.datacenter-select {
    width: 200px;
}

.main-table-card {
    background: var(--app-bg-card);
    padding: 24px;
    border-radius: 12px;
    margin-top: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(226, 232, 240, 0.6);
}
</style>