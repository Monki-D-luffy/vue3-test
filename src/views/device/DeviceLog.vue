<template>
    <div class="page-container">
        <PageMainHeader :title="pageTitle" subtitle="设备运行日志与故障诊断中心">
            <template #actions>
                <div class="header-actions">
                    <el-button @click="openUpgradeModal" plain class="glass-button">
                        <el-icon class="mr-1">
                            <Upload />
                        </el-icon> 固件升级
                    </el-button>
                    <el-button type="primary" :loading="isExporting" @click="handleExport" class="glow-button">
                        <el-icon class="mr-1">
                            <Download />
                        </el-icon> 导出日志
                    </el-button>
                </div>
            </template>
        </PageMainHeader>

        <div class="content-wrapper">

            <div class="saas-card info-section">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">设备名称</span>
                        <span class="value">{{ deviceName }}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="info-item">
                        <span class="label">设备 ID</span>
                        <span class="value mono">{{ deviceId }}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="info-item">
                        <span class="label">归属客户</span>
                        <span class="value highlight">{{ mockOwnerName }}</span>
                    </div>
                </div>
            </div>

            <div class="saas-card filter-section">
                <el-form :inline="true" :model="filters" class="modern-filter-form">
                    <div class="filter-group">
                        <el-form-item label="任务 ID">
                            <el-input v-model="filters.taskId" placeholder="输入 ID..." clearable />
                        </el-form-item>
                        <el-form-item label="事件 ID">
                            <el-input v-model="filters.eventId" placeholder="输入 ID..." clearable />
                        </el-form-item>
                        <el-form-item label="类型">
                            <el-select v-model="filters.type" placeholder="全部类型" clearable class="w-140">
                                <el-option label="全部类型" value="all" />
                                <el-option label="数据转换" value="数据转换" />
                                <el-option label="状态通知" value="状态通知" />
                                <el-option label="云端处理" value="云端处理" />
                                <el-option label="设备上报" value="设备上报" />
                                <el-option label="平台下发" value="平台下发" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="时间范围">
                            <el-date-picker v-model="filters.dateRange" type="datetimerange" range-separator="-"
                                start-placeholder="开始" end-placeholder="结束" :shortcuts="dateShortcuts" unlink-panels />
                        </el-form-item>
                    </div>
                    <div class="search-btn-wrapper">
                        <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
                        <el-button @click="handleReset" :icon="RefreshRight" plain>重置</el-button>
                    </div>
                </el-form>
            </div>

            <div class="saas-card table-section">
                <el-table :data="logData" v-loading="loading" style="width: 100%" class="modern-table"
                    :header-cell-style="{ background: '#f8fafc', color: '#64748b', fontWeight: '600' }">
                    <el-table-column type="index" label="#" width="60" align="center" />

                    <el-table-column prop="time" label="时间 (GMT+8)" width="200">
                        <template #default="{ row }">
                            <span class="time-text">{{ row.time }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="event" label="事件" width="140">
                        <template #default="{ row }">
                            <el-tag :type="getEventTypeColor(row.type)" effect="light" round>
                                {{ row.event }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="type" label="类型" width="120" />

                    <el-table-column prop="details" label="事件详情 (Payload)" min-width="350">
                        <template #default="{ row }">
                            <div class="details-wrapper">
                                <div class="code-snippet" @click="copyToClipboard(row.details)">
                                    {{ truncateRawDetails(row.details) }}
                                </div>
                                <el-popover placement="left" :width="500" trigger="click"
                                    popper-class="log-details-popover">
                                    <template #default>
                                        <div class="popover-header">
                                            <span>完整报文解析</span>
                                            <el-button link type="primary" size="small"
                                                @click="copyToClipboard(row.details)">复制</el-button>
                                        </div>
                                        <pre class="log-details-parsed">{{ parseLogDetails(row.details) }}</pre>
                                    </template>
                                    <template #reference>
                                        <el-button link type="primary" size="small">解析</el-button>
                                    </template>
                                </el-popover>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="source" label="来源" width="100" align="right">
                        <template #default="{ row }">
                            <span class="source-badge">{{ row.source }}</span>
                        </template>
                    </el-table-column>

                    <template #empty>
                        <el-empty description="暂无日志数据" :image-size="120" />
                    </template>
                </el-table>

                <div class="pagination-wrapper">
                    <AppPagination v-if="pagination.total > 0" :total="pagination.total"
                        v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                        @size-change="onSizeChange" @current-change="onCurrentChange" />
                </div>
            </div>
        </div>

        <FirmwareUpgradeModal v-model="isUpgradeModalVisible" :device="deviceForModal" @upgrade-done="onUpgradeDone" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, Upload, Download } from '@element-plus/icons-vue'

import PageMainHeader from '@/components/PageMainHeader.vue'
import AppPagination from '@/components/AppPagination.vue'
import FirmwareUpgradeModal from '@/components/FirmwareUpgradeModal.vue'

import { useDeviceLogs, buildDeviceLogParams } from '@/composables/useDeviceLogs'
import { useDataExport } from '@/composables/useDataExport'
// ✅ 引入 AI 上下文
import { useAiContext } from '@/composables/useAiContext'

import { formatDateTime } from '@/utils/formatters'
import { parseLogDetails } from '@/utils/logParser'
import { fetchDeviceLogs as fetchLogsApi } from '@/api/modules/device'

// --- 基础状态 ---
const route = useRoute()
const deviceId = ref(route.query.id as string || 'N/A')
const deviceName = ref(route.query.name as string || '未知设备')
const pageTitle = computed(() => `日志审计: ${deviceName.value}`)
const mockOwnerName = ref('') // 用于 UI 展示和 AI 注入

// --- Composables ---
const {
    loading,
    logData,
    pagination,
    filters,
    fetchLogs,
    handleSizeChange,
    handleCurrentChange,
    resetPagination,
    isUpgradeModalVisible,
    openUpgradeModal,
    handleUpgradeDone
} = useDeviceLogs()

const { isExporting, exportData } = useDataExport()
const { setPageContext } = useAiContext()

// --- 辅助计算 ---
const deviceForModal = computed(() => {
    if (deviceId.value === 'N/A') return null
    return { id: deviceId.value, name: deviceName.value } as any
})

const dateShortcuts = [
    { text: '最近1小时', value: () => [new Date(Date.now() - 3600 * 1000), new Date()] },
    { text: '最近24小时', value: () => [new Date(Date.now() - 3600 * 1000 * 24), new Date()] },
    { text: '最近7天', value: () => [new Date(Date.now() - 3600 * 1000 * 24 * 7), new Date()] },
]

// --- 方法 ---

const getEventTypeColor = (type: string) => {
    if (type === 'danger' || type === 'alarm') return 'danger'
    if (type === 'warning') return 'warning'
    if (type === 'success') return 'success'
    return 'info'
}

const truncateRawDetails = (rawDetails: any): string => {
    const str = String(rawDetails);
    if (str.length > 60) return str.substring(0, 60) + '...';
    return str;
}

const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(String(text));
    ElMessage.success('已复制到剪贴板');
}

