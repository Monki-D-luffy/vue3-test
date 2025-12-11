<template>
    <div class="page-container">
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
                    <el-option label="全部区域" value="" />
                    <el-option v-for="(label, value) in dataCenterMap" :key="value" :label="label" :value="value" />
                </el-select>
            </div>
        </div>

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

// 组件与常量
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'
import { DEVICE_EXPORT_COLUMNS } from '@/constants/device' // ✅ 引入常量
import { DATA_CENTER_MAP } from '@/constants/dictionaries'

// Logic
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { fetchProducts } from '@/api'
import { formatDateTime } from '@/utils/formatters'
import type { Device, Product } from '@/types'

const router = useRouter()
const dataCenterMap = DATA_CENTER_MAP

// ✅ 核心改变：从 hook 中获取 filters 和操作方法，组件内不再手写 handleReset 等
const {
    loading,
    deviceList,
    pagination,
    filters,        // ✨ 响应式状态
    fetchDevices,   // ✨ 别名 loadData
    handleSearch,   // ✨ 封装好的搜索
    handleReset,    // ✨ 封装好的重置
    handlePageChange,
    handleSizeChange
} = useDeviceList()

// 为了保持习惯，给 fetchDevices 起个别名 loadData (可选)
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

// 初始化
onMounted(async () => {
    // page 1 的设置已经在 hook 内部处理，这里直接调用
    loadData()
    fetchSummary('')
    products.value = await fetchProducts()
})

// --- 业务逻辑 ---

const handleDataCenterChange = (val: string) => {
    // filters.dataCenter 已经由 v-model 更新
    fetchSummary(val)
    handleSearch() // 调用 hook 里的搜索
    const centerName = val ? (dataCenterMap as any)[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

const handleRefresh = () => {
    loadData()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

// 导出逻辑：数据处理函数
const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        productName: products.value.find(p => p.id === device.productId)?.name || '未知产品',
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}

const handleExport = () => {
    // 依然使用 helper 构建参数，保持灵活性
    const params = buildDeviceListParams(filters)
    // ✅ 使用引入的常量
    exportData('/devices', params, DEVICE_EXPORT_COLUMNS, '设备列表', exportProcessor)
}

// --- 表格交互 ---
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

// 批量操作
const handleBatchDelete = () => { ElMessage.success('批量删除成功'); clearSelection(); loadData() }
const handleBatchRestart = () => { ElMessage.success('批量重启指令已发送'); clearSelection() }
const handleBatchEnable = () => { ElMessage.success('批量启用成功'); clearSelection() }
</script>

<style scoped>
.page-container {
    width: 100%;
    padding-bottom: 40px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--app-text-main);
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
}

.page-subtitle {
    font-size: 14px;
    color: var(--app-text-sub);
}

.datacenter-select {
    width: 200px;
}

.mb-6 {
    margin-bottom: 24px;
}

.main-table-card {
    background: var(--app-bg-card);
    padding: 24px;
}
</style>