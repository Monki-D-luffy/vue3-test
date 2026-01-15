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
            <div class="saas-card info-section" v-loading="deviceLoading">
                <div class="info-grid">
                    <div class="info-group">
                        <div class="info-item">
                            <span class="label">设备名称</span>
                            <span class="value main-value" :title="deviceName">
                                {{ displayDeviceName }}
                            </span>
                        </div>
                        <div class="info-item sub-item">
                            <span class="label">设备 SN (UUID)</span>
                            <span class="value mono copyable" @click="copyText(deviceId)">
                                {{ deviceId }}
                                <el-icon class="copy-icon">
                                    <CopyDocument />
                                </el-icon>
                            </span>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="info-group">
                        <div class="info-item">
                            <span class="label">产品 ID (PID)</span>
                            <span class="value mono">{{ realDeviceDetail?.ProductId || realDeviceDetail?.productId ||
                                '-'
                            }}</span>
                        </div>
                        <div class="info-item sub-item">
                            <span class="label">区域/时区</span>
                            <span class="value">
                                <el-icon class="location-icon">
                                    <Location />
                                </el-icon>
                                {{ realDeviceDetail?.Country || realDeviceDetail?.region || 'CN' }}
                            </span>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="info-group">
                        <div class="info-item">
                            <span class="label">固件版本 (DP22)</span>
                            <div class="value-row">
                                <span class="value highlight">{{ firmwareVersion || '--' }}</span>
                                <el-tag v-if="hasNewVersion" size="small" type="danger" effect="dark"
                                    class="ml-2">NEW</el-tag>
                            </div>
                        </div>
                        <div class="info-item sub-item">
                            <span class="label">当前状态</span>
                            <el-tag size="small" :type="isOnline ? 'success' : 'info'" effect="light"
                                class="status-tag">
                                <span class="dot" :class="{ online: isOnline }"></span>
                                {{ deviceStatusText }}
                            </el-tag>
                        </div>
                    </div>
                </div>
            </div>

            <div class="saas-card filter-section">
                <el-form :inline="true" :model="filters" class="modern-filter-form">
                    <div class="filter-group">
                        <el-form-item label="DP / 事件 ID">
                            <el-input v-model="filters.eventId" placeholder="例如: 22" clearable style="width: 140px">
                                <template #prefix>DP</template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="时间范围">
                            <el-date-picker v-model="filters.dateRange" type="datetimerange" range-separator="→"
                                start-placeholder="开始时间" end-placeholder="结束时间" :shortcuts="dateShortcuts" unlink-panels
                                style="width: 320px" />
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
                    :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: '600' }">

                    <el-table-column type="index" label="#" width="60" align="center" />

                    <el-table-column prop="time" label="上报时间" width="180">
                        <template #default="{ row }">
                            <span class="time-text">{{ formatDateTime(row.time) }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="event" label="功能点 (DP)" width="160">
                        <template #default="{ row }">
                            <el-tag :type="getEventTypeColor(row.event)" effect="plain" round class="event-tag">
                                {{ row.event }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="details" label="数据详情 (Payload)" min-width="300">
                        <template #default="{ row }">
                            <LogPayloadPopover :content="row.details" :event-id="row.event" />
                        </template>
                    </el-table-column>

                    <el-table-column prop="source" label="来源" width="110" align="center">
                        <template #default="{ row }">
                            <span class="source-badge" :class="getSourceClass(row.source)">
                                {{ row.source }}
                            </span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="sourceDetail" label="备注" width="150" show-overflow-tooltip>
                        <template #default="{ row }">
                            <span class="text-secondary">{{ row.sourceDetail || '-' }}</span>
                        </template>
                    </el-table-column>

                    <template #empty>
                        <el-empty description="暂无日志数据" :image-size="100" />
                    </template>
                </el-table>

                <div class="pagination-wrapper" v-if="pagination.total > 0">
                    <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                        :total="pagination.total" :page-sizes="[20, 50, 100]"
                        layout="total, sizes, prev, pager, next, jumper" background @size-change="onSizeChange"
                        @current-change="onCurrentChange" />
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
import { Search, RefreshRight, Upload, Download, CopyDocument, Location } from '@element-plus/icons-vue'

import PageMainHeader from '@/components/PageMainHeader.vue'
import FirmwareUpgradeModal from '@/components/FirmwareUpgradeModal.vue'
import LogPayloadPopover from './components/LogPayloadPopover.vue'

// 引入 API
import { fetchDeviceLogs, fetchRealDeviceList } from '@/api/modules/device' // ✨ 引入真实列表接口
import { useDeviceLogs, buildDeviceLogParams } from '@/composables/useDeviceLogs'
import { useDataExport } from '@/composables/useDataExport'
import { formatDateTime } from '@/utils/formatters'
import { parseLogDetails } from '@/utils/logParser'

// --- 基础状态 ---
const route = useRoute()
const deviceId = ref(route.query.id as string || 'N/A')
const rawDeviceName = ref(route.query.name as string || '')

// 设备详情相关
const deviceLoading = ref(false)
const realDeviceDetail = ref<any>(null) // 存储从列表接口获取的完整详情
const firmwareVersion = ref<string>('--')

// --- 计算属性 ---
const pageTitle = computed(() => `日志审计`)

// 智能显示名称
const displayDeviceName = computed(() => {
    // 优先用真实接口返回的 DeviceName，其次用 URL 参数
    const name = realDeviceDetail.value?.DeviceName || realDeviceDetail.value?.deviceName || rawDeviceName.value
    const id = deviceId.value
    if (!name || name === id || name === 'Unknown') {
        return `设备 (${id.substring(0, 4)}...)`
    }
    return name
})

const deviceName = computed(() => displayDeviceName.value)

const deviceStatusText = computed(() => {
    // 兼容后端不同的大小写返回
    const status = realDeviceDetail.value?.OnlineStatus ?? realDeviceDetail.value?.status
    if (status === 1 || status === 'Online' || status === '在线') return '在线'
    return '离线'
})

const isOnline = computed(() => deviceStatusText.value === '在线')
const hasNewVersion = computed(() => false) // 暂无此字段

const deviceForModal = computed(() => {
    if (deviceId.value === 'N/A') return null
    return { id: deviceId.value, name: deviceName.value } as any
})

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

const dateShortcuts = [
    { text: '最近1小时', value: () => [new Date(Date.now() - 3600 * 1000), new Date()] },
    { text: '最近24小时', value: () => [new Date(Date.now() - 3600 * 1000 * 24), new Date()] },
    { text: '最近7天', value: () => [new Date(Date.now() - 3600 * 1000 * 24 * 7), new Date()] },
]

// --- 核心方法 ---

// 1. ✨ 从真实设备列表获取完整元数据 (包含 PID)
const loadRealDeviceMeta = async () => {
    if (deviceId.value === 'N/A') return
    try {
        deviceLoading.value = true
        // 调用列表接口，按 UUID 过滤
        // 注意：这里假设后端支持 uuid 参数，如果不支持，可能需要获取列表后前端 find
        // 根据之前的 verify_api.js，GetDevices 支持 uuid 参数
        const res: any = await fetchRealDeviceList({
            pageIndex: 1,
            pageSize: 1,
            uuid: deviceId.value,
            country: 'CN' // 必填项，防止报错
        })

        // 解析列表返回结构
        const list = res.data?.Data || res.data || [] // 兼容 {Data:[], Success:true}
        if (Array.isArray(list) && list.length > 0) {
            realDeviceDetail.value = list[0]
        } else {
            console.warn('Device not found in real list')
        }
    } catch (e) {
        console.warn('Failed to load real device meta:', e)
    } finally {
        deviceLoading.value = false
    }
}

// 2. 获取 DP22 版本号
const loadLatestFirmwareVersion = async () => {
    if (deviceId.value === 'N/A') return
    try {
        const res = await fetchDeviceLogs({
            deviceId: deviceId.value,
            eventId: 22,
            pageIndex: 1,
            pageSize: 1
        })

        if (res && res.items && res.items.length > 0) {
            let ver = res.items[0].details
            ver = ver.replace(/"/g, '')
            firmwareVersion.value = ver
        }
    } catch (e) {
        console.warn('Failed to fetch firmware version (DP22):', e)
    }
}

const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
}

// 样式辅助
const getEventTypeColor = (eventStr: string) => {
    if (eventStr.includes('22') || eventStr.includes('Version')) return 'primary'
    if (eventStr.includes('Alert') || eventStr.includes('Fault')) return 'danger'
    return 'info'
}

const getSourceClass = (source: string) => {
    if (source === '设备上报') return 'bg-blue'
    if (source === '云端下发') return 'bg-purple'
    return 'bg-gray'
}

const logTableColumns = [
    { label: '时间', key: 'time' },
    { label: '功能点', key: 'event' },
    { label: '数据详情', key: 'details' },
    { label: '来源', key: 'source' },
    { label: '备注', key: 'sourceDetail' }
]

const logDataProcessor = (data: any[]) => {
    return data.map(row => ({
        ...row,
        time: formatDateTime(row.time),
        details: parseLogDetails(row.details)
    }))
}

const handleExport = () => {
    const exportParams = buildDeviceLogParams(deviceId.value, filters)
    exportData('/deviceLogs', exportParams, logTableColumns, `设备日志_${deviceName.value}`, logDataProcessor)
}

const handleSearch = () => {
    resetPagination()
    fetchLogs(deviceId.value)
}

const handleReset = () => {
    filters.eventId = ''
    filters.dateRange = null
    handleSearch()
}

const onSizeChange = (newSize: number) => { handleSizeChange(newSize, deviceId.value) }
const onCurrentChange = (newPage: number) => { handleCurrentChange(newPage, deviceId.value) }

const onUpgradeDone = () => { handleUpgradeDone() }

// 生命周期
onMounted(async () => {
    if (deviceId.value !== 'N/A') {
        fetchLogs(deviceId.value)
        await loadRealDeviceMeta() // ✨ 加载 PID
        loadLatestFirmwareVersion()
    } else {
        ElMessage.error('未指定设备ID')
    }
})
</script>

<style scoped>
/* ... (原有的样式保持不变) ... */

/* 新增：Info Card 样式微调，适配 PID 显示 */
.saas-card {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.info-section {
    padding: 20px 24px;
}

.info-grid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}

.info-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.divider {
    width: 1px;
    height: 40px;
    background-color: #e2e8f0;
    margin: 0 10px;
}

.info-item {
    display: flex;
    flex-direction: column;
}

.info-item.sub-item {
    margin-top: 4px;
}

.label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 2px;
}

.value {
    font-size: 14px;
    color: #1e293b;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
}

.main-value {
    font-size: 16px;
    color: #0f172a;
}

.mono {
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: -0.5px;
}

.highlight {
    color: #2563eb;
}

.copyable {
    cursor: pointer;
    transition: color 0.2s;
}

.copyable:hover {
    color: #3b82f6;
}

.copy-icon,
.location-icon {
    font-size: 12px;
    color: #94a3b8;
}

.status-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #94a3b8;
}

.dot.online {
    background-color: #22c55e;
}

/* Filter & Table section */
.filter-section {
    padding: 16px 24px;
}

.modern-filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
}

.search-btn-wrapper {
    margin-left: auto;
    display: flex;
    gap: 12px;
}

.table-section {
    padding: 0;
    overflow: hidden;
}

.modern-table {
    --el-table-header-bg-color: #f8fafc;
}

.time-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #334155;
}

.event-tag {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
}

.source-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
}

.bg-blue {
    background: #eff6ff;
    color: #3b82f6;
}

.bg-purple {
    background: #f5f3ff;
    color: #8b5cf6;
}

.bg-gray {
    background: #f1f5f9;
    color: #64748b;
}

.text-secondary {
    color: #94a3b8;
    font-size: 12px;
}

.pagination-wrapper {
    padding: 12px 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
}

.glass-button {
    backdrop-filter: blur(4px);
    background: rgba(255, 255, 255, 0.8);
}

.glow-button {
    box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.2);
}

/* 页面通用布局 */
.page-container {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
}

.content-wrapper {
    padding: 0 4px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
    padding-bottom: 40px;
}
</style>