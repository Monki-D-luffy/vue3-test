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
                    <template #default="{ row }">
                        <el-button link type="primary" @click="viewLogs(row)">查看</el-button>
                        <el-button link type="primary" @click="openDetails(row.id)">详情</el-button>
                        <el-button link type="danger" @click="onDeleteClick(row)">删除</el-button>
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

<script setup lang="ts">
// 启用 lang="ts"
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, CircleCheck, Connection } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

// 引入我们定义的统一类型 (来自 src/types/index.ts)
import type { Device, DeviceListFilters } from '@/types'

// 导入工具函数
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

// 导入常量
import { DATA_CENTER_MAP } from '@/constants/dictionaries'
// --- 基础状态 ---
const router = useRouter()
const selectedCenter = ref('CN')

// 显式声明 Ref 类型，防止 null 赋值报错
const selectedDeviceId = ref<string | null>(null)

//  给字典对象加上类型索引，解决 dataCenterMap[key] 报错
const dataCenterMap: Record<string, string> = DATA_CENTER_MAP

// 使用 reactive<Interface> 确保 filters 结构符合预期
const filters = reactive<DeviceListFilters>({
    isBound: '',
    productId: '',
    dateRange: null, // Element Plus date-picker 返回的是 null 或 Date数组
    keyword: ''
})

// --- 使用 Composables ---
const { summary, fetchSummary } = useDeviceSummary()
// 这里的 deviceList 已经在 useDeviceList 内部定义为 Ref<Device[]>
const {
    loading, deviceList, pagination,
    fetchDevices, handleSizeChange, handleCurrentChange, resetPagination
} = useDeviceList()

const { handleDelete } = useDeviceActions()
const { isExporting, exportData } = useDataExport()

// --- 固件升级状态 ---
const upgradeModalVisible = ref(false)
// 明确这可能是一个 Device 对象或者 null
const selectedDeviceForUpgrade = ref<Device | null>(null)

// 导出列定义
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

// ---  整合逻辑函数 ---

// 给参数 data 加上 any[] 或 Device[] 类型
const deviceDataProcessor = (data: Device[]) => {
    return data.map(row => ({
        ...row,
        // 确保 row 中的字段存在于 Device 类型中
        gmtActive: formatDateTime(row.gmtActive),
        gmtLastOnline: formatDateTime(row.gmtLastOnline),
        // 处理 status 可能是数组的情况 (防御性编程)
        status: Array.isArray(row.status) ? row.status.join(', ') : row.status
    }))
}

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

// 为 row 参数添加 Device 类型注解
const viewLogs = (row: Device) => {
    router.push({
        name: 'device-log',
        query: {
            id: row.id,
            name: row.name
        }
    })
}

const loadData = () => {
    fetchDevices({
        ...filters,
        dataCenter: selectedCenter.value
    })
}

// command 是 Element Plus dropdown 回调参数，通常是 string | number | object
const handleCenterChange = (command: string) => {
    selectedCenter.value = command
    // 安全访问 map
    const centerName = dataCenterMap[command] || command
    ElMessage.success(`已切换至 ${centerName}`)
    resetPagination()
    loadData()
    fetchSummary(command)
}

const handleSearch = () => {
    ElMessage.success('正在搜索...')
    pagination.currentPage = 1
    loadData()
}

const handleReset = () => {
    filters.isBound = ''
    filters.productId = ''
    filters.dateRange = null // 重置为 null
    filters.keyword = ''
    ElMessage.info('已重置筛选条件')
    resetPagination()
    loadData()
}

const onSizeChange = (newSize: number) => {
    handleSizeChange(newSize)
    loadData()
}
const onCurrentChange = (newPage: number) => {
    handleCurrentChange(newPage)
    loadData()
}

// row 为 Device 类型
const onDeleteClick = (row: Device) => {
    handleDelete(row, () => {
        loadData()
        fetchSummary(selectedCenter.value)
    })
}

// 详情抽屉控制
const openDetails = (id: string) => { selectedDeviceId.value = id }
const closeDrawer = () => { selectedDeviceId.value = null }


// ---  升级逻辑 ---

/**
 * 点击"升级"按钮时触发
 * 参数类型标注为 Device
 */
const handleUpgradeClick = (device: Device) => {
    selectedDeviceForUpgrade.value = device
    upgradeModalVisible.value = true
    closeDrawer()
}

/**
 * 当升级弹窗通知升级完成时
 */
const onUpgradeDone = () => {
    loadData()
    fetchSummary(selectedCenter.value)
    if (selectedDeviceId.value) {
        // 可选逻辑：刷新抽屉
    }
}

// --- 5. 生命周期 ---
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