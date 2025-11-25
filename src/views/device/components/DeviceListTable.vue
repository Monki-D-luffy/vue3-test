<template>
    <div class="table-document-flow">
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

            <el-table-column label="状态" width="120">
                <template #default="{ row }">
                    <span class="status-capsule" :class="getStatusClass(row.status)">
                        <span class="dot"></span>
                        {{ row.status }}
                    </span>
                </template>
            </el-table-column>

            <el-table-column prop="productInfo" label="产品信息" min-width="150" />
            <el-table-column prop="dataCenter" label="区域" width="100" />
            <el-table-column prop="gmtLastOnline" label="最后在线" width="180" />

            <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" @click="emits('open-detail', row)">详情</el-button>
                    <el-button link type="danger" @click="emits('unbind', row)">解绑</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-bar">
            <el-pagination :current-page="pagination.currentPage" :page-size="pagination.pageSize"
                :total="pagination.total" :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper" @size-change="(val) => emits('size-change', val)"
                @current-change="(val) => emits('page-change', val)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElTable } from 'element-plus'
import type { Device } from '@/types'

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
}>()

const tableRef = ref<InstanceType<typeof ElTable>>()

const clearSelection = () => { tableRef.value?.clearSelection() }
const handleSelectionChange = (rows: Device[]) => { emits('selection-change', rows) }

defineExpose({ clearSelection })

const getStatusClass = (status: string) => {
    switch (status) {
        case '在线': return 'status-online'
        case '离线': return 'status-offline'
        case '故障': return 'status-error'
        default: return 'status-default'
    }
}
</script>

<style scoped>
/* 移除表格底部的横线 */
.modern-table :deep(.el-table__inner-wrapper::before) {
    display: none;
}

.modern-table :deep(.el-table__row) {
    height: 64px;
}

.device-name-cell {
    display: flex;
    align-items: center;
}

.name-text {
    font-weight: 600;
    color: var(--color-primary, #409eff);
    cursor: pointer;
}

.sn-text {
    font-size: 12px;
    color: var(--text-secondary, #909399);
    margin-top: 2px;
}

.ml-2 {
    margin-left: 8px;
}

/* 状态样式 */
.status-capsule {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 500;
}

.status-capsule .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

.status-online {
    background-color: #ecfdf5;
    color: #059669;
}

.status-online .dot {
    background-color: #059669;
}

.status-offline {
    background-color: #f1f5f9;
    color: #64748b;
}

.status-offline .dot {
    background-color: #94a3b8;
}

.status-error {
    background-color: #fef2f2;
    color: #dc2626;
}

.status-error .dot {
    background-color: #dc2626;
}

/* 分页栏样式：
   确保有足够的上边距，并且是一个普通的 block 元素，
   这样它会乖乖待在表格被撑开后的最底部。
*/
.pagination-bar {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    padding: 10px 0;
}
</style>