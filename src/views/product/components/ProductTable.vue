<template>
    <div class="table-container card-base">
        <el-table :data="products" style="width: 100%"
            :header-cell-style="{ background: 'var(--bg-canvas)', color: 'var(--text-secondary)', fontWeight: '600' }"
            row-class-name="product-row" @row-click="handleManage">
            <el-table-column label="产品名称" min-width="260">
                <template #default="{ row }">
                    <div class="flex items-center gap-4 py-2">
                        <div class="icon-box" :class="getCategoryClass(row.category)">
                            <el-icon size="20">
                                <component :is="getIcon(row.category)" />
                            </el-icon>
                        </div>

                        <div class="flex flex-col">
                            <span class="product-name">{{ row.name }}</span>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="pid-badge">PID: {{ row.id }}</span>
                                <el-tag size="small" type="info" effect="plain" class="scale-90 origin-left">
                                    {{ row.category }}
                                </el-tag>
                            </div>
                        </div>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="protocol" label="通讯协议" width="140">
                <template #default="{ row }">
                    <div class="flex items-center gap-1.5 text-sm text-[var(--text-regular)]">
                        <el-icon class="text-[var(--text-secondary)]">
                            <Connection />
                        </el-icon>
                        {{ row.protocol }}
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                    <div class="flex items-center gap-2">
                        <div class="status-dot" :class="getStatusDotClass(row.status)"></div>
                        <span class="text-sm font-medium" :class="getStatusTextClass(row.status)">
                            {{ row.status }}
                        </span>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="activeDeviceCount" label="在线设备" width="140" align="right">
                <template #default="{ row }">
                    <span class="font-mono font-bold text-[var(--text-primary)]">
                        {{ row.activeDeviceCount?.toLocaleString() || 0 }}
                    </span>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="220" align="right" fixed="right">
                <template #default="{ row }">
                    <div class="actions-group" @click.stop>

                        <el-tooltip content="功能定义 / 物模型" placement="top">
                            <el-button link type="primary" @click="emit('develop', row.id)">
                                <el-icon class="mr-1">
                                    <Tools />
                                </el-icon> 开发
                            </el-button>
                        </el-tooltip>

                        <el-divider direction="vertical" />

                        <el-button link type="primary" @click="emit('manage', row.id)">
                            管理
                        </el-button>

                        <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                            <el-button link
                                class="ml-2 !text-[var(--text-secondary)] hover:!text-[var(--text-primary)]">
                                <el-icon>
                                    <MoreFilled />
                                </el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="firmware">固件升级</el-dropdown-item>
                                    <el-dropdown-item command="debug">在线调试</el-dropdown-item>
                                    <el-dropdown-item command="delete" divided
                                        class="text-danger">删除产品</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>

                    </div>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script setup lang="ts">
import {
    Tools, Connection, MoreFilled,
    Sunny, Odometer, Cpu, Box, Lock, Switch
} from '@element-plus/icons-vue';
import type { ProductListItem, DeviceType } from '@/types/product';

defineProps<{ products: ProductListItem[] }>();
const emit = defineEmits(['manage', 'develop', 'delete']);

// 交互处理
const handleManage = (row: ProductListItem) => {
    emit('manage', row.id);
};

const handleCommand = (cmd: string, row: ProductListItem) => {
    if (cmd === 'delete') {
        emit('delete', row.id);
    } else if (cmd === 'firmware') {
        // 预留：跳转固件
        emit('manage', row.id); // 暂时跳管理，应带参数 tab=firmware
    }
};

// --- 视觉辅助函数 ---

const getIcon = (cat: DeviceType) => {
    const map: any = { 'LIGHT': Sunny, 'SENSOR': Odometer, 'GATEWAY': Cpu, 'LOCK': Lock, 'SWITCH': Switch };
    return map[cat] || Box;
};

const getCategoryClass = (cat: DeviceType) => {
    const map: Record<string, string> = {
        'LIGHT': 'bg-orange-50 text-orange-500',
        'SENSOR': 'bg-blue-50 text-blue-500',
        'GATEWAY': 'bg-purple-50 text-purple-500',
        'LOCK': 'bg-teal-50 text-teal-500',
        'SWITCH': 'bg-indigo-50 text-indigo-500'
    };
    return map[cat] || 'bg-gray-100 text-gray-500';
};

const getStatusDotClass = (status: string) => {
    if (status === 'RELEASED') return 'bg-success';
    if (status === 'ALERT') return 'bg-danger';
    return 'bg-warning'; // DEVELOPMENT
};

const getStatusTextClass = (status: string) => {
    if (status === 'RELEASED') return 'text-success';
    if (status === 'ALERT') return 'text-danger';
    return 'text-warning';
};
</script>

<style scoped>
/* 容器 */
.table-container {
    overflow: hidden;
    /* 圆角溢出处理 */
    border-radius: 12px;
    background-color: var(--bg-card);
    border: 1px solid var(--border-base);
}

/* 图标容器 */
.icon-box {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    transition: transform 0.2s;
    /* 默认背景，会被动态 class 覆盖 */
    background-color: var(--bg-canvas);
}

/* 颜色原子类模拟 (如果项目没有 Tailwind) */
.bg-orange-50 {
    background-color: rgba(255, 165, 0, 0.1);
    color: #ff9800;
}

.bg-blue-50 {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.bg-purple-50 {
    background-color: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
}

.bg-teal-50 {
    background-color: rgba(20, 184, 166, 0.1);
    color: #14b8a6;
}

.bg-indigo-50 {
    background-color: rgba(99, 102, 241, 0.1);
    color: #6366f1;
}

.bg-gray-100 {
    background-color: var(--bg-canvas);
    color: var(--text-secondary);
}

/* 文本样式 */
.product-name {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 15px;
    line-height: 1.2;
}

.pid-badge {
    font-family: monospace;
    font-size: 12px;
    color: var(--text-secondary);
    background-color: var(--bg-canvas);
    padding: 1px 6px;
    border-radius: 4px;
}

/* 状态样式 */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.bg-success {
    background-color: var(--el-color-success);
}

.bg-warning {
    background-color: var(--el-color-warning);
}

.bg-danger {
    background-color: var(--el-color-danger);
}

.text-success {
    color: var(--el-color-success);
}

.text-warning {
    color: var(--el-color-warning);
}

.text-danger {
    color: var(--el-color-danger);
}

/* 行交互 */
:deep(.product-row) {
    cursor: pointer;
    transition: all 0.2s;
}

:deep(.product-row:hover) {
    background-color: var(--bg-canvas) !important;
}

:deep(.product-row:hover) .icon-box {
    transform: scale(1.05);
}

/* 更多操作按钮 */
.text-danger {
    color: var(--el-color-danger);
}
</style>