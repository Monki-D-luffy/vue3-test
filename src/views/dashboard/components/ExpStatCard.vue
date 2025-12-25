<template>
    <div class="dashboard-card hover-lift flex-col justify-between" style="min-height: 140px;">
        <div class="flex-between mb-4">
            <span class="text-secondary text-sm font-medium">{{ title }}</span>
            <div class="icon-wrapper" :class="status === 'danger' ? 'is-danger' : 'is-primary'">
                <el-icon>
                    <component :is="icon" />
                </el-icon>
            </div>
        </div>

        <div class="flex items-baseline gap-2 mb-2">
            <span class="text-3xl font-bold text-primary tracking-tight">{{ value }}</span>
            <span v-if="unit" class="text-sm text-secondary">{{ unit }}</span>
        </div>

        <div class="flex items-center text-xs">
            <template v-if="trend !== undefined">
                <div class="trend-badge flex-center" :class="trend >= 0 ? 'trend-up' : 'trend-down'">
                    <el-icon v-if="trend >= 0">
                        <Top />
                    </el-icon>
                    <el-icon v-else>
                        <Bottom />
                    </el-icon>
                    {{ Math.abs(trend) }}%
                </div>
                <span class="ml-2 text-secondary">较昨日</span>
            </template>

            <template v-else-if="subText">
                <span :class="{ 'text-danger': isDanger, 'text-secondary': !isDanger }">
                    {{ subText }}
                </span>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    value: number | string;
    icon: string;
    unit?: string;
    trend?: number; // 可选
    subText?: string;
    status?: 'normal' | 'danger';
    isDanger?: boolean;
}>();
</script>

<style scoped>
.text-primary {
    color: var(--text-primary);
}

.text-secondary {
    color: var(--text-secondary);
}

.text-danger {
    color: var(--color-danger);
}

.icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.icon-wrapper.is-primary {
    background-color: var(--color-blue-50);
    color: var(--color-blue-600);
}

.icon-wrapper.is-danger {
    background-color: var(--color-danger-bg);
    color: var(--color-danger);
}

.trend-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    gap: 2px;
}

.trend-up {
    background-color: var(--color-success-bg);
    color: var(--color-success);
}

.trend-down {
    background-color: var(--color-danger-bg);
    color: var(--color-danger);
}
</style>