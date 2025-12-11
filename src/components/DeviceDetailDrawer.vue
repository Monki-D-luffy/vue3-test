<template>
    <el-drawer :model-value="modelValue" @update:model-value="(val: boolean) => $emit('update:modelValue', val)"
        title="设备详情" direction="rtl" size="600px" destroy-on-close class="device-detail-drawer">
        <template #header>
            <div class="drawer-header">
                <span class="drawer-title">设备详情</span>
                <el-tag v-if="device" :type="getStatusType(device.status)" effect="dark" size="small" class="ml-2">
                    {{ device.status }}
                </el-tag>
            </div>
        </template>

        <div v-if="device" class="drawer-content">
            <div class="hero-section">
                <div class="device-icon">
                    <el-icon :size="32">
                        <Monitor />
                    </el-icon>
                </div>
                <div class="hero-info">
                    <h3 class="device-name">{{ device.name }}</h3>
                    <p class="device-sn">SN: {{ device.sn }}</p>
                </div>
                <div class="hero-actions">
                    <el-button type="primary" size="small" plain @click="handleEdit">编辑</el-button>
                    <el-button type="danger" size="small" plain @click="handleTriggerUnbind">解绑</el-button>
                </div>
            </div>

            <el-tabs v-model="activeTab" class="detail-tabs">
                <el-tab-pane label="基础信息" name="basic">
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="产品名称">{{ device.productName || '未知产品' }}</el-descriptions-item>
                        <el-descriptions-item label="设备ID">{{ device.id }}</el-descriptions-item>
                        <el-descriptions-item label="固件版本">{{ device.firmwareVersion || 'v1.0.0'
                        }}</el-descriptions-item>
                        <el-descriptions-item label="所属区域">{{ device.dataCenter || 'CN' }}</el-descriptions-item>
                        <el-descriptions-item label="激活时间">{{ formatDateTime(device.gmtActive) }}</el-descriptions-item>
                        <el-descriptions-item label="最后在线">{{ formatDateTime(device.gmtLastOnline)
                        }}</el-descriptions-item>
                    </el-descriptions>

                    <div class="mt-4">
                        <h4 class="section-title">标签信息</h4>
                        <div class="tags-wrapper">
                            <el-tag v-for="tag in mockTags" :key="tag" class="mr-2 mb-2" size="small">{{ tag }}</el-tag>
                            <el-button size="small" icon="Plus" circle class="mb-2"></el-button>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="运行状态" name="status">
                    <div class="status-grid">
                        <div class="status-item">
                            <div class="label">CPU使用率</div>
                            <el-progress type="dashboard" :percentage="45" :width="80" status="success" />
                        </div>
                        <div class="status-item">
                            <div class="label">内存占用</div>
                            <el-progress type="dashboard" :percentage="72" :width="80" status="warning" />
                        </div>
                        <div class="status-item">
                            <div class="label">信号强度</div>
                            <div class="signal-bars">
                                <div class="bar active"></div>
                                <div class="bar active"></div>
                                <div class="bar active"></div>
                                <div class="bar"></div>
                            </div>
                            <span class="value-text">-65 dBm</span>
                        </div>
                        <div class="status-item">
                            <div class="label">运行时间</div>
                            <span class="value-text highlight">12天 5小时</span>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="最近日志" name="logs">
                    <el-empty v-if="!mockLogs.length" description="暂无日志" />
                    <el-timeline v-else>
                        <el-timeline-item v-for="(log, index) in mockLogs" :key="index" :type="log.type"
                            :timestamp="log.timestamp">
                            {{ log.content }}
                        </el-timeline-item>
                    </el-timeline>
                    <div class="text-center mt-4">
                        <el-button link type="primary" @click="goToFullLogs">查看完整日志 >></el-button>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>

        <div v-else class="loading-placeholder">
            <el-skeleton :rows="10" animated />
        </div>
        <DeviceUnbindDialog v-model="unbindDialogVisible" :device="device" @success="handleUnbindSuccess" />
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Monitor, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Device } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import DeviceUnbindDialog from '@/components/DeviceUnbindDialog.vue'
// --- Props & Emits ---
const props = defineProps<{
    modelValue: boolean
    device: Device | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void
    (e: 'refresh'): void
}>()

