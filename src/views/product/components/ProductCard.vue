<template>
    <div class="product-card">
        <div class="card-header">
            <div class="header-top">
                <div class="icon-box" :class="getCategoryClass(product.category)">
                    <el-icon size="24">
                        <component :is="getIcon(product.category)" />
                    </el-icon>
                </div>
                <div class="status-badge" :class="getStatusClass(product.status)">
                    <div class="status-dot"></div>
                    {{ product.status }}
                </div>
            </div>

            <h3 class="product-name text-ellipsis">{{ product.name }}</h3>
            <div class="product-pid">PID: {{ product.id }}</div>
        </div>

        <div class="card-body">
            <el-row :gutter="8">
                <el-col :span="12">
                    <div class="info-item">
                        <span class="label">品类</span>
                        <span class="value">{{ product.category }}</span>
                    </div>
                </el-col>
                <el-col :span="12">
                    <div class="info-item">
                        <span class="label">协议</span>
                        <span class="value">
                            <el-icon class="mr-1 text-[var(--text-secondary)]">
                                <Connection />
                            </el-icon>
                            {{ product.protocol }}
                        </span>
                    </div>
                </el-col>
                <el-col :span="24" class="mt-3">
                    <div class="info-item">
                        <span class="label">在线设备</span>
                        <span class="value font-mono text-lg">{{ product.activeDeviceCount?.toLocaleString() || 0
                            }}</span>
                    </div>
                </el-col>
            </el-row>
        </div>

        <div class="card-footer">
            <el-tooltip content="直达功能定义" placement="top">
                <el-button link class="action-btn-icon" @click.stop="emit('develop', product.id)">
                    <el-icon>
                        <Tools />
                    </el-icon>
                </el-button>
            </el-tooltip>

            <el-divider direction="vertical" />

            <el-button type="primary" plain round size="small" class="main-action-btn"
                @click.stop="emit('manage', product.id)">
                进入控制台
                <el-icon class="ml-1">
                    <ArrowRight />
                </el-icon>
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    Connection, Tools, ArrowRight,
    Sunny, Odometer, Cpu, Box, Lock, Switch
} from '@element-plus/icons-vue';
import type { ProductListItem, DeviceType } from '@/types/product';

defineProps<{ product: ProductListItem }>();
// 定义两个明确的事件
const emit = defineEmits(['manage', 'develop']);

// --- 视觉辅助函数 (与 Table 保持一致) ---

const getIcon = (cat: DeviceType) => {
    const map: any = { 'LIGHT': Sunny, 'SENSOR': Odometer, 'GATEWAY': Cpu, 'LOCK': Lock, 'SWITCH': Switch };
    return map[cat] || Box;
};

// 使用 CSS 变量或固定色值
const getCategoryClass = (cat: DeviceType) => {
    const map: Record<string, string> = {
        'LIGHT': 'style-orange',
        'SENSOR': 'style-blue',
        'GATEWAY': 'style-purple',
        'LOCK': 'style-teal',
        'SWITCH': 'style-indigo'
    };
    return map[cat] || 'style-gray';
};

const getStatusClass = (status: string) => {
    if (status === 'RELEASED') return 'status-success';
    if (status === 'ALERT') return 'status-danger';
    return 'status-warning';
};
</script>

<style scoped>
.product-card {
    background-color: var(--bg-card);
    border: 1px solid var(--border-base);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

/* 悬浮效果：上浮并增强阴影 */
.product-card:hover {
    transform: translateY(-4px);
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

/* --- 头部 --- */
.header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.icon-box {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s;
}

.product-card:hover .icon-box {
    transform: scale(1.1) rotate(5deg);
}

/* 类别颜色风格 */
.style-orange {
    background: rgba(255, 165, 0, 0.1);
    color: #ff9800;
}

.style-blue {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.style-purple {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
}

.style-teal {
    background: rgba(20, 184, 166, 0.1);
    color: #14b8a6;
}

.style-indigo {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
}

.style-gray {
    background: var(--bg-canvas);
    color: var(--text-secondary);
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.status-success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
}

.status-success .status-dot {
    background: var(--el-color-success);
}

.status-warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
}

.status-warning .status-dot {
    background: var(--el-color-warning);
}

.status-danger {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
}

.status-danger .status-dot {
    background: var(--el-color-danger);
}

.product-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
    line-height: 1.3;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.product-pid {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: monospace;
}

/* --- 中部指标 --- */
.card-body {
    flex: 1;
    /* 撑开高度 */
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px dashed var(--border-base);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.label {
    font-size: 12px;
    color: var(--text-secondary);
}

.value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
}

.mr-1 {
    margin-right: 4px;
}

.mt-3 {
    margin-top: 12px;
}

.font-mono {
    font-family: monospace;
}

/* --- 底部操作栏 --- */
.card-footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border-base);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
}

.action-btn-icon {
    font-size: 16px;
    color: var(--text-secondary);
    transition: color 0.2s;
}

.action-btn-icon:hover {
    color: var(--el-color-primary);
}

.main-action-btn {
    padding-left: 16px;
    padding-right: 16px;
    transition: all 0.2s;
}

.main-action-btn:hover {
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}
</style>