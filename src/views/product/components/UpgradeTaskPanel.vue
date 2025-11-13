<template>
    <div class="task-panel">
        <div class="panel-toolbar">
            <div class="left">
                <el-tooltip content="刷新列表" placement="top">
                    <el-button circle :icon="Refresh" @click="loadData" />
                </el-tooltip>
            </div>
            <div class="right">
                <el-button type="primary" :icon="Plus" @click="isCreateVisible = true">
                    新建推广任务
                </el-button>
            </div>
        </div>

        <el-table :data="taskList" v-loading="loading" style="width: 100%" stripe border>
            <el-table-column label="任务 ID / 名称" min-width="200">
                <template #default="{ row }">
                    <div class="task-id">{{ row.id }}</div>
                    <div class="task-name" v-if="row.name">{{ row.name }}</div>
                </template>
            </el-table-column>

            <el-table-column label="目标固件" width="120">
                <template #default="{ row }">
                    <el-tag effect="plain">{{ row.firmwareVersion }}</el-tag>
                </template>
            </el-table-column>

            <el-table-column label="执行状态" width="120">
                <template #default="{ row }">
                    <div class="status-flex">
                        <el-icon v-if="row.status === 'success'" color="#67c23a">
                            <CircleCheckFilled />
                        </el-icon>
                        <el-icon v-else-if="row.status === 'failed'" color="#f56c6c">
                            <CircleCloseFilled />
                        </el-icon>
                        <el-icon v-else-if="row.status === 'installing'" class="is-loading" color="#409eff">
                            <Loading />
                        </el-icon>
                        <el-icon v-else color="#909399">
                            <Clock />
                        </el-icon>
                        <span class="status-text">{{ formatStatus(row.status) }}</span>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="升级进度" min-width="180">
                <template #default="{ row }">
                    <el-progress :percentage="row.progress"
                        :status="row.status === 'failed' ? 'exception' : (row.status === 'success' ? 'success' : '')"
                        :stroke-width="10" />
                </template>
            </el-table-column>

            <el-table-column prop="startedAt" label="开始时间" width="180">
                <template #default="{ row }">
                    {{ formatDateTime(row.startedAt) }}
                </template>
            </el-table-column>

            <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                    <el-popconfirm title="确定要删除这个任务吗？" confirm-button-text="删除" cancel-button-text="取消"
                        @confirm="handleDeleteTask(row)">
                        <template #reference>
                            <el-button link type="danger">
                                删除
                            </el-button>
                        </template>
                    </el-popconfirm>
                </template>
            </el-table-column>
            <template #empty>
                <el-empty description="暂无升级任务记录" />
            </template>
        </el-table>

        <CreateTaskWizard v-model="isCreateVisible" :product="product" @success="loadData" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, CircleCheckFilled, CircleCloseFilled, Loading, Clock } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
import CreateTaskWizard from './CreateTaskWizard.vue'
import { fetchCampaigns, deleteUpgradeCampaign } from '@/api'

const props = defineProps<{
    product: Product
}>()

const loading = ref(false)
const taskList = ref<any[]>([])
const isCreateVisible = ref(false)
let pollingTimer: any = null

const formatStatus = (status: string) => {
    const map: Record<string, string> = {
        'success': '成功',
        'failed': '失败',
        'installing': '进行中',
        'downloading': '下载中',
        'pending': '等待中',
        'idle': '空闲'
    }
    return map[status] || status
}
// 加载任务数据
const loadData = async (isBackground = false) => {
    if (!props.product.id) return
    // 只有手动刷新时才显示 loading
    if (!isBackground) {
        loading.value = true
    } try {
        // 调用 fetchCampaigns 而不是 api.get('/upgradeTasks')
        // 并且传入 productId 进行筛选
        const data = await fetchCampaigns({ productId: props.product.id })
        // 简单排序：最新的在前面
        taskList.value = Array.isArray(data) ? data : (data.items || [])

        // taskList.value = data || []
    } catch (e) {
        console.error('获取任务列表失败:', e)
        // 自动刷新失败时不弹窗打扰用户，仅控制台报错
        if (!isBackground) {
            ElMessage.error('刷新失败')
        }
    } finally {
        loading.value = false
    }
}


// 处理删除
const handleDeleteTask = async (task: any) => {
    try {
        await deleteUpgradeCampaign(task.id)
        ElMessage.success('任务删除成功')
        // 刷新列表
        loadData(true)
    } catch (error) {
        console.error(error)
    }
}

// 启动轮询
const startPolling = () => {
    stopPolling() // 防止重复启动
    // 每 3 秒静默刷新一次
    pollingTimer = setInterval(() => {
        loadData(true)
    }, 1000)
}

// 停止轮询
const stopPolling = () => {
    if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
    }
}

// 生命周期
onMounted(() => {
    loadData()      // 首次加载（显示 loading）
    startPolling()   // 启动自动刷新
})

onUnmounted(() => {
    stopPolling()    // 组件销毁时必须清除定时器，防止内存泄漏
})

watch(() => props.product.id, () => {
    loadData(true)
}, { immediate: true })
</script>

<style scoped>
.task-panel {
    padding: 0 20px 20px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
}

.task-id {
    font-family: monospace;
    font-size: 12px;
    color: #909399;
}

.task-name {
    font-weight: 500;
    color: #303133;
}

.status-flex {
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-text {
    font-size: 13px;
}
</style>