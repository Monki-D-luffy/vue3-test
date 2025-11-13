<template>
    <div class="upgrade-task-panel">
        <div class="panel-header">
            <span>
                <el-button :icon="Refresh" circle @click="fetchList(false)" :loading="loading" />
            </span>
            <div class="actions">
                <el-button type="primary" :icon="Plus" @click="isCreateVisible = true">
                    新建任务
                </el-button>
            </div>
        </div>

        <el-table :data="taskList" v-loading="loading" style="width: 100%" border stripe>
            <el-table-column prop="id" label="任务ID" width="180" show-overflow-tooltip />
            <el-table-column prop="name" label="任务名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="firmwareVersion" label="目标版本" width="100" align="center">
                <template #default="{ row }">
                    <el-tag size="small">{{ row.firmwareVersion }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column label="进度" min-width="200">
                <template #default="{ row }">
                    <div class="progress-wrapper">
                        <el-progress :percentage="row.progress" :status="getProgressStatus(row.status)"
                            :stroke-width="18" text-inside />
                        <div class="status-text">
                            <span v-if="row.status === 'running'">进行中... (成功: {{ row.successCount }})</span>
                            <span v-else-if="row.status === 'success'">已完成 (总数: {{ row.totalDevices }})</span>
                            <span v-else-if="row.status === 'failed'">失败 ({{ row.failureCount }}个设备出错)</span>
                            <span v-else>等待中</span>
                        </div>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="startedAt" label="开始时间" width="180" sortable />

            <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                    <el-popconfirm title="确定要删除这个任务吗？" @confirm="removeTask(row.id)">
                        <template #reference>
                            <el-button link type="danger">删除</el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
        </el-table>

        <CreateTaskWizard v-model="isCreateVisible" :product="product" @success="fetchList(false)" />
    </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { Refresh, Plus } from '@element-plus/icons-vue'
import type { Product } from '@/types'
import CreateTaskWizard from './CreateTaskWizard.vue'
import { useUpgradeCampaigns } from '@/composables/useUpgradeCampaigns'

const props = defineProps<{
    product: Product | null
}>()

const isCreateVisible = ref(false)

// 将 props 转换为 ref 传递给 composable
const currentProduct = toRef(props, 'product')

// ✨ 使用 Composable，逻辑全在里面
const {
    loading,
    taskList,
    fetchList,
    removeTask
} = useUpgradeCampaigns(currentProduct)

// 辅助函数：纯 UI 逻辑
const getProgressStatus = (status: string) => {
    if (status === 'failed') return 'exception'
    if (status === 'success') return 'success'
    return ''
}
</script>

<style scoped>
.upgrade-task-panel {
    padding: 0 20px 10px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
}

.progress-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.status-text {
    font-size: 12px;
    color: #909399;
}
</style>