<template>
    <div class="page-container">

        <PageMainHeader title="设备明细" subtitle="实时监控设备运行状态与配置详情">
            <template #actions>
                <el-select v-model="filters.dataCenter" placeholder="切换区域 / 数据中心" size="default"
                    class="datacenter-select" effect="light" @change="handleDataCenterChange">
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

        <DeviceFilterBar v-model:filters="filters" :products="products" :loading="loading || isExporting"
            @search="handleSearch" @reset="handleReset" @refresh="handleRefresh" @export="handleExport" />

        <div class="card-base main-table-card">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

// ✅ 引入新组件
import PageMainHeader from '@/components/PageMainHeader.vue'

// 其他引入保持不变...
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'
import { DEVICE_EXPORT_COLUMNS } from '@/constants/device'
import { DATA_CENTER_MAP } from '@/constants/dictionaries'

import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { fetchProducts } from '@/api'
import { formatDateTime } from '@/utils/formatters'
import type { Device, Product } from '@/types'

// ... 逻辑部分保持完全一致，不需要改动 ...
const router = useRouter()
const dataCenterMap = DATA_CENTER_MAP

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
const loadData = fetchDevices

const { summary, fetchSummary } = useDeviceSummary()
const { isExporting, exportData } = useDataExport()

const products = ref<Product[]>([])
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)

onMounted(async () => {
    loadData()
    fetchSummary('')
    products.value = await fetchProducts()
})

const handleDataCenterChange = (val: string) => {
    fetchSummary(val)
    handleSearch()
    const centerName = val ? (dataCenterMap as any)[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

const handleRefresh = () => {
    loadData()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

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
    exportData('/devices', params, DEVICE_EXPORT_COLUMNS, '设备列表', exportProcessor)
}

const handleSelectionChange = (rows: Device[]) => { selectedRows.value = rows }
const clearSelection = () => { tableComponentRef.value?.clearSelection(); selectedRows.value = [] }
const openDetail = (row: Device) => { currentDevice.value = row; drawerVisible.value = true }

const handleViewLogs = (row: Device) => {
    router.push({ name: 'DeviceLog', query: { id: row.id, name: row.name } })
}

const handleTriggerUnbind = (row: Device) => {
    deviceToUnbind.value = row
    unbindDialogVisible.value = true
}

const handleUnbindSuccess = () => {
    loadData()
    fetchSummary(filters.dataCenter)
}

const handleBatchDelete = () => { ElMessage.success('批量删除成功'); clearSelection(); loadData() }
const handleBatchRestart = () => { ElMessage.success('批量重启指令已发送'); clearSelection() }
const handleBatchEnable = () => { ElMessage.success('批量启用成功'); clearSelection() }
</script>

<style scoped>
/* 样式大幅精简，因为 .page-header 及其子元素的样式都移入组件了 */
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
}
</style>