<template>
    <div class="page-container">
        <PageMainHeader title="设备明细" subtitle="实时监控设备运行状态与配置详情">
            <template #actions>
                <el-select v-model="filters.dataCenter" placeholder="切换区域 / 数据中心" size="default"
                    class="datacenter-select" effect="light" clearable @change="handleDataCenterChange">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

// ... 原有的组件引入保持不变 ...
import PageMainHeader from '@/components/PageMainHeader.vue'
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'

import { DEVICE_EXPORT_COLUMNS } from '@/constants/device'
import { DATA_CENTER_MAP } from '@/constants/dictionaries'
import { formatDateTime } from '@/utils/formatters'

import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { useProducts } from '@/composables/useProducts'

// ✅ 1. 引入上下文 Hook
import { useAiContext } from '@/composables/useAiContext'

import type { Device, DeviceListFilters } from '@/types'

const router = useRouter()
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

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

const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)

// ✅ 2. 初始化 AI 上下文注册
const { setPageContext } = useAiContext()

onMounted(async () => {
    await Promise.all([
        fetchDevices(),
        fetchProducts()
    ])
    fetchSummary(filters.dataCenter || '')

    // ✅ 3. 注册当前页面的数据源给 AI
    // 当用户在这一页点击 AI 时，AI 就会读到这些数据
    setPageContext(async () => {
        // 为了节省 Token，只提取关键字段
        const visibleSnapshot = deviceList.value.map(d => ({
            id: d.id,
            name: d.name,
            status: d.status, // online/offline
            ver: d.firmwareVersion,
            product: d.productName || getProductName(d.productId)
        }));

        return {
            scene: 'DeviceListManagement',
            description: 'User is viewing the device list table.',
            // 告诉 AI 当前的宏观统计
            stats: {
                totalDevices: pagination.total,
                onlineCount: summary.value.online,
                offlineCount: summary.value.offline
            },
            // 告诉 AI 用户当前的筛选意图
            currentFilters: {
                ...filters,
                dataCenter: filters.dataCenter ? dataCenterMap[filters.dataCenter] : 'All'
            },
            // 告诉 AI 用户具体看到了哪些设备 (前 10-20 条)
            currentTableData: visibleSnapshot.slice(0, 15)
        }
    })
})

// ... 下面的业务逻辑保持不变 ...
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
    border-radius: 8px;
    margin-top: 16px;
}
</style>