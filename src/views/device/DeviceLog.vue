<template>
    <div class="device-log-container">
        <h1 class="page-title">{{ pageTitle }}</h1>

        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filters" class="filter-form">
                <el-form-item label="设备任务ID">
                    <el-input v-model="filters.taskId" placeholder="模糊搜索" clearable />
                </el-form-item>
                <el-form-item label="事件ID">
                    <el-input v-model="filters.eventId" placeholder="模糊搜索" clearable />
                </el-form-item>
                <el-form-item label="全部类型">
                    <el-select v-model="filters.type" placeholder="全部类型" clearable>
                        <el-option label="全部类型" value="all" />
                        <el-option label="数据转换" value="数据转换" />
                        <el-option label="状态通知" value="状态通知" />
                        <el-option label="云端处理" value="云端处理" />
                        <el-option label="设备上报" value="设备上报" />
                        <el-option label="平台下发" value="平台下发" />
                    </el-select>
                </el-form-item>
                <el-form-item label="时间范围">
                    <el-date-picker v-model="filters.dateRange" type="datetimerange" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" unlink-panels />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch" plain>查询</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="info-card" shadow="never">
            <span>设备名称：{{ deviceName }}</span>
            <el-divider direction="vertical" />
            <span>设备ID：{{ deviceId }}</span>

            <div class="info-card-buttons">
                <el-button type="primary" @click="openUpgradeModal" plain>
                    固件升级
                </el-button>
                <el-button type="primary" :loading="isExporting" @click="handleExport" plain>
                    导出日志
                </el-button>
            </div>
        </el-card>

        <el-card class="log-table-card" shadow="never">
            <el-table :data="logData" v-loading="loading" stripe>
                <el-table-column type="index" label="序号" width="80" />
                <el-table-column prop="time" label="时间(GMT+8)" width="220" />
                <el-table-column prop="event" label="设备事件" width="120" />
                <el-table-column prop="type" label="事件类型" width="120" />

                <el-table-column prop="details" label="事件详情" min-width="300">
                    <template #default="scope">
                        <div class="details-cell-content">
                            <pre class="log-details-raw">{{ truncateRawDetails(scope.row.details) }}</pre>
                            <el-popover placement="right-start" :width="400" trigger="hover"
                                popper-class="log-details-popover">
                                <template #default>
                                    <pre class="log-details-parsed">{{ parseLogDetails(scope.row.details) }}</pre>
                                </template>
                                <template #reference>
                                    <el-tag class="details-trigger-tag" effect="plain" size="small">
                                        解析
                                    </el-tag>
                                </template>
                            </el-popover>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="source" label="来源" width="100" />
                <template #empty>
                    <el-empty description="暂无日志" />
                </template>
            </el-table>

            <AppPagination v-if="pagination.total > 0" :total="pagination.total"
                v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                @size-change="onSizeChange" @current-change="onCurrentChange" />
        </el-card>

        <FirmwareUpgradeModal v-model="isUpgradeModalVisible" :device="deviceForModal" @upgrade-done="onUpgradeDone" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

import AppPagination from '@/components/AppPagination.vue'
import FirmwareUpgradeModal from '@/components/FirmwareUpgradeModal.vue'

// 引入修复后的 Composable
import { useDeviceLogs, buildDeviceLogParams } from '@/composables/useDeviceLogs'
import { useDataExport } from '@/composables/useDataExport'

import { formatDateTime } from '@/utils/formatters'
import { parseLogDetails } from '@/utils/logParser'

const route = useRoute()

// --- 1. 基础参数 ---
const deviceId = ref(route.query.id as string || 'N/A')
const deviceName = ref(route.query.name as string || '未知设备')
const pageTitle = computed(() => `设备日志`)

// --- 2. 使用 Composable ---
// 注意：filters 现在是从 useDeviceLogs 中解构出来的，直接绑定到模板
const {
    loading,
    logData,
    pagination,
    filters, // ✨ 直接使用内部状态，保持响应式连接
    fetchLogs,
    handleSizeChange,
    handleCurrentChange,
    resetPagination,
    isUpgradeModalVisible,
    openUpgradeModal,
    handleUpgradeDone
} = useDeviceLogs()

