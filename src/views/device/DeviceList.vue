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

        <DeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" @refresh="loadData" />
        <DeviceUnbindDialog v-model="unbindDialogVisible" :device="deviceToUnbind" @success="handleUnbindSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue' // ✨ 引入 reactive
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

// 组合式函数 (保留辅助性的 Composable)
// 🔄 [移除] import { useDeviceList } from '@/composables/useDeviceList' 
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDataExport } from '@/composables/useDataExport'
import { useProducts } from '@/composables/useProducts'

// AI 上下文
import { useDeviceListAi } from '@/ai'
import type { Device, DeviceListFilters } from '@/types'

// ✨ [新增] 引入 Business 层智能接口和类型
import { getDeviceTableData } from '@/api/business/device'
import type { DeviceModel } from '@/api/types/device' // 假设你有这个类型定义，如果没有就用 Device

const router = useRouter()
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

// ==========================================
// 🔄 [重构] 核心数据逻辑 (替代 useDeviceList)
// ==========================================

// 1. 本地状态定义
const loading = ref(false)
const deviceList = ref<Device[]>([]) // 或 DeviceModel[]
const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0 // ✨ 必须包含 total，供分页组件使用
})

// 2. 筛选条件状态
const filters = reactive<DeviceListFilters>({
    keyword: '',
    dataCenter: '',
    productId: '',
    dateRange: null,
    // ...其他筛选字段初始化
})

// 3. ✨ [核心] 加载数据方法 (调用 Business 层)
const loadData = async () => {
    loading.value = true
    try {
        // 🚀 调用智能接口
        // 这里不需要手动处理 "pageIndex - 1" 或 "并发请求"，API 层已封装好
        const { items, total } = await getDeviceTableData(
            pagination.currentPage,
            pagination.pageSize,
            filters
        )

        // 赋值
        deviceList.value = items as any // 如果类型不完全匹配，临时断言，建议统一类型
        pagination.total = total
    } catch (error) {
        console.error('Failed to fetch devices:', error)
        // request.ts 会自动弹出错误提示，这里无需重复
    } finally {
        loading.value = false
    }
}

// 4. 事件处理重写
const handlePageChange = (newPage: number) => {
    pagination.currentPage = newPage
    loadData()
}

const handleSizeChange = (newSize: number) => {
    pagination.pageSize = newSize
    pagination.currentPage = 1 // 切换页大小时重置回第一页
    loadData()
}

const handleSearch = () => {
    pagination.currentPage = 1 // 搜索时重置回第一页
    loadData()
}

const handleReset = () => {
    // 重置筛选条件
    filters.keyword = ''
    filters.productId = ''
    filters.dateRange = null
    // filters.dataCenter = '' // 通常保留区域筛选，看业务需求
    handleSearch()
}

const handleRefresh = () => {
    loadData()
    fetchSummary(filters.dataCenter)
    ElMessage.success('数据已刷新')
}

const handleFilterUpdate = (newFilters: Partial<DeviceListFilters>) => {
    Object.assign(filters, newFilters)
}

const handleDataCenterChange = (val: string) => {
    fetchSummary(val)
    handleSearch()
    const centerName = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${centerName}`)
}

// ==========================================
// 辅助逻辑 (Summary, Products, Export)
// ==========================================

// 这些辅助逻辑保持不变，依然可以使用 Composables
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
// 🧠 AI 上下文挂载
// ==========================================
useDeviceListAi({
    filters,
    pagination, // 传入 reactive 对象，AI 可以读取其中的 total 和 currentPage
    summary,
    dataCenterMap
});

// ==========================================
// 生命周期
// ==========================================
onMounted(async () => {
    // 并行加载所有基础数据
    await Promise.all([
        loadData(), // ✨ 调用新的加载方法
        fetchProducts()
    ])
    fetchSummary(filters.dataCenter || '')
})

// ==========================================
// 详情与操作逻辑 (大部分复用)
// ==========================================

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
    loadData() // 🔄 使用 loadData 刷新
    fetchSummary(filters.dataCenter)
}

// 批量操作
const handleBatchDelete = () => {
    ElMessage.success(`已删除 ${selectedRows.value.length} 个设备`)
    clearSelection()
    loadData() // 🔄 刷新
}
const handleBatchRestart = () => {
    ElMessage.success(`已发送重启指令至 ${selectedRows.value.length} 个设备`)
    clearSelection()
}
const handleBatchEnable = () => {
    ElMessage.success(`已启用 ${selectedRows.value.length} 个设备`)
    clearSelection()
}

// 导出 (逻辑微调，传入 API 路径)
const exportProcessor = (data: Device[]) => {
    return data.map(device => ({
        ...device,
        productName: device.productName || getProductName(device.productId),
        gmtActive: formatDateTime(device.gmtActive),
        gmtLastOnline: formatDateTime(device.gmtLastOnline)
    }))
}

const handleExport = () => {
    // 注意：useDeviceList 里原来可能包含 buildDeviceListParams
    // 如果该函数逻辑复杂，建议也迁移到 Business 层，或者在这里手动构建
    const params = {
        pageIndex: 0,
        pageSize: 10000, // 导出所有
        ...filters
    }
    // 假设 exportData 支持通用 URL
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