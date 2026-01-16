<template>
    <div class="table-wrapper">
        <el-table ref="tableRef" v-loading="loading" :data="deviceList" style="width: 100%" class="modern-table"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />

            <el-table-column label="设备名称" min-width="180">
                <template #default="{ row }">
                    <div class="device-name-cell">
                        <span class="name-text" @click="emits('open-detail', row)">{{ row.name }}</span>
                        <el-tag v-if="row.hasNewFirmware" size="small" type="danger" effect="plain"
                            class="ml-2">Update</el-tag>
                    </div>
                    <div class="sn-text">{{ row.sn }}</div>
                </template>
            </el-table-column>

            <el-table-column label="状态" width="140">
                <template #default="{ row }">
                    <StatusBadge :label="row.status === 'online' ? '在线' : '离线'" :type="getStatusType(row.status)" />
                </template>
            </el-table-column>

            <el-table-column label="产品信息" min-width="150">
                <template #default="{ row }">
                    <div>{{ row.productName }}</div>
                    <div class="text-xs text-gray-400">{{ row.productId }}</div>
                </template>
            </el-table-column>

            <el-table-column prop="region" label="数据中心" width="120" />

            <el-table-column label="活跃时间" min-width="200">
                <template #default="{ row }">
                    <div class="text-xs">
                        <div>首: {{ row.gmtActive }}</div>
                        <div :class="{ 'text-gray-300': row.status !== 'online' }">近: {{ row.gmtLastOnline }}</div>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="emits('view-logs', row)">日志</el-button>
                    <el-button link type="primary" @click="emits('open-detail', row)">详情</el-button>
                    <el-button link type="danger" @click="emits('unbind', row)">解绑</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-wrapper" v-if="pagination.total > 0">
            <el-pagination :current-page="pagination.currentPage" :page-size="pagination.pageSize"
                :total="pagination.total" :page-sizes="[10, 20, 50, 100]" background
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="(val: number) => emits('size-change', val)"
                @current-change="(val: number) => emits('page-change', val)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElTable } from 'element-plus'
import type { Device } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'

// Props
defineProps<{
    deviceList: Device[];
    loading: boolean;
    pagination: {
        currentPage: number;
        pageSize: number;
        total: number;
    };
}>()

// Emits
const emits = defineEmits<{
    (e: 'selection-change', rows: Device[]): void
    (e: 'page-change', page: number): void
    (e: 'size-change', size: number): void
    (e: 'open-detail', row: Device): void
    (e: 'unbind', row: Device): void
    (e: 'view-logs', row: Device): void
}>()

// Refs
const tableRef = ref<InstanceType<typeof ElTable>>()

// Methods
// 核心修复：显式定义函数，确保模板可访问
const handleSelectionChange = (rows: Device[]) => {
    emits('selection-change', rows)
}

const clearSelection = () => {
    tableRef.value?.clearSelection()
}

// 暴露给父组件
defineExpose({
    clearSelection
})

// 样式映射
const getStatusType = (status: string) => {
    if (status === 'online') return 'success'
    return 'info'
}
</script>

<style scoped>
.modern-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}

.modern-table :deep(.el-table__row) {
    height: 72px;
}

.device-name-cell {
    display: flex;
    align-items: center;
}

.name-text {
    font-weight: 600;
    color: var(--el-color-primary);
    cursor: pointer;
}

.sn-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
    margin-top: 4px;
}

.ml-2 {
    margin-left: 8px;
}

.text-xs {
    font-size: 12px;
    line-height: 1.4;
}

.text-gray-400 {
    color: #9ca3af;
}

.text-gray-300 {
    color: #d1d5db;
}

.pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
    margin-top: 8px;
}
</style>