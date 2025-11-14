<template>
    <div class="exp-panel">
        <div class="panel-toolbar">
            <div class="left-tip">
                <el-icon class="info-icon">
                    <InfoFilled />
                </el-icon>
                <span>仅“验证通过”的固件可推送 (共 {{ pagination.total }} 个版本)</span>
            </div>
            <div class="right-action">
                <el-button type="primary" class="tech-btn" @click="isUploadVisible = true">
                    <el-icon class="mr-1">
                        <Upload />
                    </el-icon>
                    上传新版本
                </el-button>
            </div>
        </div>

        <div class="table-container">
            <el-table :data="firmwareList" v-loading="loading" style="width: 100%" :header-cell-style="headerStyle"
                :row-class-name="tableRowClassName">
                <el-table-column label="版本号" min-width="140">
                    <template #default="{ row, $index }">
                        <div class="version-wrapper">
                            <span class="version-code">{{ row.version }}</span>
                            <span v-if="$index === 0 && pagination.currentPage === 1" class="latest-badge">NEW</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="发布时间" width="180">
                    <template #default="{ row }">
                        <span class="time-text">{{ formatDateTime(row.uploadedAt) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="140">
                    <template #default="{ row }">
                        <div class="status-dot-wrapper" :class="row.verified ? 'is-success' : 'is-pending'">
                            <div class="dot"></div>
                            <span class="status-text">{{ row.verified ? '已验证' : '待验证' }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="发布说明" min-width="240">
                    <template #default="{ row }">
                        <div class="note-content" :title="row.releaseNotes">
                            {{ row.releaseNotes }}
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="160" align="right" fixed="right">
                    <template #default="{ row }">
                        <div class="actions">
                            <el-tooltip content="通过验证" placement="top" v-if="!row.verified">
                                <el-button circle size="small" type="success" plain class="action-btn verify-btn"
                                    @click="openVerifyDialog(row)">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                </el-button>
                            </el-tooltip>
                            <span v-else class="verified-mark"><el-icon><Select /></el-icon></span>

                            <el-tooltip content="删除版本" placement="top">
                                <el-button circle size="small" type="danger" plain class="action-btn delete-btn"
                                    @click="openDeleteDialog(row)">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                </el-button>
                            </el-tooltip>
                        </div>
                    </template>
                </el-table-column>

                <template #empty>
                    <el-empty description="暂无固件版本" :image-size="80" />
                </template>
            </el-table>
        </div>

        <div class="pagination-wrapper" v-if="pagination.total > 0">
            <AppPagination :total="pagination.total" v-model:current-page="pagination.currentPage"
                v-model:page-size="pagination.pageSize" @size-change="onPageChange" @current-change="onPageChange" />
        </div>

        <ExpFirmwareVerifyModal v-model="isVerifyVisible" :firmware="currentVerifyRow" @success="refreshData" />
        <ExpFirmwareDeleteModal v-model="isDeleteVisible" :firmware="currentDeleteRow" @success="refreshData" />
        <ExpFirmwareUploadWizard v-model="isUploadVisible" :product="product" @success="refreshData" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Upload, InfoFilled, Check, Delete, Select } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import AppPagination from '@/components/AppPagination.vue'

import ExpFirmwareUploadWizard from './ExpFirmwareUploadWizard.vue'
import ExpFirmwareVerifyModal from './ExpFirmwareVerifyModal.vue'
import ExpFirmwareDeleteModal from './ExpFirmwareDeleteModal.vue'

const props = defineProps<{
    product: Product
}>()

const isUploadVisible = ref(false)
const isVerifyVisible = ref(false)
const isDeleteVisible = ref(false)
const currentVerifyRow = ref<any>(null)
const currentDeleteRow = ref<any>(null)

const {
    loading,
    firmwareList,
    pagination,
    getFirmwares,
    handlePaginationChange
} = useFirmwareManagement()

const refreshData = () => {
    if (props.product?.id) {
        getFirmwares(props.product.id)
    }
}

const onPageChange = () => {
    if (props.product?.id) {
        handlePaginationChange(props.product.id)
    }
}

watch(() => props.product.id, () => {
    pagination.currentPage = 1
    refreshData()
}, { immediate: true })

const openVerifyDialog = (row: any) => {
    currentVerifyRow.value = row
    isVerifyVisible.value = true
}

const openDeleteDialog = (row: any) => {
    currentDeleteRow.value = row
    isDeleteVisible.value = true
}

// ✨ 修改：使用 CSS 变量
const headerStyle = {
    background: 'var(--bg-hover)', // 替换 #f8fafc
    color: 'var(--text-secondary)', // 替换 #64748b
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: '1px solid var(--border-color)' // 替换 #e2e8f0
}
const tableRowClassName = () => 'modern-row'
</script>

<style scoped>
.exp-panel {
    display: flex;
    flex-direction: column;
    padding: 16px 24px;
}

.panel-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.left-tip {
    display: flex;
    align-items: center;
    color: var(--text-placeholder);
    /* 替换 #94a3b8 */
    font-size: 13px;
    background: var(--bg-hover);
    /* 替换 #f1f5f9 */
    padding: 6px 12px;
    border-radius: 20px;
}

.info-icon {
    margin-right: 6px;
}

.tech-btn {
    background: linear-gradient(135deg, var(--color-primary) 0%, #2563eb 100%);
    border: none;
    border-radius: 8px;
    padding: 9px 18px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transition: all 0.2s;
}

.tech-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.table-container {
    border-radius: 8px;
    display: flex;
    flex-direction: column;
}

.pagination-wrapper {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    padding-bottom: 10px;
}

.version-wrapper {
    display: flex;
    align-items: center;
}

.version-code {
    font-family: 'JetBrains Mono', 'Monaco', monospace;
    font-weight: 600;
    color: var(--text-primary);
    /* 替换 #0f172a */
    font-size: 14px;
}

.latest-badge {
    margin-left: 8px;
    font-size: 10px;
    background: #fee2e2;
    color: var(--color-danger);
    /* 替换 #ef4444 */
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
}

.time-text {
    color: var(--text-secondary);
    /* 替换 #64748b */
    font-size: 13px;
}

.status-dot-wrapper {
    display: flex;
    align-items: center;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    position: relative;
}

.status-dot-wrapper.is-success .dot {
    background-color: var(--color-success);
    /* 替换 #10b981 */
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-dot-wrapper.is-success .status-text {
    color: #059669;
}

.status-dot-wrapper.is-pending .dot {
    background-color: var(--color-warning);
    /* 替换 #f59e0b */
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.status-dot-wrapper.is-pending .status-text {
    color: #d97706;
}

.status-text {
    font-size: 13px;
    font-weight: 500;
}

.note-content {
    color: var(--text-primary);
    /* 替换 #334155 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90%;
}

.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
}

.action-btn {
    border: none;
    transition: all 0.2s;
}

.verify-btn:hover {
    background-color: #dcfce7;
    color: #16a34a;
}

.delete-btn:hover {
    background-color: #fee2e2;
    color: var(--color-danger);
    /* 替换 #dc2626 */
}

.verified-mark {
    color: var(--text-placeholder);
    /* 替换 #cbd5e1 */
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
}

:deep(.el-table__row) {
    transition: background-color 0.2s;
}

:deep(.el-table__row:hover) {
    background-color: var(--bg-hover) !important;
    /* 替换 #f8fafc */
}

:deep(.el-table__inner-wrapper::before) {
    display: none;
}
</style>