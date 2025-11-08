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
                <el-table-column prop="status" label="设备状态" width="120">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)" effect="light" round>
                            {{ scope.row.status }}
                        </el-tag>
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

// 引入组件
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import AppPagination from '@/components/AppPagination.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import StatCard from '@/components/StatCard.vue'

import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceActions } from '@/composables/useDeviceActions'
import { useDataExport } from '@/composables/useDataExport'

// --- 基础状态 ---
const router = useRouter()
const selectedCenter = ref('CN')
const selectedDeviceId = ref(null) // 控制抽屉
const dataCenterMap = {
    'CN': '中国数据中心', 'US-WEST': '美西数据中心', 'EU-CENTRAL': '中欧数据中心',
    'IN': '印度数据中心', 'US-EAST': '美东数据中心', 'EU-WEST': '西欧数据中心', 'SG': '新加坡数据中心',
}
// 筛选条件状态
const filters = reactive({ isBound: '', productId: '', dateRange: '', keyword: '' })

// --- 使用 Composables ---
const { summary, fetchSummary } = useDeviceSummary()
const {
    loading, deviceList, pagination,
    fetchDevices, handleSizeChange, handleCurrentChange, resetPagination
} = useDeviceList() // 注意：这里不需要 buildDeviceListParams，因为它已在顶层导入
const { handleDelete } = useDeviceActions()
const { isExporting, exportData } = useDataExport()

// 定义导出的列 (CSV表头 和 数据key)
const deviceTableColumns = [
    { label: '设备名称/ID', key: 'name' },
    { label: '设备状态', key: 'status' },
    { label: '生产PUUID', key: 'puuid' },
    { label: '所属产品/产品ID', key: 'productId' },
    { label: '设备SN码', key: 'sn' },
    { label: '激活时间', key: 'gmtActive' },
    { label: '最近上线时间', key: 'gmtLastOnline' }
]

// --- 整合逻辑函数 ---
/**
 * 格式化日期时间字符串
 * @param dateString 任何有效的日期输入
 * @returns 格式化的字符串 'YYYY-MM-DD HH:mm:ss' 或 ''
 */
const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '' // 处理无效日期

    const pad = (num) => num.toString().padStart(2, '0')

    const Y = date.getFullYear()
    const M = pad(date.getMonth() + 1)
    const D = pad(date.getDate())
    const h = pad(date.getHours())
    const m = pad(date.getMinutes())
    const s = pad(date.getSeconds())

    return `${Y}-${M}-${D} ${h}:${m}:${s}`
}

// 定义此页面的数据处理器
const deviceDataProcessor = (data) => {
    return data.map(row => ({
        ...row,
        // 格式化需要导出的日期字段
        gmtActive: formatDateTime(row.gmtActive),
        gmtLastOnline: formatDateTime(row.gmtLastOnline)
    }))
}
//  导出处理函数
const handleExport = () => {
    // 1. 组装视图层的
    const currentFilters = {
        ...filters,
        dataCenter: selectedCenter.value
    }

    // 2. 调用构建器 (不传分页参数，以获取所有数据)
    const exportParams = buildDeviceListParams(currentFilters)

    // 3. 调用导出
    exportData(
        '/devices',          // API 端点
        exportParams,        // 传递处理过的、API友好的参数
        deviceTableColumns,  // 列定义
        '设备明细',           // 文件名
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
    // fetchDevices 内部会调用 buildDeviceListParams 并传入分页
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

// 状态颜色辅助函数
const getStatusType = (status) => {
    const map = { '在线': 'success', '离线': 'info', '故障': 'danger', '未激活': 'warning' }
    return map[status] || ''
}

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

/* Card Header 样式 */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 确保表格卡片有正确的内边距 */
.table-card :deep(.el-card__header) {
    padding: 15px 20px;
}

/* Card Header 样式 */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 确保表格卡片有正确的内边距 */
.table-card :deep(.el-card__header) {
    padding: 15px 20px;
}
</style>