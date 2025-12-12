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

// 组合式函数 (Composables)
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { useProducts } from '@/composables/useProducts'

// 类型定义
import type { Device, DeviceListFilters } from '@/types'

// 路由
const router = useRouter()

// 1. 字典数据强类型化
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

// 2. 核心业务逻辑 Hooks
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

// 3. 本地 UI 状态
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)

// 4. 组件引用 (明确类型)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)

// ==========================================
// 初始化逻辑
// ==========================================
onMounted(async () => {
    // 并行加载基础数据
    await Promise.all([
        fetchDevices(),
        fetchProducts()
    ])
    // 统计数据单独加载，不阻塞列表
    fetchSummary(filters.dataCenter || '')
})

// ==========================================
// 事件处理
// ==========================================

// 筛选更新
const handleFilterUpdate = (newFilters: Partial<DeviceListFilters>) => {
    // 这里依然可以使用 Object.assign，因为 filters 是 reactive 对象
    Object.assign(filters, newFilters)
}

// 区域切换
const handleDataCenterChange = (val: string) => {
    // 联动逻辑：更新统计 -> 刷新列表
    fetchSummary(val)
    handleSearch() // 触发列表刷新

    const centerName = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

// 刷新按钮
const handleRefresh = () => {
    fetchDevices()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

// 选中行变化
const handleSelectionChange = (rows: Device[]) => {
    selectedRows.value = rows
}

// 清空选择
const clearSelection = () => {
    tableComponentRef.value?.clearSelection()
    selectedRows.value = []
}

// ==========================================
// 业务操作
// ==========================================

const openDetail = (row: Device) => {
    currentDevice.value = row
    drawerVisible.value = true
}

const handleViewLogs = (row: Device) => {
    // 传递 ID 和 Name，类型安全
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

// ==========================================
// 批量操作 (Mock 逻辑，按需对接 API)
// ==========================================

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

// ==========================================
// 导出逻辑
// ==========================================

// 定义导出处理器，将 ID 转为可读文本
const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        // 使用 useProducts 提供的辅助函数，安全获取产品名
        productName: device.productName || getProductName(device.productId),
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}

const handleExport = () => {
    // 复用列表的筛选参数
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
    /* 增加上边距，与筛选栏隔开 */
    margin-top: 16px;
}
</style>