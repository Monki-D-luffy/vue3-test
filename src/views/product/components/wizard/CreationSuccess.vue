<template>
    <div class="success-container">
        <div class="success-icon-box">
            <el-icon :size="48">
                <CircleCheckFilled />
            </el-icon>
        </div>

        <h2 class="success-title">产品创建成功!</h2>
        <p class="success-pid">
            产品 ID (PID):
            <span class="pid-badge">{{ pid }}</span>
        </p>

        <div class="btn-group">
            <el-button type="primary" size="large" class="action-btn" @click="$emit('develop')">
                前往功能定义
            </el-button>
            <el-button size="large" class="action-btn" @click="$emit('back')">
                返回列表
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue';

defineProps<{ pid: string }>();
defineEmits(['develop', 'back']);
</script>

<style scoped>
.success-container {
    text-align: center;
    padding-top: 40px;
    padding-bottom: 20px;
}

.success-icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
    margin-bottom: 24px;
    animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.success-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16px;
}

.success-pid {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: 32px;
}

.pid-badge {
    font-family: monospace;
    font-weight: 700;
    background-color: var(--bg-canvas);
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid var(--border-base);
    color: var(--text-primary);
}

.btn-group {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.action-btn {
    padding-left: 32px;
    padding-right: 32px;
}

@keyframes bounceIn {
    0% {
        transform: scale(0);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>