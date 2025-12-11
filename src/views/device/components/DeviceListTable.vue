<template>
    <div class="table-wrapper">
        <el-table ref="tableRef" v-loading="loading" :data="deviceList" style="width: 100%"
            @selection-change="handleSelectionChange" class="modern-table">
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
                    <StatusBadge :label="row.status" :type="getStatusType(row.status)" />
                </template>
            </el-table-column>

            <el-table-column prop="productInfo" label="产品信息" min-width="150" />
            <el-table-column prop="dataCenter" label="数据中心" width="120" />
            <el-table-column prop="gmtLastOnline" label="最后在线" width="180" />

            <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="emits('view-logs', row)">查看</el-button>
                    <el-button link type="primary" @click="emits('open-detail', row)">详情</el-button>
                    <el-button link type="danger" @click="emits('unbind', row)">解绑</el-button>
                </template>
            </el-table-column>
        </el-table>

        <AppPagination :total="pagination.total" :current-page="pagination.currentPage" :page-size="pagination.pageSize"
            @update:currentPage="(val) => emits('page-change', val)"
            @update:pageSize="(val) => emits('size-change', val)" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElTable } from 'element-plus'
import type { Device } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue' // 引入新组件
import AppPagination from '@/components/AppPagination.vue' // 引入已有组件

defineProps<{
    deviceList: Device[];
    loading: boolean;
    pagination: {
        currentPage: number;
        pageSize: number;
        total: number;
    };
}>()

const emits = defineEmits<{
    (e: 'selection-change', rows: Device[]): void
    (e: 'page-change', page: number): void
    (e: 'size-change', size: number): void
    (e: 'open-detail', row: Device): void
    (e: 'unbind', row: Device): void
    (e: 'view-logs', row: Device): void
}>()

const tableRef = ref<InstanceType<typeof ElTable>>()

const clearSelection = () => {
    tableRef.value?.clearSelection()
}

const handleSelectionChange = (rows: Device[]) => {
    emits('selection-change', rows)
}

defineExpose({
    clearSelection
})

// 纯逻辑函数：将业务状态映射为 UI 类型
const getStatusType = (status: string) => {
    switch (status) {
        case '在线': return 'success'
        case '离线': return 'info' // 或 'default'
        case '故障': return 'danger'
        case '升级中': return 'primary'
        default: return 'default'
    }
}

</script>

<style scoped>
/* 表格基础样式微调 */
.modern-table :deep(.el-table__inner-wrapper::before) {
    display: none;
    /* 去除表格底部白线 */
}

.modern-table :deep(.el-table__row) {
    height: 72px;
    /* 稍微增加行高，容纳 StatusBadge，更具现代感 */
}

.device-name-cell {
    display: flex;
    align-items: center;
}

.name-text {
    font-weight: 600;
    color: var(--el-color-primary);
    cursor: pointer;
    transition: color 0.2s;
}

.name-text:hover {
    color: var(--el-color-primary-dark-2);
    text-decoration: underline;
}

.sn-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
    /* SN 码建议用等宽字体 */
    margin-top: 4px;
}

.ml-2 {
    margin-left: 8px;
}

/* ❌ 删除了原本几百行的 .status-capsule 及其颜色定义 
   现在由 StatusBadge 组件统一管理
*/

/* ❌ 删除了 .pagination-bar 及其深层样式
   现在由 AppPagination 组件统一管理
*/
</style>