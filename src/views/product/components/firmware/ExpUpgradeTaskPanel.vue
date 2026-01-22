<template>
    <div class="exp-panel">
        <div class="panel-toolbar">
            <div class="left-tip">
                <el-icon class="info-icon">
                    <List />
                </el-icon>
                <span>批量升级任务记录 ({{ pagination.total }})</span>
                <span v-if="isPolling" class="polling-badge">
                    <span class="pulse-dot"></span> 实时监控中
                </span>
            </div>
            <div class="right-action">
                <el-button :icon="Refresh" circle @click="fetchList(false)" :loading="loading" class="mr-2" />
                <el-button type="primary" class="tech-btn" @click="openCreateWizard">
                    <el-icon class="mr-1">
                        <Plus />
                    </el-icon>
                    新建任务
                </el-button>
            </div>
        </div>

        <div class="table-container">
            <el-table :data="taskList" v-loading="loading && taskList.length === 0" style="width: 100%"
                :header-cell-style="headerStyle" :row-class-name="tableRowClassName">

                <el-table-column label="任务名称" min-width="180">
                    <template #default="{ row }">
                        <div class="task-info">
                            <span class="task-name" :title="row.name">{{ row.name || `Task_${row.id?.slice(0, 6)}`
                                }}</span>
                            <span class="task-id">ID: {{ row.id }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="目标版本" width="140">
                    <template #default="{ row }">
                        <span class="version-code">{{ row.firmwareVersion || row.targetVersion || '--' }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="范围" width="120">
                    <template #default="{ row }">
                        <el-tag size="small" :type="row.targetScope === 'filter' ? 'warning' : 'info'" effect="light"
                            round>
                            {{ row.targetScope === 'filter' ? '定向筛选' : '全量推送' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="升级进度" min-width="220">
                    <template #default="{ row }">
                        <div class="progress-wrapper">
                            <div class="progress-info">
                                <span class="progress-text">
                                    <template v-if="row.status === 'running'">
                                        正在推送...
                                    </template>
                                    <template v-else-if="row.status === 'success'">
                                        全部完成
                                    </template>
                                    <template v-else>
                                        已完成 {{ calculatePercent(row) }}%
                                    </template>
                                </span>
                                <span class="progress-num">{{ row.successCount || 0 }}/{{ row.totalDevices ||
                                    row.totalCount || 0 }}</span>
                            </div>
                            <el-progress :percentage="calculatePercent(row)" :stroke-width="8" :show-text="false"
                                :color="getProgressColor(row.status)"
                                :status="row.status === 'failed' ? 'exception' : ''" class="slim-progress"
                                :indeterminate="row.status === 'running' && calculatePercent(row) < 100"
                                :duration="3" />
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                        <div class="status-badge" :class="`status-${row.status || 'pending'}`">
                            <span class="status-dot"></span>
                            {{ getStatusText(row.status) }}
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="创建时间" width="160">
                    <template #default="{ row }">
                        <span class="time-text">{{ formatDateTime(row.createdAt || row.startedAt) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="100" align="right" fixed="right">
                    <template #default="{ row }">
                        <el-popconfirm title="确定要删除此任务记录吗?" @confirm="removeTask(row.id)">
                            <template #reference>
                                <el-button circle size="small" class="action-btn delete-btn" plain>
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                </el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>

                <template #empty>
                    <div class="empty-state-wrapper">
                        <el-empty description="暂无升级任务" :image-size="100">
                            <template #extra>
                                <el-button type="primary" @click="openCreateWizard">
                                    立即创建第一个任务
                                </el-button>
                            </template>
                        </el-empty>
                    </div>
                </template>
            </el-table>
        </div>

        <div class="pagination-wrapper" v-if="pagination.total > 0">
            <AppPagination :total="pagination.total" v-model:current-page="pagination.currentPage"
                v-model:page-size="pagination.pageSize" @size-change="handlePaginationChange"
                @current-change="handlePaginationChange" />
        </div>

        <ExpCreateTaskWizard v-model="isCreateVisible" :product="product" @success="handleTaskCreated" />
    </div>
</template>

<script setup lang="ts">
import { ref, toRef, computed } from 'vue'
import { Plus, List, Refresh, Delete } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
import ExpCreateTaskWizard from './ExpCreateTaskWizard.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useUpgradeCampaigns } from '@/composables/useUpgradeCampaigns'

const props = defineProps<{
    product: Product
}>()

const isCreateVisible = ref(false)
const productRef = toRef(props, 'product')

const {
    loading,
    taskList,
    pagination,
    fetchList,
    removeTask,
    handlePaginationChange
} = useUpgradeCampaigns(productRef)

const isPolling = computed(() => {
    return taskList.value.some(t => ['running', 'pending'].includes(t.status))
})

const openCreateWizard = () => {
    isCreateVisible.value = true
}

const handleTaskCreated = () => {
    fetchList()
}

const calculatePercent = (row: any) => {
    if (row.progress !== undefined) return row.progress
    const total = row.totalDevices || row.totalCount || 0
    const success = row.successCount || 0
    if (!total) return 0
    return Math.floor((success / total) * 100)
}

const getProgressColor = (status: string) => {
    if (status === 'failed') return '#ef4444'
    if (status === 'success' || status === 'completed') return '#10b981'
    return '#3b82f6'
}

const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        running: '进行中',
        success: '已完成',
        completed: '已完成',
        failed: '已失败',
        pending: '等待中',
        canceled: '已取消'
    }
    return map[status] || status || '未知'
}

// ✨ [关键修复] 使用 CSS 变量
const headerStyle = {
    background: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: '1px solid var(--border-color-light)'
}
const tableRowClassName = () => 'modern-row'
</script>

<style scoped>
.exp-panel {
    padding: 16px 24px;
    padding-bottom: 24px;
}

.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.left-tip {
    display: flex;
    align-items: center;
    /* ✨ [修复] */
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    gap: 8px;
}

.table-container {
    border-radius: 8px;
}

.pagination-wrapper {
    margin-top: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
}

/* --- 以下样式保持不变 --- */
.polling-badge {
    display: inline-flex;
    align-items: center;
    background-color: #ecfdf5;
    color: #059669;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
}

.pulse-dot {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    margin-right: 6px;
    animation: pulse-green 1.5s infinite;
}

@keyframes pulse-green {
    0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
}

.tech-btn {
    background: linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%);
    border: none;
    border-radius: 8px;
    padding: 9px 18px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: all 0.2s;
    color: #fff;
}

.tech-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.mr-2 {
    margin-right: 8px;
}

.task-info {
    display: flex;
    flex-direction: column;
}

.task-name {
    font-weight: 600;
    /* ✨ [修复] */
    color: var(--text-primary);
    font-size: 14px;
}

.task-id {
    font-size: 12px;
    /* ✨ [修复] */
    color: var(--text-placeholder);
    font-family: 'Monaco', monospace;
    margin-top: 2px;
}

.version-code {
    font-family: 'JetBrains Mono', 'Monaco', monospace;
    /* ✨ [修复] */
    background: var(--bg-hover);
    padding: 2px 6px;
    border-radius: 4px;
    /* ✨ [修复] */
    color: var(--text-secondary);
    font-size: 12px;
}

.progress-wrapper {
    padding-right: 12px;
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    /* ✨ [修复] */
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.progress-num {
    font-family: monospace;
    font-weight: 600;
    /* ✨ [修复] */
    color: var(--text-primary);
}

/* 进度条底色适配 */
:deep(.slim-progress .el-progress-bar__outer) {
    background-color: var(--border-color-light) !important;
    border-radius: 4px;
}

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

.status-running {
    background: #eff6ff;
    color: #3b82f6;
}

.status-running .status-dot {
    background: #3b82f6;
}

.status-success,
.status-completed {
    background: #ecfdf5;
    color: #10b981;
}

.status-success .status-dot,
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
    background: var(--bg-hover);
    color: var(--text-secondary);
}

.status-pending .status-dot {
    background: #cbd5e1;
}

.action-btn {
    /* ✨ [修复] */
    background-color: transparent;
    border: none;
}

.action-btn:hover {
    background-color: #fee2e2;
    color: #ef4444;
    border-color: #fee2e2;
}

:deep(.el-table__row) {
    transition: background-color 0.2s;
}

:deep(.el-table__row:hover) {
    background-color: var(--bg-hover) !important;
}
</style>