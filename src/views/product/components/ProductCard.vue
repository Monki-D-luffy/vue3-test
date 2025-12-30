<template>
    <div class="product-card group relative flex flex-col bg-[var(--bg-card)] rounded-xl p-5 border border-transparent hover:border-[var(--border-base)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
        @click="$emit('enter', product.id)">
        <div class="flex justify-between items-start mb-4 relative z-10">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors duration-300"
                :class="getCategoryStyle(product.category)">
                <el-icon size="24">
                    <component :is="getIcon(product.category)" />
                </el-icon>
            </div>

            <el-tag :type="getStatusType(product.status)" effect="light" size="small" class="!border-none !font-medium">
                {{ product.status }}
            </el-tag>
        </div>

        <div class="flex-1 z-10">
            <h3
                class="text-base font-bold text-[var(--text-primary)] truncate mb-1 pr-2 group-hover:text-primary transition-colors">
                {{ product.name }}
            </h3>
            <div class="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
                <span class="bg-[var(--bg-canvas)] px-1.5 py-0.5 rounded text-[var(--text-regular)]">
                    {{ product.id }}
                </span>
                <span class="opacity-30">|</span>
                <span class="flex items-center gap-1">
                    <el-icon>
                        <Connection />
                    </el-icon> {{ product.protocol }}
                </span>
            </div>
        </div>

        <div class="mt-4 flex items-center justify-between text-xs bg-[var(--bg-canvas)] rounded-lg px-3 py-2.5 z-10">
            <div class="flex flex-col gap-0.5">
                <span class="text-[10px] text-[var(--text-secondary)]">在线设备</span>
                <span class="font-bold font-mono text-[var(--text-primary)]">
                    {{ formatNumber(product.activeDeviceCount) }}
                </span>
            </div>
            <div class="w-px h-6 bg-[var(--border-base)]"></div>
            <div class="flex flex-col items-end gap-0.5">
                <span class="text-[10px] text-[var(--text-secondary)]">固件版本</span>
                <span class="font-mono text-[var(--text-primary)]">{{ product.latestFirmware || '--' }}</span>
            </div>
        </div>

        <div
            class="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0">
        </div>
        <div
            class="absolute bottom-4 right-4 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20">
            <el-button type="primary" size="small" round class="shadow-lg shadow-primary/20"
                @click.stop="$emit('enter', product.id)">
                进入控制台
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    Sunny, Odometer, Cpu, Box, Lock, Connection
} from '@element-plus/icons-vue';
import type { ProductListItem, DeviceType, ProductStatus } from '@/types/product';

defineProps<{ product: ProductListItem }>();
defineEmits(['enter']);

// 格式化数字 (1.2k)
const formatNumber = (num: number) => {
    return num > 999 ? (num / 1000).toFixed(1) + 'k' : num;
};

// 状态映射
const getStatusType = (status: ProductStatus) => {
    const map: Record<string, string> = {
        'RELEASED': 'success',
        'ALERT': 'danger',
        'TESTING': 'warning',
        'DEVELOPMENT': 'info'
    };
    return map[status] || 'info';
};

// 品类图标映射
const getIcon = (cat: DeviceType) => {
    const map: any = { 'LIGHT': Sunny, 'SENSOR': Odometer, 'GATEWAY': Cpu, 'LOCK': Lock };
    return map[cat] || Box;
};

// 品类颜色映射 (Tailwind 类名)
const getCategoryStyle = (cat: DeviceType) => {
    const map: Record<string, string> = {
        'LIGHT': 'bg-orange-50 text-orange-500 dark:bg-orange-900/20',
        'SENSOR': 'bg-blue-50 text-blue-500 dark:bg-blue-900/20',
        'GATEWAY': 'bg-purple-50 text-purple-500 dark:bg-purple-900/20',
        'LOCK': 'bg-teal-50 text-teal-500 dark:bg-teal-900/20'
    };
    return map[cat] || 'bg-gray-50 text-gray-500 dark:bg-gray-800';
};
</script>