// 导出处理
const logDataProcessor = (data: any[]) => {
    return data.map(row => ({
        ...row,
        time: formatDateTime(row.time),
        details: parseLogDetails(row.details)
    }))
}

const logTableColumns = [
    { label: '时间', key: 'time' },
    { label: '事件', key: 'event' },
    { label: '类型', key: 'type' },
    { label: '详情', key: 'details' },
    { label: '来源', key: 'source' }
]

const handleExport = () => {
    const exportParams = buildDeviceLogParams(deviceId.value, filters)
    exportData('/deviceLogs', exportParams, logTableColumns, `设备日志_${deviceName.value}`, logDataProcessor)
}

// 核心数据加载与 AI 注入
const loadData = async () => {
    if (deviceId.value === 'N/A') {
        ElMessage.error('未指定设备ID，无法查询日志')
        return
    }

    // 1. UI 线程：正常加载表格数据 (受分页限制，比如 10 条)
    await fetchLogs(deviceId.value)

    // 生成虚拟客户 (Mock)
    const mockCustomers = ['长沙智能制造示范工厂', '深圳南山科技园机房', '上海张江高科实验室', '北京亦庄数据中心'];
    const customerIndex = deviceId.value.charCodeAt(0) % mockCustomers.length;
    mockOwnerName.value = mockCustomers[customerIndex];

    // 2. AI 上下文注册
    setPageContext(async () => {
        // 🚀 P1 核心升级：影子请求 (Shadow Fetch)
        // 专门为 AI 拉取更多数据 (比如 50 条)，突破 UI 分页限制
        // 这样用户问 "第 17 条日志" 时，AI 就能看见了！
        let aiLogData: any[] = [];
        try {
            // 手动构建参数，请求 50 条
            const aiParams = {
                deviceId: deviceId.value,
                _limit: 50, // 让 AI 能看到更多
                _sort: 'time',
                _order: 'desc'
            };
            const res: any = await fetchLogsApi(aiParams);
            if (Array.isArray(res)) aiLogData = res;
            else if (res?.items) aiLogData = res.items;
        } catch (e) {
            // 如果影子请求失败，降级使用当前表格数据
            console.warn('AI Shadow Fetch Failed', e);
            aiLogData = logData.value;
        }

        // 提取文本快照
        const logSnapshot = aiLogData.map(log =>
            `[${formatDateTime(log.time)}] [${log.type}] ${log.event}: ${String(log.details).substring(0, 100)}`
        ).join('\n');

        return {
            scene: 'DeviceLogAnalysis',
            businessContext: {
                device: {
                    id: deviceId.value,
                    name: deviceName.value,
                    owner: mockOwnerName.value,
                    status: 'Active'
                },
                environment: 'Production'
            },
            dataContext: {
                totalLogs: pagination.total,
                // 告诉 AI 这是更完整的数据
                dataScope: `Top ${aiLogData.length} logs (Expanded View)`,
                recentLogs: logSnapshot
            }
        }
    })
}

