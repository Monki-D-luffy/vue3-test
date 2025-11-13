<template>
    <div class="upgrade-task-panel">
        <div class="panel-header">
            <span><el-button :icon="Refresh" circle @click="loadData(false)" :loading="loading" /></span>
            <div class="actions">
                <el-button type="primary" :icon="Plus" @click="openCreateWizard">
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
                        <el-progress :percentage="row.progress"
                            :status="row.status === 'failed' ? 'exception' : (row.status === 'success' ? 'success' : '')"
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
                    <el-popconfirm title="确定要删除这个任务吗？" confirm-button-text="删除" cancel-button-text="取消"
                        @confirm="handleDeleteTask(row)">
                        <template #reference>
                            <el-button link type="danger">删除</el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
        </el-table>

        <CreateTaskWizard v-model="isCreateVisible" :product="product" @success="handleTaskCreated" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { fetchCampaigns, deleteUpgradeCampaign } from '@/api'
import type { Product } from '@/types'
import CreateTaskWizard from './CreateTaskWizard.vue'

const props = defineProps<{
    product: Product | null
}>()

// --- 状态 ---
const loading = ref(false)
const taskList = ref<any[]>([])
const isCreateVisible = ref(false)
let pollingTimer: any = null // 定时器

// --- 核心功能 ---

/**
 * 启动轮询 (每3秒一次)
 */
const startPolling = () => {
    if (pollingTimer) return // 防止重复启动
    pollingTimer = setInterval(() => {
        loadData(true) // true 表示静默刷新，不显示 loading
    }, 1000)
}

/**
 * 停止轮询
 */
const stopPolling = () => {
    if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
    }
}

/**
 * 加载数据 (核心函数)
 * @param isBackground 是否为后台静默刷新 (默认 false)
 */
const loadData = async (isBackground = false) => {
    if (!props.product?.id) return

    // 只有手动刷新或首次加载时，才显示转圈圈
    if (!isBackground) {
        loading.value = true
    }

    try {
        // 1. 获取数据
        const res = await fetchCampaigns({ productId: props.product.id })
        taskList.value = Array.isArray(res) ? res : (res.items || [])

        // 2. 智能轮询判断
        // 只要有一个任务是 'running' 或 'pending' 状态，就保持轮询
        const hasActiveTask = taskList.value.some(task =>
            ['running', 'pending'].includes(task.status)
        )

        if (hasActiveTask) {
            // 有任务在跑 -> 确保开启轮询
            startPolling()
        } else {
            // 所有任务都结束了 -> 停止轮询，节省资源
            stopPolling()
        }

    } catch (error) {
        console.error('加载任务列表失败:', error)
        // 静默刷新出错时不弹窗，避免打扰用户
        if (!isBackground) {
            ElMessage.error('刷新失败')
        }
        // 出错时建议停止轮询，防止死循环报错
        stopPolling()
    } finally {
        loading.value = false
    }
}

// --- 事件处理 ---

const handleTaskCreated = () => {
    isCreateVisible.value = false
    // 创建成功后立即刷新，loadData 会检测到新任务状态并自动开启轮询
    loadData()
}

const handleDeleteTask = async (task: any) => {
    try {
        await deleteUpgradeCampaign(task.id)
        ElMessage.success('任务删除成功')
        loadData() // 删除后刷新
    } catch (error) {
        console.error(error)
        ElMessage.error('删除失败')
    }
}

const openCreateWizard = () => {
    isCreateVisible.value = true
}

// --- 生命周期 & 监听 ---

onMounted(() => {
    loadData() // 首次挂载时加载
})

onUnmounted(() => {
    stopPolling() // 组件销毁时务必清除定时器
})

// 监听产品切换
watch(() => props.product, (newVal) => {
    if (newVal) {
        stopPolling() // 切换前先停止旧的轮询
        loadData()    // 加载新产品数据
    }
}, { immediate: true })

</script>

<style scoped>
.upgrade-task-panel {
    padding: 0 20px 10px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    /* padding: 20px; 这一层通常由父容器控制，这里可以去掉或者保留 */
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
}

.panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.actions {
    display: flex;
    gap: 12px;
}

.progress-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
}

.status-text {
    font-size: 12px;
    color: #909399;
}
</style>