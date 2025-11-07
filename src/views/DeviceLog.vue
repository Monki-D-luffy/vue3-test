<template>
    <div class="device-log-container">
        <h1 class="page-title">{{ pageTitle }}</h1>

        <el-tabs v-model="activeTab" class="log-tabs">
            <el-tab-pane label="免费版" name="free"></el-tab-pane>
            <el-tab-pane label="付费版" name="paid"></el-tab-pane>
            <el-tab-pane label="AI/声音" name="ai"></el-tab-pane>
        </el-tabs>

        <el-alert title="您当前使用的是免费版日志服务，仅支持查询T+1日日志数据。如需查询实时日志或更长周期，请升级至付费版。" type="warning" show-icon :closable="false"
            class="upgrade-alert" />

        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filters" class="filter-form">
                <el-form-item label="设备任务ID">
                    <el-input v-model="filters.taskId" placeholder="请输入设备任务ID" clearable />
                </el-form-item>
                <el-form-item label="事件ID">
                    <el-input v-model="filters.eventId" placeholder="请输入事件ID" clearable />
                </el-form-item>
                <el-form-item label="全部类型">
                    <el-select v-model="filters.type" placeholder="全部类型">
                        <el-option label="全部类型" value="all" />
                        <el-option label="上报" value="report" />
                        <el-option label="下发" value="send" />
                    </el-select>
                </el-form-item>
                <el-form-item label="时间范围">
                    <el-date-picker v-model="filters.dateRange" type="datetimerange" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" />
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
                <el-table-column prop="time" label="时间(GMT+8)" width="200" />
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
            </el-table>

        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()

// 1. 从路由查询参数获取设备信息
const deviceId = ref(route.query.id || 'N/A')
const deviceName = ref(route.query.name || '未知设备')

const pageTitle = computed(() => `${deviceName.value} 设备日志`)

// 2. 状态定义
const activeTab = ref('free')
const loading = ref(false)
const filters = reactive({
    taskId: '',
    eventId: '',
    type: 'all',
    dateRange: [new Date(2025, 10, 7, 14, 34, 0), new Date(2025, 10, 7, 14, 34, 21)] // 模拟截图时间
})

// 3. 表格模拟数据
const logData = ref([])

const fetchLogs = () => {
    loading.value = true
    // 模拟API请求
    setTimeout(() => {
        logData.value = [
            {
                id: 1,
                time: '2025-11-07 14:34:11.46',
                event: '设备上报',
                type: '数据转换',
                details: `TkkAilQMAAAAAAAAAAAAAAAA\nAAAA...AAAAA+gAAAAAABBB\nBAAAAAAJAAAAAAAAAAAAAA==\n十六进制: ...`,
                source: '设备本身',
                switch: true
            },
            {
                id: 2,
                time: '2025-11-07 14:34:07.855',
                event: '设备在线',
                type: '状态通知',
                details: `uuVrRXAKMAETAAAAAAAAAAAA\nMAAAAAAAA...AAAAAGkAAAAA\nAMQAAAAAAEuMAAAAAAAAAAA=\n十六进制: ...`,
                source: '平台下发',
                switch: false
            },
            {
                id: 3,
                time: '2025-11-07 14:34:04.964',
                event: '设备上报',
                type: '云端处理',
                details: `TkkAilQMAAAAAAAAAAAAAAAA\nMYQAAAA...AAAAA+gAAAAAABBB\nBAAAAAAJAAAAAAAAAAAAAA==\n十六进制: ...`,
                source: '设备本身',
                switch: true
            },
            {
                id: 4,
                time: '2025-11-07 14:34:01.862',
                event: '设备上报',
                type: '数据转换',
                details: `uuVrRXAKMAETAAAAAAAAAAAA\nMAAAAAAAA...AAAAAGkAAAAA\nAMQAAAAAAEuMAAAAAAAAAAA=\n十六进制: ...`,
                source: '设备本身',
                switch: true
            }
        ]
        loading.value = false
    }, 500)
}

const handleSearch = () => {
    ElMessage.success('正在查询日志...')
    fetchLogs()
}

// 4. 生命周期
onMounted(() => {
    fetchLogs()
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

.log-tabs {

    /* 移除标签页下方的边框，让它更干净 */
    :deep(.el-tabs__header) {
        margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
        height: 0;
    }
}

.upgrade-alert {
    margin-top: 20px;
    border-radius: 8px;
}

.filter-card,
.info-card,
.log-table-card {
    margin-top: 20px;
    border-radius: 8px;
}

.filter-form .el-form-item {
    margin-bottom: 0;
    /* 保持筛选栏紧凑 */
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
</style>