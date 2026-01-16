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
            <StatCard label="已绑定设备" :value="summary.boundCount" :icon-component="CircleCheck" color-theme="orange"
                class="h-full" />
        </el-col>
    </el-row>
</template>

<script setup lang="ts">
import { Monitor, Connection, CircleCheck } from '@element-plus/icons-vue' // 引入 CircleCheck
import StatCard from '@/components/StatCard.vue'

// ✨ Fix: 更新接口定义以匹配 DeviceList 传入的数据
interface SummaryData {
    total: number;
    online: number;
    boundCount: number; // 新增字段
    activated: number;
}

defineProps<{
    summary: SummaryData
}>()
</script>

<style scoped>
.stats-row {
    margin-bottom: 4px;
}

.mb-4 {
    margin-bottom: 20px;
}

.h-full {
    height: 100%;
}
</style>