const onUpgradeDone = () => { handleUpgradeDone() }

const handleSearch = () => {
    resetPagination()
    loadData()
}

const handleReset = () => {
    filters.taskId = ''
    filters.eventId = ''
    filters.type = 'all'
    filters.dateRange = null
    handleSearch()
}

const onSizeChange = (newSize: number) => { handleSizeChange(newSize, deviceId.value) }
const onCurrentChange = (newPage: number) => { handleCurrentChange(newPage, deviceId.value) }

onMounted(() => {
    loadData()
})
</script>

<style scoped>
/* --- 布局容器 --- */
.page-container {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
}

/* 增加左右内边距，使其不贴边 */
.content-wrapper {
    padding: 0 4px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    /* 卡片之间的呼吸感 */
    margin-top: 16px;
    padding-bottom: 40px;
}

/* --- 通用 SaaS 卡片风格 --- */
.saas-card {
    background: #ffffff;
    border-radius: 12px;
    /* 核心：弥散阴影代替边框 */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(226, 232, 240, 0.6);
    /* 极淡的边框增强层次 */
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.saas-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
}

/* --- 1. 信息卡片 --- */
.info-section {
    padding: 20px 24px;
}

.info-grid {
    display: flex;
    align-items: center;
    gap: 24px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-item .label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-item .value {
    font-size: 15px;
    color: #1e293b;
    font-weight: 600;
}

.info-item .value.mono {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: #475569;
}

.info-item .value.highlight {
    color: #4f46e5;
    /* Indigo-600 */
}

.divider {
    width: 1px;
    height: 32px;
    background-color: #e2e8f0;
}

/* --- 2. 筛选栏 --- */
.filter-section {
    padding: 20px 24px;
}

.modern-filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: space-between;
    align-items: center;
}

.filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
}

/* 覆盖 Element Plus 默认 Form Item 边距 */
.modern-filter-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
}

/* 搜索按钮组 */
.search-btn-wrapper {
    display: flex;
    gap: 12px;
}

/* --- 3. 表格区域 --- */
.table-section {
    padding: 0;
    /* 表格卡片通常不需要 padding，让表格铺满 */
    overflow: hidden;
    /* 圆角溢出隐藏 */
}

.modern-table {
    /* 移除表格默认边框 */
    --el-table-border-color: transparent;
    --el-table-header-bg-color: #f8fafc;
    --el-table-row-hover-bg-color: #f1f5f9;
}

.modern-table :deep(th.el-table__cell) {
    padding: 16px 0;
    /* 增加表头高度 */
    border-bottom: 1px solid #e2e8f0;
}

.modern-table :deep(td.el-table__cell) {
    padding: 16px 0;
    /* 增加行高，增加空气感 */
}

/* 时间列 */
.time-text {
    font-feature-settings: "tnum";
    color: #334155;
    font-size: 13px;
}

/* 代码块样式 */
.details-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.code-snippet {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #475569;
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.code-snippet:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.source-badge {
    font-size: 12px;
    color: #94a3b8;
    background: #f8fafc;
    padding: 2px 8px;
    border-radius: 99px;
    border: 1px solid #f1f5f9;
}

/* 分页栏 */
.pagination-wrapper {
    padding: 16px 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
}

/* --- Popover 内部样式 --- */
.popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-weight: 600;
    color: #1e293b;
}

.log-details-parsed {
    background: #1e1e1e;
    /* 深色主题代码块 */
    color: #d4d4d4;
    padding: 12px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    max-height: 300px;
    overflow-y: auto;
    margin: 0;
}

/* --- Header Buttons --- */
.glass-button {
    backdrop-filter: blur(4px);
    background: rgba(255, 255, 255, 0.5);
}

.glow-button {
    box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);
    /* 按钮微光 */
    transition: all 0.2s;
}

.glow-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px 0 rgba(79, 70, 229, 0.4);
}

.mr-1 {
    margin-right: 4px;
}

.w-140 {
    width: 140px;
}
</style>