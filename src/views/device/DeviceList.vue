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
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { fetchProducts } from '@/api/modules/product' // 假设 api 路径修正
import { formatDateTime } from '@/utils/formatters'

// 类型引入
import type { Device, Product, DeviceListFilters } from '@/types'

const router = useRouter()

// ✅ 1. 强类型字典映射，解决索引报错问题
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

// ✅ 2. 组合式函数调用
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

// ✅ 3. 状态定义
const products = ref<Product[]>([])
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)

// ✅ 4. 引用类型化：能够感知子组件的方法
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)

// ✅ 5. 强类型更新逻辑：不再是 any
const handleFilterUpdate = (newFilters: Partial<DeviceListFilters>) => {
    Object.assign(filters, newFilters)
}

onMounted(async () => {
    loadData()
    // 初始加载全部，传空字符串
    fetchSummary('')
    products.value = await fetchProducts()
})

const handleDataCenterChange = (val: string) => {
    fetchSummary(val)
    handleSearch()
    const centerName = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

const handleRefresh = () => {
    loadData()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

// 导出数据处理
const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        productName: device.productName || products.value.find(p => p.id === device.productId)?.name || '未知产品',
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}

const handleExport = () => {
    // 复用 useDeviceList 中的参数构建逻辑，确保导出筛选一致
    const params = buildDeviceListParams(filters)
    exportData('/devices', params, DEVICE_EXPORT_COLUMNS, '设备列表', exportProcessor)
}

// 表格操作
const handleSelectionChange = (rows: Device[]) => { selectedRows.value = rows }

const clearSelection = () => {
    tableComponentRef.value?.clearSelection()
    selectedRows.value = []
}

const openDetail = (row: Device) => {
    currentDevice.value = row
    drawerVisible.value = true
}

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

// 批量操作
const handleBatchDelete = () => {
    ElMessage.success('批量删除成功')
    clearSelection()
    loadData()
}
const handleBatchRestart = () => {
    ElMessage.success('批量重启指令已发送')
    clearSelection()
}
const handleBatchEnable = () => {
    ElMessage.success('批量启用成功')
    clearSelection()
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

/* 移除 .card-base 样式，通常这应该在全局 CSS 变量中定义 
   这里保留 main-table-card 用于微调 */
.main-table-card {
    background: var(--app-bg-card);
    /* 确保使用 CSS 变量 */
    padding: 24px;
    border-radius: 8px;
    /* 补充缺失的圆角 */
}
</style>