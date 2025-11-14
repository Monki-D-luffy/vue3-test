<template>
    <el-drawer v-model="visible" :title="device?.name || '设备详情'" direction="rtl" size="480px" destroy-on-close
        class="modern-drawer">
        <template #header>
            <div class="drawer-header">
                <h3 class="drawer-title">{{ device?.name }}</h3>
                <el-tag :type="getStatusType(device?.status)" effect="dark" class="status-tag">
                    {{ device?.status }}
                </el-tag>
            </div>
        </template>

        <div class="drawer-content" v-if="device">
            <div class="info-section">
                <h4 class="section-title">基础信息</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <label>序列号 (SN)</label>
                        <span>{{ device.sn }}</span>
                    </div>
                    <div class="info-item">
                        <label>产品类型</label>
                        <span>{{ device.productInfo }}</span>
                    </div>
                    <div class="info-item">
                        <label>数据中心</label>
                        <span>{{ device.dataCenter }}</span>
                    </div>
                    <div class="info-item">
                        <label>固件版本</label>
                        <span>v{{ device.firmwareVersion }}</span>
                    </div>
                </div>
            </div>

            <el-divider />

            <div class="info-section">
                <h4 class="section-title">最近活动</h4>
                <el-timeline style="padding-left: 4px;">
                    <el-timeline-item v-for="(activity, index) in activities" :key="index" :type="activity.type"
                        :timestamp="activity.timestamp" :hollow="index === 0">
                        {{ activity.content }}
                    </el-timeline-item>
                </el-timeline>
            </div>
        </div>

        <template #footer>
            <div class="drawer-footer">
                <el-button @click="close">关闭</el-button>
                <el-button type="primary">远程重启</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Device } from '@/types'

const props = defineProps<{
    modelValue: boolean
    device: Device | null
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const close = () => {
    visible.value = false
}

const getStatusType = (status?: string) => {
    switch (status) {
        case '在线': return 'success'
        case '离线': return 'info'
        case '故障': return 'danger'
        default: return 'warning'
    }
}

// Mock 数据：实际项目中可通过 API 获取
const activities = [
    { content: '设备上线', timestamp: '2025-11-14 10:23:00', type: 'success' },
    { content: '上报温湿度数据', timestamp: '2025-11-14 09:15:00', type: 'primary' },
    { content: '固件升级完成 (v1.0.1)', timestamp: '2025-11-13 18:00:00', type: 'info' }
]
</script>

<style scoped>
.drawer-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.drawer-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.info-section {
    margin-bottom: 24px;
}

.section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16px;
    border-left: 4px solid var(--color-primary);
    padding-left: 8px;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.info-item {
    display: flex;
    flex-direction: column;
}

.info-item label {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.info-item span {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
}

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>