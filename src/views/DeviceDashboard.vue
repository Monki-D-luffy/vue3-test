<template>
    <div class="dashboard-container">
        <DeviceDetailDrawer v-if="selectedDeviceId" :device-id="selectedDeviceId" @close="closeDrawer" />

        <div class="page-header">
            <h1 class="title">设备明细</h1>
            <el-dropdown type="primary" split-button @command="handleCenterChange">
                {{ dataCenterMap[selectedCenter] }}
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item v-for="(label, key) in dataCenterMap" :key="key" :command="key">
                            {{ label }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <el-row :gutter="20" class="summary-cards">
            <StatCard label="设备总数" :value="summary.total" :iconComponent="Monitor" colorTheme="blue-bg" />
            <StatCard label="已激活设备" :value="summary.activated" :iconComponent="CircleCheck" colorTheme="green-bg" />
            <StatCard label="当前在线设备" :value="summary.online" :iconComponent="Connection" colorTheme="purple-bg" />
        </el-row>

        <DeviceFilterBar v-model:filters="filters" @search="handleSearch" @reset="handleReset" />

        <el-card class="table-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <span>设备列表</span>
                    <el-button type="primary" :loading="isExporting" @click="handleExport" plain>
                        导出数据
                    </el-button>
                </div>
            </template>

            <el-table :data="deviceList" v-loading="loading">
                <el-table-column prop="name" label="设备名称/ID" width="180" />

                <el-table-column prop="status" label="设备状态" min-width="120">
                    <template #default="scope">
                        <div class="status-tags-container">
                            <el-tag
                                v-for="status in (Array.isArray(scope.row.status) ? scope.row.status : [scope.row.status])"
                                :key="status" :type="getDeviceStatusType(status)" effect="light" round>
                                {{ status }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="puuid" label="生产PUUID" width="200" />
                <el-table-column prop="productId" label="所属产品/产品ID" width="180" />
                <el-table-column prop="sn" label="设备SN码" width="180" />
                <el-table-column prop="gmtActive" label="激活时间" width="180" />
                <el-table-column prop="gmtLastOnline" label="最近上线时间" width="180" />
                <el-table-column label="操作" fixed="right" min-width="150">
                    <template #default="scope">
                        <el-button link type="primary" @click="viewLogs(scope.row)">查看</el-button>
                        <el-button link type="primary" @click="openDetails(scope.row.id)">详情</el-button>
                        <el-button link type="danger" @click="onDeleteClick(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty description="暂无激活设备" />
                </template>
            </el-table>

            <AppPagination v-if="pagination.total > 0" :total="pagination.total"
                v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                @size-change="onSizeChange" @current-change="onCurrentChange" />
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, CircleCheck, Connection } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// ✨ 2. (关键重构) 导入我们抽离的工具函数
import { formatDateTime, getDeviceStatusType } from '@/utils/formatters'
// (假设你也抽离了 DATA_CENTER_MAP)
// import { DATA_CENTER_MAP } from '@/constants'

// 引入组件
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import AppPagination from '@/components/AppPagination.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import StatCard from '@/components/StatCard.vue'

// 引入 Composables
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceActions } from '@/composables/useDeviceActions'
import { useDataExport } from '@/composables/useDataExport'

// --- 1. 基础状态 ---
const router = useRouter()
const selectedCenter = ref('CN')
const selectedDeviceId = ref(null)
const dataCenterMap = { // (如果你没有抽离到 constants，这个暂时保留)
    'CN': '中国数据中心', 'US-WEST': '美西数据中心', 'EU-CENTRAL': '中欧数据中心',
    'IN': '印度数据中心', 'US-EAST': '美东数据中心', 'EU-WEST': '西欧数据中心', 'SG': '新加坡数据中心',
}
const filters = reactive({ isBound: '', productId: '', dateRange: '', keyword: '' })