const { isExporting, exportData } = useDataExport()

// --- 3. 辅助计算属性 ---
const deviceForModal = computed(() => {
    if (deviceId.value === 'N/A') {
        return null
    }
    return {
        id: deviceId.value,
        name: deviceName.value
    } as any
})

// --- 4. 业务逻辑方法 ---

const truncateRawDetails = (rawDetails: any): string => {
    const str = String(rawDetails);
    if (str.length > 50) {
        return str.substring(0, 50) + '...';
    }
    return str;
}

const logDataProcessor = (data: any[]) => {
    return data.map(row => ({
        ...row,
        time: formatDateTime(row.time),
        details: parseLogDetails(row.details)
    }))
}

// 导出列定义
const logTableColumns = [
    { label: '时间(GMT+8)', key: 'time' },
    { label: '设备事件', key: 'event' },
    { label: '事件类型', key: 'type' },
    { label: '事件详情', key: 'details' },
    { label: '来源', key: 'source' }
]

const handleExport = () => {
    const exportParams = buildDeviceLogParams(deviceId.value, filters)
    exportData(
        '/deviceLogs',
        exportParams,
        logTableColumns,
        `设备日志_${deviceName.value}`,
        logDataProcessor
    )
}

const loadData = () => {
    if (deviceId.value === 'N/A') {
        ElMessage.error('未指定设备ID，无法查询日志')
        return
    }
    // ✨ 这里的 filters 已经是 Composable 内部的 reactive 对象，fetchLogs 会自动使用它
    fetchLogs(deviceId.value)
}

const onUpgradeDone = () => {
    handleUpgradeDone();
}

const handleSearch = () => {
    ElMessage.success('正在查询日志...')
    resetPagination()
    loadData()
}

// 分页事件适配
const onSizeChange = (newSize: number) => {
    handleSizeChange(newSize, deviceId.value)
}

const onCurrentChange = (newPage: number) => {
    handleCurrentChange(newPage, deviceId.value)
}

// --- 5. 生命周期 ---
onMounted(() => {
    loadData()
})
</script>

<style scoped>
.device-log-container {
    padding: 0;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    margin-top: 0;
    margin-bottom: 20px;
}


.upgrade-alert {
    margin-top: 20px;
    border-radius: 8px;
}

.filter-card,
.info-card,
.log-table-card {
    margin-top: -1px;
    border-radius: 15px;
}

.filter-form .el-form-item {
    margin-bottom: 0;
    margin-right: 12px;
}

.filter-form .el-select {
    width: 130px;
}

.filter-form .el-input {
    width: 180px;
}


/* 设备信息栏样式 */
.info-card :deep(.el-card__body) {
    padding: 15px 20px;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #606266;
}

.info-card .el-divider--vertical {
    margin: 0 16px;
}

.info-card-buttons {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* 表格日志详情样式 */
.log-details {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    color: #303133;
    background-color: #f5f7fa;
    padding: 8px;
    border-radius: 4px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
}

/* 分页组件的样式 */
.log-table-card :deep(.pagination-block) {
    justify-content: center;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 20px;
    margin-top: 20px;
}

/* 单元格的 flex 布局 */
.details-cell-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* 单元格中 "原始" 数据的 <pre> 样式 */
.log-details-raw {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    color: #909399;
    /* 灰色, 表示是原始数据 */
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    flex-grow: 1;
    /* 占据主要空间 */
}

/* "解析" 标签的样式 */
.details-trigger-tag {
    margin-left: 10px;
    cursor: pointer;
    flex-shrink: 0;
    /* 防止标签被压缩 */

    /* (可选) 微调, 让 'plain' 标签的边框更明显 */
    border-color: var(--el-color-primary-light-5);
    color: var(--el-color-primary);
}

.details-trigger-tag:hover {
    background-color: var(--el-color-primary-light-9);
}


/* * Popover 内部的 <pre> 样式 (保持不变)
 * 必须使用 :global(), 因为 Popover 默认渲染在 <body> 下
*/
:global(.log-details-popover pre.log-details-parsed) {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    color: #303133;
    background-color: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 400px;
    overflow-y: auto;
}
</style>