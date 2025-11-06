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
                        <el-button link type="primary">查看</el-button>
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

// 引入组件-components
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import AppPagination from '@/components/AppPagination.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import StatCard from '@/components/StatCard.vue'

// 引入方法-Composables
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDeviceList } from '@/composables/useDeviceList'
import { useDeviceActions } from '@/composables/useDeviceActions'

// --- 1. 基础状态 ---
const selectedCenter = ref('CN')
const selectedDeviceId = ref(null) // 控制抽屉
const dataCenterMap = {
    'CN': '中国数据中心', 'US-WEST': '美西数据中心', 'EU-CENTRAL': '中欧数据中心',
    'IN': '印度数据中心', 'US-EAST': '美东数据中心', 'EU-WEST': '西欧数据中心', 'SG': '新加坡数据中心',
}
// 筛选条件状态
const filters = reactive({ isBound: '', productId: '', dateRange: '', keyword: '' })

// --- 2. 使用 Composables ---
const { summary, fetchSummary } = useDeviceSummary()
const {
    loading, deviceList, pagination,
    fetchDevices, handleSizeChange, handleCurrentChange, resetPagination
} = useDeviceList()
const { handleDelete } = useDeviceActions()

// --- 3. 整合逻辑函数 ---

// 统一的加载数据函数：将当前所有的状态（数据中心、过滤器）组合起来传给 fetchDevices
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
    resetPagination() // 切换中心时重置分页
    loadData()        // 重新加载列表
    fetchSummary(command) // 重新加载统计
}

// 搜索
const handleSearch = () => {
    ElMessage.success('正在搜索...')
    pagination.currentPage = 1 // 搜索时重置到第一页
    loadData()
}

// 重置
const handleReset = () => {
    // 清空筛选状态
    filters.isBound = ''
    filters.productId = ''
    filters.dateRange = ''
    filters.keyword = ''
    ElMessage.info('已重置筛选条件')
    resetPagination() // 重置分页
    loadData()
}

// 分页事件适配
const onSizeChange = (newSize) => {
    handleSizeChange(newSize)
    loadData() // pageSize 变化后重新加载
}
const onCurrentChange = (newPage) => {
    handleCurrentChange(newPage)
    loadData() // currentPage 变化后重新加载
}

// 删除点击事件
const onDeleteClick = (row) => {
    // 调用 composable 的删除方法，并传入成功后的回调（重新加载数据）
    handleDelete(row, () => {
        loadData()
        // 可选：删除后也刷新下统计数据
        fetchSummary(selectedCenter.value)
    })
}

// 详情抽屉控制
const openDetails = (id) => { selectedDeviceId.value = id }
const closeDrawer = () => { selectedDeviceId.value = null }

// 状态颜色辅助函数 (建议后续也提取到公共文件)
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
</style>