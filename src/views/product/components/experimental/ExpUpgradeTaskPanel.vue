<template>
    <div class="exp-panel">
        <div class="panel-toolbar">
            <div class="left-tip">
                <el-icon class="info-icon">
                    <List />
                </el-icon>
                <span>批量升级任务记录</span>
            </div>
            <div class="right-action">
                <el-button type="primary" class="tech-btn" @click="isCreateVisible = true">
                    <el-icon class="mr-1">
                        <Plus />
                    </el-icon>
                    新建任务
                </el-button>
            </div>
        </div>

        <div class="table-container">
            <el-table :data="taskList" v-loading="loading" height="100%" style="width: 100%"
                :header-cell-style="headerStyle" :row-class-name="tableRowClassName">
                <el-table-column label="任务名称" min-width="160">
                    <template #default="{ row }">
                        <div class="task-info">
                            <span class="task-name">{{ row.name || `Task_${row.id.slice(0, 8)}` }}</span>
                            <span class="task-id">ID: {{ row.id }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="目标版本" width="140">
                    <template #default="{ row }">
                        <span class="version-code">{{ row.targetVersion }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="升级进度" min-width="200">
                    <template #default="{ row }">
                        <div class="progress-wrapper">
                            <div class="progress-info">
                                <span class="progress-text">{{ row.successCount }}/{{ row.totalCount }} 台</span>
                                <span class="progress-percent">{{ calculatePercent(row) }}%</span>
                            </div>
                            <el-progress :percentage="calculatePercent(row)" :stroke-width="6" :show-text="false"
                                :color="getProgressColor(row.status)" class="slim-progress" />
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                        <div class="status-badge" :class="getStatusClass(row.status)">
                            <span class="status-dot"></span>
                            {{ getStatusText(row.status) }}
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="创建时间" width="160">
                    <template #default="{ row }">
                        <span class="time-text">{{ formatDateTime(row.createdAt) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="100" align="right" fixed="right">
                    <template #default>
                        <el-button circle size="small" class="action-btn" plain>
                            <el-icon>
                                <ArrowRight />
                            </el-icon>
                        </el-button>
                    </template>
                </el-table-column>

                <template #empty>
                    <el-empty description="暂无升级任务" :image-size="80" />
                </template>
            </el-table>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, List, ArrowRight } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
// 这里我们暂时模拟数据，因为你提到“先做下一步，数据处理延后”
// 后续可以替换为真实的 useUpgradeTask()

const props = defineProps<{
    product: Product
}>()

const isCreateVisible = ref(false)
const loading = ref(false)
// 模拟的任务数据，为了让你能看到效果
const taskList = ref<any[]>([])

const mockData = [
    {
        id: 'job-109238',
        name: '全量升级 v2.1.0',
        targetVersion: 'v2.1.0',
        totalCount: 100,
        successCount: 45,
        status: 'running',
        createdAt: new Date().toISOString()
    },
    {
        id: 'job-109239',
        name: '灰度测试 v2.2.0-beta',
        targetVersion: 'v2.2.0-beta',
        totalCount: 20,
        successCount: 20,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: 'job-109240',
        name: '紧急修复补丁',
        targetVersion: 'v2.0.1',
        totalCount: 50,
        successCount: 0,
        status: 'failed',
        createdAt: new Date(Date.now() - 172800000).toISOString()
    }
]

const loadTasks = () => {
    loading.value = true
    // 模拟异步
    setTimeout(() => {
        taskList.value = mockData
        loading.value = false
    }, 500)
}

watch(() => props.product.id, () => {
    loadTasks()
}, { immediate: true })

// 工具函数
const calculatePercent = (row: any) => {
    if (!row.totalCount) return 0
    return Math.floor((row.successCount / row.totalCount) * 100)
}

const getProgressColor = (status: string) => {
    if (status === 'failed') return '#ef4444'
    if (status === 'completed') return '#10b981'
    return '#3b82f6'
}

const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        running: '进行中',
        completed: '已完成',
        failed: '已失败',
        pending: '等待中'
    }
    return map[status] || status
}

const getStatusClass = (status: string) => {
    return `status-${status}`
}

// 样式配置
const headerStyle = {
    background: '#f8fafc',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: '1px solid #e2e8f0'
}
const tableRowClassName = () => 'modern-row'
</script>

<style scoped>
.exp-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px 24px;
}

/* Toolbar */
.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.left-tip {
    display: flex;
    align-items: center;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
}

.info-icon {
    margin-right: 8px;
}

.tech-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 8px;
    padding: 9px 18px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: all 0.2s;
}

.tech-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

/* Table Styling */
.table-container {
    flex: 1;
    overflow: hidden;
    border-radius: 8px;
}

.task-info {
    display: flex;
    flex-direction: column;
}

.task-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
}

.task-id {
    font-size: 12px;
    color: #94a3b8;
    font-family: 'Monaco', monospace;
    margin-top: 2px;
}

.version-code {
    font-family: 'JetBrains Mono', 'Monaco', monospace;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    color: #475569;
    font-size: 12px;
}

/* Progress Bar */
.progress-wrapper {
    padding-right: 12px;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
}

:deep(.slim-progress .el-progress-bar__outer) {
    background-color: #f1f5f9 !important;
    border-radius: 4px;
}

:deep(.slim-progress .el-progress-bar__inner) {
    border-radius: 4px;
    transition: width 0.6s ease;
}

/* Status Badges */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

/* Status Colors */
.status-running {
    background: #eff6ff;
    color: #3b82f6;
}

.status-running .status-dot {
    background: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.status-completed {
    background: #ecfdf5;
    color: #10b981;
}

.status-completed .status-dot {
    background: #10b981;
}

.status-failed {
    background: #fef2f2;
    color: #ef4444;
}

.status-failed .status-dot {
    background: #ef4444;
}

.status-pending {
    background: #f8fafc;
    color: #64748b;
}

.status-pending .status-dot {
    background: #cbd5e1;
}

.time-text {
    color: #64748b;
    font-size: 13px;
}

.action-btn:hover {
    background-color: #f1f5f9;
    color: #3b82f6;
    border-color: #cbd5e1;
}

/* Table Row Hover */
:deep(.el-table__row) {
    transition: background-color 0.2s;
}

:deep(.el-table__row:hover) {
    background-color: #f8fafc !important;
}

:deep(.el-table__inner-wrapper::before) {
    display: none;
}
</style>