// --- 2. 使用 Composables ---
const { summary, fetchSummary } = useDeviceSummary()
const {
    loading, deviceList, pagination,
    fetchDevices, handleSizeChange, handleCurrentChange, resetPagination
} = useDeviceList()
const { handleDelete } = useDeviceActions()
const { isExporting, exportData } = useDataExport()

// 列定义
const deviceTableColumns = [
    { label: '设备名称/ID', key: 'name' },
    { label: '设备状态', key: 'status' }, // (key 保持不变, processor 会处理)
    { label: '生产PUUID', key: 'puuid' },
    { label: '所属产品/产品ID', key: 'productId' },
    { label: '设备SN码', key: 'sn' },
    { label: '激活时间', key: 'gmtActive' },
    { label: '最近上线时间', key: 'gmtLastOnline' }
]

// --- 3. 整合逻辑函数 ---

// ✨ 3. (关键重构) 更新数据处理器
const deviceDataProcessor = (data) => {
    return data.map(row => ({
        ...row,
        // 格式化日期
        gmtActive: formatDateTime(row.gmtActive),
        gmtLastOnline: formatDateTime(row.gmtLastOnline),
        // (核心) 在导出时, 将 status 数组转换回 CSV 友好的字符串
        status: Array.isArray(row.status) ? row.status.join(', ') : row.status
    }))
}

// 导出处理函数
const handleExport = () => {
    const currentFilters = {
        ...filters,
        dataCenter: selectedCenter.value
    }
    const exportParams = buildDeviceListParams(currentFilters)

    exportData(
        '/devices',
        exportParams,
        deviceTableColumns,
        '设备明细',
        deviceDataProcessor // 注入处理器
    )
}

// 跳转到设备日志页面
const viewLogs = (row) => {
    router.push({
        name: 'device-log',
        query: {
            id: row.id,
            name: row.name
        }
    })
}

// 统一的加载数据函数
const loadData = () => {
    fetchDevices({
        ...filters,
        dataCenter: selectedCenter.value
    })
}

// 切换数据中心
const handleCenterChange = (command) => {
    selectedCenter.value = command
    ElMessage.success(`已切换至 ${dataCenterMap[command]}`)
    resetPagination()
    loadData()
    fetchSummary(command)
}

// 搜索
const handleSearch = () => {
    ElMessage.success('正在搜索...')
    pagination.currentPage = 1
    loadData()
}

// 重置
const handleReset = () => {
    filters.isBound = ''
    filters.productId = ''
    filters.dateRange = ''
    filters.keyword = ''
    ElMessage.info('已重置筛选条件')
    resetPagination()
    loadData()
}

// 分页事件适配
const onSizeChange = (newSize) => {
    handleSizeChange(newSize)
    loadData()
}
const onCurrentChange = (newPage) => {
    handleCurrentChange(newPage)
    loadData()
}

// 删除点击事件
const onDeleteClick = (row) => {
    handleDelete(row, () => {
        loadData()
        fetchSummary(selectedCenter.value)
    })
}

// 详情抽屉控制
const openDetails = (id) => { selectedDeviceId.value = id }
const closeDrawer = () => { selectedDeviceId.value = null }

// ✨ 4. (关键重构) 删除了本地的 getStatusType, 因为我们现在从 @/utils 导入

// --- 4. 生命周期 ---
onMounted(() => {
    fetchSummary(selectedCenter.value)
    loadData()
})
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
    background-color: #f5f7fa;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.title {
    font-size: 24px;
    margin: 0;
}

.summary-cards {
    margin-bottom: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-card :deep(.el-card__header) {
    padding: 15px 20px;
}

/* ✨ 5. (关键重构) 添加新样式 */
.status-tags-container {
    display: flex;
    flex-wrap: wrap;
    /* 允许标签换行 */
    gap: 6px;
    /* 标签之间的间距 */
}

/* (可选) 确保标签本身不会太挤 */
.status-tags-container .el-tag {
    margin-bottom: 0;
}
</style>