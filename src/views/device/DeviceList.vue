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
import { ElMessage, ElMessageBox } from 'element-plus'
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

// API
import { fetchDeviceList, fetchDeviceStats, deleteDevice, type DeviceRealStats } from '@/api/modules/device'
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

const stats = reactive<DeviceRealStats>({
    total: 0,
    online: 0,
    boundCount: 0,
    activated: 0
})

const filters = reactive<DeviceListFilters>({
    keyword: '',
    dataCenter: 'CN',
    productId: '',
    dateRange: null,
})

// --- 加载数据 ---
const loadData = async () => {
    loading.value = true
    try {
        const { items, total } = await fetchDeviceList(
            pagination.currentPage,
            pagination.pageSize,
            filters
        )
        deviceList.value = items
        pagination.total = total
    } catch (error) {
        console.error('Failed to load list', error)
        ElMessage.error('数据加载失败')
    } finally {
        loading.value = false
    }
}

const loadStats = async () => {
    // 允许传空值给 fetchDeviceStats 以获取全部区域统计
    const res = await fetchDeviceStats(filters.dataCenter || undefined)
    console.log('Stats Loaded:', res)
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
    loadStats()
    const name = val ? dataCenterMap[val] : '全部区域'
    ElMessage.success(`已切换至 ${name}`)
}

const handleRefresh = () => {
    loadData()
    loadStats()
    ElMessage.success('数据已刷新')
}

const handleReset = () => {
    // 1. 清空关键词
    filters.keyword = ''

    // 2. 清空产品选择
    filters.productId = ''

    // 3. ✨ Fix: 必须显式清空绑定状态 (设为 undefined 让 API 不传此字段)
    filters.isBound = undefined

    // 4. 清空日期
    filters.dateRange = null

    // 5. 注意：dataCenter (区域) 建议保留当前选择，防止用户迷失
    // 如果你希望重置连区域也清空，可以加上：filters.dataCenter = ''

    // 6. 触发搜索 (会自动重置到第 1 页)
    handleSearch()

    ElMessage.success('筛选条件已重置')
}

const handleFilterUpdate = (newFilters: any) => Object.assign(filters, newFilters)

// --- Composable / Hooks ---
const { products, fetchProducts, getProductName } = useProducts()
const { isExporting, exportData } = useDataExport()
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)
const unbindDialogVisible = ref(false)
const deviceToUnbind = ref<Device | null>(null)
const tableComponentRef = ref<InstanceType<typeof DeviceListTable> | null>(null)

useDeviceListAi({ filters, pagination, summary: stats as any, dataCenterMap })

// --- Lifecycle ---
onMounted(async () => {
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

// ✨ Fix: 真实的批量删除逻辑
const handleBatchDelete = async () => {
    if (selectedRows.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定要永久删除选中的 ${selectedRows.value.length} 台设备吗？此操作不可逆。`,
            '高危操作警告',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        loading.value = true
        // 并行执行删除请求
        const deletePromises = selectedRows.value.map(row => deleteDevice(row.id || row.puuid || ''))
        await Promise.all(deletePromises)

        ElMessage.success('批量删除成功')
        clearSelection()
        // 删除后重置到第一页防止空页
        pagination.currentPage = 1
        await loadData()
        await loadStats()

    } catch (error) {
        if (error !== 'cancel') {
            console.error('Batch delete failed:', error)
            ElMessage.error('部分设备删除失败，请刷新后重试')
        }
    } finally {
        loading.value = false
    }
}

// TODO: 等待后端提供真实的批量控制 API
const handleBatchRestart = () => { ElMessage.info('该功能后端暂未接入'); clearSelection() }
const handleBatchEnable = () => { ElMessage.info('该功能后端暂未接入'); clearSelection() }

// ✨ Fix: 增加导出限制
const handleExport = () => {
    if (pagination.total > 5000) {
        ElMessageBox.alert('导出数据量超过 5000 条，建议缩小筛选范围后分批导出，以免浏览器卡顿。', '导出限制', {
            confirmButtonText: '我知道了'
        });
        return;
    }

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

.dashboard-card {
    background: var(--bg-card);
    padding: 24px;
    border-radius: 16px;
    margin-top: 16px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color-light);
}
</style>