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
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="info-card" shadow="never">
            <span>设备名称：{{ deviceName }}</span>
            <el-divider direction="vertical" />
            <span>设备ID：{{ deviceId }}</span>
            <el-divider direction="vertical" />
            <el-button link type="primary">
                查看操作手册
            </el-button>
        </el-card>

        <el-card class="log-table-card" shadow="never">
            <el-table :data="logData" v-loading="loading" stripe>
                <el-table-column type="index" label="序号" width="80" />
                <el-table-column prop="time" label="时间(GMT+8)" width="220" />
                <el-table-column prop="event" label="设备事件" width="120" />
                <el-table-column prop="type" label="事件类型" width="120" />
                <el-table-column prop="details" label="事件详情" min-width="300">
                    <template #default="scope">
                        <pre class="log-details">{{ scope.row.details }}</pre>
                    </template>
                </el-table-column>
                <el-table-column prop="source" label="来源" width="100" />
                <el-table-column prop="switch" label="处理开关" width="100">
                    <template #default="scope">
                        <el-switch v-model="scope.row.switch" />
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty description="暂无日志" />
                </template>
            </el-table>

            <AppPagination v-if="pagination.total > 0" :total="pagination.total"
                v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                @size-change="onSizeChange" @current-change="onCurrentChange" />
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
// ✨ 1. 导入 AppPagination 组件和 useDeviceLogs
import AppPagination from '@/components/AppPagination.vue'
import { useDeviceLogs } from '@/composables/useDeviceLogs'

const route = useRoute()

// --- 1. 基础状态 ---
const deviceId = ref(route.query.id as string || 'N/A')
const deviceName = ref(route.query.name as string || '未知设备')
const pageTitle = computed(() => `设备日志`)

const filters = reactive({
    taskId: '',
    eventId: '',
    type: 'all',
    dateRange: null // 默认无时间范围
})

// --- 2. 使用 Composable ---
const {
    loading,
    logData,
    pagination,
    fetchLogs,
    handleSizeChange,
    handleCurrentChange,
    resetPagination
} = useDeviceLogs()

// --- 3. 逻辑函数 ---

// 统一的数据加载函数
const loadData = () => {
    if (deviceId.value === 'N/A') {
        ElMessage.error('未指定设备ID，无法查询日志')
        return
    }
    fetchLogs(deviceId.value, filters)
}

// 搜索
const handleSearch = () => {
    ElMessage.success('正在查询日志...')
    resetPagination() // 搜索时重置到第一页
    loadData()
}

// 分页变更
const onSizeChange = (newSize: number) => {
    handleSizeChange(newSize)
    loadData()
}
const onCurrentChange = (newPage: number) => {
    handleCurrentChange(newPage)
    loadData()
}

// --- 4. 生命周期 ---
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
    /* 保持筛选栏紧凑 */
    margin-right: 12px;
    /* 增加一些间距 */
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

.info-card .el-button {
    padding: 0;
    margin-left: auto;
    /* 推动按钮到最右侧 */
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
    /* 保留换行 */
    word-break: break-all;
    /* 允许长字符串换行 */
}

/* 分页组件的样式 */
.log-table-card :deep(.pagination-block) {
    justify-content: center;
    /* 确保分页居中 */
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 20px;
    margin-top: 20px;
}
</style>