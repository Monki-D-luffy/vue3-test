<template>
    <div class="dashboard-container">
        <DeviceDetailDrawer v-if="selectedDeviceId" :device-id="selectedDeviceId" @close="closeDrawer"
            @trigger-upgrade="handleUpgradeClick" />

        <FirmwareUpgradeModal v-model="upgradeModalVisible" :device="selectedDeviceForUpgrade"
            @upgrade-done="onUpgradeDone" />

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

                <el-table-column prop="firmwareVersion" label="固件版本" min-width="110" />

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
// ✨ 修改：移除 Top/Upgrade 图标导入
import { Monitor, CircleCheck, Connection } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 导入我们抽离的工具函数
import { formatDateTime, getDeviceStatusType } from '@/utils/formatters'

// 引入组件
import DeviceDetailDrawer from '@/components/DeviceDetailDrawer.vue'
import AppPagination from '@/components/AppPagination.vue'
import DeviceFilterBar from '@/components/DeviceFilterBar.vue'
import StatCard from '@/components/StatCard.vue'
import FirmwareUpgradeModal from '@/components/FirmwareUpgradeModal.vue'

// 引入 Composables
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { useDeviceList, buildDeviceListParams } from '@/composables/useDeviceList'
import { useDeviceActions } from '@/composables/useDeviceActions'
import { useDataExport } from '@/composables/useDataExport'

// --- 1. 基础状态 (沿用) ---
const router = useRouter()
const selectedCenter = ref('CN')
const selectedDeviceId = ref(null) // 用于详情抽屉
const dataCenterMap = {
    'CN': '中国数据中心', 'US-WEST': '美西数据中心', 'EU-CENTRAL': '中欧数据中心',
    'IN': '印度数据中心', 'US-EAST': '美东数据中心', 'EU-WEST': '西欧数据中心', 'SG': '新加坡数据中心',
}
const filters = reactive({ isBound: '', productId: '', dateRange: '', keyword: '' })

// --- 2. 使用 Composables (沿用) ---
const { summary, fetchSummary } = useDeviceSummary()
const {
    loading, deviceList, pagination,
    fetchDevices, handleSizeChange, handleCurrentChange, resetPagination
} = useDeviceList()
const { handleDelete } = useDeviceActions()
const { isExporting, exportData } = useDataExport()

// --- 固件升级状态 (沿用) ---
const upgradeModalVisible = ref(false)
const selectedDeviceForUpgrade = ref(null)

// (沿用)
const deviceTableColumns = [
    { label: '设备名称/ID', key: 'name' },
    { label: '设备状态', key: 'status' },
    { label: '固件版本', key: 'firmwareVersion' },
    { label: '生产PUUID', key: 'puuid' },
    { label: '所属产品/产品ID', key: 'productId' },
    { label: '设备SN码', key: 'sn' },
    { label: '激活时间', key: 'gmtActive' },
    { label: '最近上线时间', key: 'gmtLastOnline' }
]

// --- 3. 整合逻辑函数 ---

// (沿用)
const deviceDataProcessor = (data) => {
    return data.map(row => ({
        ...row,
        gmtActive: formatDateTime(row.gmtActive),
        gmtLastOnline: formatDateTime(row.gmtLastOnline),
        status: Array.isArray(row.status) ? row.status.join(', ') : row.status
    }))
}

// (沿用)
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
        deviceDataProcessor
    )
}

// (沿用)
const viewLogs = (row) => {
    router.push({
        name: 'device-log',
        query: {
            id: row.id,
            name: row.name
        }
    })
}

// (沿用)
const loadData = () => {
    fetchDevices({
        ...filters,
        dataCenter: selectedCenter.value
    })
}

// (沿用)
const handleCenterChange = (command) => {
    selectedCenter.value = command
    ElMessage.success(`已切换至 ${dataCenterMap[command]}`)
    resetPagination()
    loadData()
    fetchSummary(command)
}

// (沿用)
const handleSearch = () => {
    ElMessage.success('正在搜索...')
    pagination.currentPage = 1
    loadData()
}

// (沿用)
const handleReset = () => {
    filters.isBound = ''
    filters.productId = ''
    filters.dateRange = ''
    filters.keyword = ''
    ElMessage.info('已重置筛选条件')
    resetPagination()
    loadData()
}

// (沿用)
const onSizeChange = (newSize) => {
    handleSizeChange(newSize)
    loadData()
}
const onCurrentChange = (newPage) => {
    handleCurrentChange(newPage)
    loadData()
}

// (沿用)
const onDeleteClick = (row) => {
    handleDelete(row, () => {
        loadData()
        fetchSummary(selectedCenter.value)
    })
}

// (沿用) 详情抽屉控制
const openDetails = (id) => { selectedDeviceId.value = id }
const closeDrawer = () => { selectedDeviceId.value = null }


// --- ✨ 4. 升级逻辑 (修改) ✨ ---

/**
 * 点击"升级"按钮时触发
 * @param {object} device - 由抽屉组件 emit 传回的完整 device 对象
 */
const handleUpgradeClick = (device) => {
    selectedDeviceForUpgrade.value = device // 传递完整的 device 对象
    upgradeModalVisible.value = true
    closeDrawer() // (可选) 点升级时关闭详情抽屉
}

/**
 * 当升级弹窗通知升级完成时 (无论成功或失败)
 */
const onUpgradeDone = () => {
    // 刷新列表以更新固件版本和 hasNewFirmware 状态
    loadData()
    // 也刷新一下统计卡片
    fetchSummary(selectedCenter.value)
    // (可选) 如果抽屉还开着，也刷新一下抽屉
    if (selectedDeviceId.value) {
        // 重新打开（或刷新）抽屉的逻辑
        // 因为抽屉是watch deviceId的，我们需要一个方法来强制它刷新
        // 目前最简单的方法是关闭再打开，但体验不好
        // 更好的方法是让 useDeviceDetail 暴露一个 refresh 方法
        // ...
        // [当前实现]: 升级时已关闭抽屉，此步暂不需要
    }
}


// --- 5. 生命周期 (沿用) ---
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

.status-tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.status-tags-container .el-tag {
    margin-bottom: 0;
}
</style>