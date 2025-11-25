<template>
    <el-row :gutter="20" class="mb-6">
        <el-col :xs="24" :sm="8">
            <StatCard label="设备总数" :value="summary.total" :icon-component="Monitor" color-theme="blue" />
        </el-col>
        <el-col :xs="24" :sm="8">
            <StatCard label="在线设备" :value="summary.online" :icon-component="Connection" color-theme="green" />
        </el-col>
        <el-col :xs="24" :sm="8">
            <StatCard label="异常/故障" :value="summary.total - summary.activated" :icon-component="Warning"
                color-theme="orange" />
        </el-col>
    </el-row>
</template>

<script setup lang="ts">
import { Monitor, Connection, Warning } from '@element-plus/icons-vue'
import StatCard from '@/components/StatCard.vue'

// 定义 Props 类型
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
.mb-6 {
    margin-bottom: 24px;
}
</style>