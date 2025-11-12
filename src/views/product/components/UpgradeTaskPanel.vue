<template>
    <div class="task-panel">
        <div class="panel-toolbar">
            <div class="left"></div>
            <div class="right">
                <el-button type="primary" :icon="Plus" @click="isCreateVisible = true">
                    新建推广任务
                </el-button>
            </div>
        </div>

        <el-table :data="taskList" v-loading="loading" style="width: 100%">
            <el-table-column prop="id" label="任务 ID" width="180" show-overflow-tooltip />

            <el-table-column label="目标固件" width="120">
                <template #default="{ row }">
                    <el-tag>{{ row.firmwareVersion }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column label="进度" min-width="200">
                <template #default="{ row }">
                    <el-progress :percentage="row.progress"
                        :status="row.status === 'failed' ? 'exception' : (row.status === 'success' ? 'success' : '')" />
                </template>
            </el-table-column>

            <el-table-column prop="startedAt" label="开始时间" width="180">
                <template #default="{ row }">
                    {{ formatDateTime(row.startedAt) }}
                </template>
            </el-table-column>
        </el-table>

        <CreateTaskWizard v-model="isCreateVisible" :product="product" @success="loadData" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
import CreateTaskWizard from './CreateTaskWizard.vue'
// 暂时从 mock-server 接口拉取，或者你可以复用 useDeviceSummary 里的逻辑
// 这里为了演示，我们假设有一个 api.fetchUpgradeTasks
// 如果没有，可以暂时用空数组或写死数据测试
import api from '@/api'

const props = defineProps<{
    product: Product
}>()

const loading = ref(false)
const taskList = ref<any[]>([])
const isCreateVisible = ref(false)

const loadData = async () => {
    loading.value = true
    try {
        // 这里应该调用 fetchUpgradeTasks({ productId: props.product.id })
        // 暂时模拟：
        const res = await api.get('/upgradeTasks')
        // 简单前端过滤
        // 注意：你的 mock-server db.json 里 upgradeTask 没有 productId 字段
        // 而是 deviceId。这在真实后端是不对的，任务应该关联产品。
        // 为了演示，我们暂时显示所有任务
        taskList.value = res.data.data || []
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

const getStatusType = (status: string) => {
    if (status === 'success') return 'success'
    if (status === 'failed') return 'danger'
    if (status === 'pending') return 'info'
    return 'primary'
}

watch(() => props.product.id, () => {
    loadData()
}, { immediate: true })
</script>

<style scoped>
.task-panel {
    padding: 20px;
}

.panel-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}
</style>