const router = useRouter()
const activeTab = ref('basic')

// --- Mock Data ---
const mockTags = ['智能网关', '测试设备', '杭州机房']
const mockLogs = [
    { timestamp: '2023-11-20 10:23:12', content: '设备上线', type: 'success' },
    { timestamp: '2023-11-20 09:15:00', content: '固件升级成功 v1.0.0 -> v1.0.1', type: 'primary' },
    { timestamp: '2023-11-19 23:45:11', content: '连接断开 (超时)', type: 'warning' }
]

// --- Logic ---
const getStatusType = (status: string) => {
    switch (status) {
        case '在线': return 'success'
        case '离线': return 'info'
        case '故障': return 'danger'
        default: return 'warning'
    }
}

const handleEdit = () => {
    ElMessage.info('编辑功能开发中...')
}

const handleUnbind = () => {
    ElMessageBox.confirm('确定要解绑该设备吗？', '警告', {
        type: 'warning'
    }).then(() => {
        ElMessage.success('解绑成功')
        emit('update:modelValue', false)
        emit('refresh')
    })
}
// 解绑状态
const unbindDialogVisible = ref(false)

// 触发解绑
const handleTriggerUnbind = () => {
    unbindDialogVisible.value = true
}

// 解绑成功回调
const handleUnbindSuccess = () => {
    // 关闭抽屉
    emit('update:modelValue', false)
    // 通知父组件刷新列表
    emit('refresh')
}
const goToFullLogs = () => {
    if (props.device) {
        router.push({
            name: 'device-log',
            query: {
                id: props.device.id,
                name: props.device.name
            }
        })
    }
}
</script>

<style scoped>
.drawer-header {
    display: flex;
    align-items: center;
}

.drawer-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-right: 12px;
}

/* 顶部 Hero 区域 */
.hero-section {
    display: flex;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 12px;
    margin-bottom: 24px;
}

.device-icon {
    width: 64px;
    height: 64px;
    background-color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    margin-right: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.hero-info {
    flex: 1;
}

.device-name {
    margin: 0 0 4px 0;
    font-size: 18px;
    color: #1e293b;
}

.device-sn {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    font-family: monospace;
}

.hero-actions {
    display: flex;
    gap: 8px;
}

/* 详情内容区 */
.section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 16px 0 12px;
    color: #303133;
}

.tags-wrapper {
    display: flex;
    flex-wrap: wrap;
}

.ml-2 {
    margin-left: 8px;
}

.mr-2 {
    margin-right: 8px;
}

.mb-2 {
    margin-bottom: 8px;
}

.mt-4 {
    margin-top: 16px;
}

.text-center {
    text-align: center;
}

/* 运行状态 Grid */
.status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 10px 0;
}

.status-item {
    background-color: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.status-item .label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
}

.status-item .value-text {
    font-size: 16px;
    font-weight: 600;
    color: #334155;
}

.status-item .highlight {
    color: var(--color-primary);
}

/* 信号条样式 */
.signal-bars {
    display: flex;
    gap: 3px;
    align-items: flex-end;
    height: 24px;
    margin-bottom: 4px;
}

.signal-bars .bar {
    width: 4px;
    background-color: #cbd5e1;
    border-radius: 2px;
}

.signal-bars .bar:nth-child(1) {
    height: 6px;
}

.signal-bars .bar:nth-child(2) {
    height: 12px;
}

.signal-bars .bar:nth-child(3) {
    height: 18px;
}

.signal-bars .bar:nth-child(4) {
    height: 24px;
}

.signal-bars .bar.active {
    background-color: #10b981;
    /* Green */
}
</style>