<template>
    <div class="page-container">
        <PageMainHeader title="设备资源池" subtitle="全网设备资产监控与生命周期管理">
            <template #actions>
                <el-select v-model="filters.dataCenter" placeholder="选择区域" size="default" class="datacenter-select"
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

        <DeviceStatsOverview :summary="stats" />

        <DeviceFilterBar :filters="filters" :products="products" :loading="loading || isExporting"
            @update:filters="handleFilterUpdate" @search="handleSearch" @reset="handleReset" @refresh="handleRefresh"
            @export="handleExport" />

        <div class="main-table-card dashboard-card">
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

// 组件
import PageMainHeader from '@/components/PageMainHeader.vue'
import DeviceStatsOverview from './components/DeviceStatsOverview.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import DeviceListTable from './components/DeviceListTable.vue'
import DeviceBatchActionBar from './components/DeviceBatchActionBar.vue'
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'

// 逻辑与常量
import { DEVICE_EXPORT_COLUMNS } from '@/constants/device'
import { DATA_CENTER_MAP } from '@/constants/dictionaries'
import { formatDateTime } from '@/utils/formatters'
import { useDataExport } from '@/composables/useDataExport'
import { useProducts } from '@/composables/useProducts'
import { useDeviceListAi } from '@/ai'

// 🚀 [Updated] 引用标准模块化 API
import { fetchDeviceList, fetchDeviceStats, type DeviceRealStats } from '@/api/modules/device'
import type { Device, DeviceListFilters } from '@/types'

const router = useRouter()
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

// --- State ---
const loading = ref(false)
const deviceList = ref<Device[]>([])
const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
})

// 统计数据 State
const stats = reactive<DeviceRealStats>({
    total: 0,
    online: 0,
    offline: 0,
    activated: 0
})

const filters = reactive<DeviceListFilters>({
    keyword: '',
    dataCenter: 'CN', // 默认选中 CN，符合业务逻辑
    productId: '',
    dateRange: null,
})

// --- 核心动作: 加载列表 ---
const loadData = async () => {
    loading.value = true
    try {
        // ✨ 使用新的标准 API 方法
        const { items, total } = await fetchDeviceList(
            pagination.currentPage,
            pagination.pageSize,
            filters
        )
        deviceList.value = items
        pagination.total = total
    } catch (error) {
        console.error('Failed to load list', error)
    } finally {
        loading.value = false
    }
}

// --- 核心动作: 加载统计 ---
const loadStats = async () => {
    // ✨ 使用新的标准 API 方法
    const res = await fetchDeviceStats(filters.dataCenter || 'CN')
    Object.assign(stats, res)
}

// --- 事件处理 ---
const handlePageChange = (p: number) => {
    pagination.currentPage = p
    loadData()
}

const handleSizeChange = (s: number) => {
    pagination.pageSize = s
    pagination.currentPage = 1
    loadData()
}

const handleSearch = () => {
    pagination.currentPage = 1
    loadData()
}

const handleDataCenterChange = (val: string) => {
    handleSearch()
    loadStats() // 区域变化时，刷新统计
    const name = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${name}`)
}

const handleRefresh = () => {
    loadData()
    loadStats()
    ElMessage.success('数据已刷新')
}

const handleReset = () => {
    filters.keyword = ''
    filters.productId = ''
    filters.dateRange = null
    // filters.dataCenter 保持不变，避免用户迷失
    handleSearch()
}

const handleFilterUpdate = (newFilters: any) => Object.assign(filters, newFilters)

// --- 其他逻辑 (保持原样) ---
const { products, fetchProducts, getProductName } = useProducts()
const { isExporting, exportData } = useDataExport()
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)

// AI Hook
useDeviceListAi({ filters, pagination, summary: stats as any, dataCenterMap })

// --- Lifecycle ---
onMounted(async () => {
    // 并行加载所有数据
    await Promise.all([
        loadData(),
        loadStats(),
        fetchProducts()
    ])
})

// --- 交互操作 ---
const handleSelectionChange = (rows: Device[]) => selectedRows.value = rows
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
    loadStats()
}
const handleBatchDelete = () => {
    ElMessage.success('批量删除演示成功')
    clearSelection()
    loadData()
}
const handleBatchRestart = () => { ElMessage.success('指令已发送'); clearSelection() }
const handleBatchEnable = () => { ElMessage.success('设备已启用'); clearSelection() }

// 导出
const handleExport = () => {
    const params = { pageIndex: 0, pageSize: 10000, ...filters }
    exportData('/devices', params, DEVICE_EXPORT_COLUMNS, '设备列表', (data) => {
        return data.map(d => ({
            ...d,
            productName: d.productName || getProductName(d.productId),
            gmtActive: formatDateTime(d.gmtActive),
            gmtLastOnline: formatDateTime(d.gmtLastOnline)
        }))
    })
}
</script>

<style scoped>
.page-container {
    width: 100%;
    padding-bottom: 40px;
}

.datacenter-select {
    width: 180px;
}

/* 现代化卡片容器 */
.dashboard-card {
    background: var(--bg-card);
    padding: 24px;
    border-radius: 16px;
    margin-top: 16px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color-light);
}
</style>