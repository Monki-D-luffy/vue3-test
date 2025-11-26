<template>
    <el-row :gutter="20" class="stats-row">
        <el-col :xs="24" :sm="8" class="mb-4">
            <StatCard label="设备总数" :value="summary.total" :icon-component="Monitor" color-theme="blue" class="h-full" />
        </el-col>
        <el-col :xs="24" :sm="8" class="mb-4">
            <StatCard label="在线设备" :value="summary.online" :icon-component="Connection" color-theme="green"
                class="h-full" />
        </el-col>
        <el-col :xs="24" :sm="8" class="mb-4">
            <StatCard label="异常/故障" :value="summary.total - summary.activated" :icon-component="Warning"
                color-theme="orange" class="h-full" />
        </el-col>
    </el-row>
</template>

<script setup lang="ts">
import { Monitor, Connection, Warning } from '@element-plus/icons-vue'
import StatCard from '@/components/StatCard.vue'

interface SummaryData {
    total: number;
    online: number;
    activated: number;
}

defineProps<{
    summary: SummaryData
}>()
</script>

<style scoped>
.stats-row {
    margin-bottom: 4px;
    /* 调整底部总间距 */
}

.mb-4 {
    margin-bottom: 20px;
    /* 每一列的底部间距，处理换行情况 */
}

/* 确保卡片高度拉伸一致 */
.h-full {
    height: 100%;
}
</style>