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

                <el-table-column label="固件Key" min-width="160">
                    <template #default="{ row }">
                        <div class="key-wrapper">
                            <el-icon class="key-icon">
                                <Key />
                            </el-icon>
                            <span class="key-text font-mono" :title="row.repoId">
                                {{ row.firmwareKey || row.repoId?.substring(0, 8) || 'NO_KEY' }}
                            </span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="固件版本" width="140">
                    <template #default="{ row, $index }">
                        <div class="version-wrapper">
                            <span class="version-code">v{{ row.version }}</span>
                            <span v-if="$index === 0 && pagination.currentPage === 1" class="latest-badge">NEW</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="类型" width="100">
                    <template #default="{ row }">
                        <el-tag size="small" :type="row.type === 1 ? 'info' : 'warning'" effect="plain"
                            class="font-mono">
                            {{ row.type === 1 ? 'MCU' : 'Module' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="发布时间" width="180">
                    <template #default="{ row }">
                        <span class="time-text" v-if="row.uploadedAt">
                            {{ formatDateTime(row.uploadedAt) }}
                        </span>
                        <span class="text-xs text-gray-300" v-else>
                            (无时间数据)
                        </span>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                        <div class="status-dot-wrapper" :class="row.verified ? 'is-success' : 'is-pending'">
                            <div class="dot"></div>
                            <span class="status-text">{{ row.verified ? '已验证' : '待验证' }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="200" align="right" fixed="right">
                    <template #default="{ row }">
                        <div class="actions">
                            <el-tooltip content="通过验证" placement="top" :hide-after="50">
                                <el-button v-if="!row.verified" circle size="small" type="success" plain
                                    class="action-btn verify-btn" @click="openVerifyDialog(row)">
                                    <el-icon>
                                        <Check />
                                    </el-icon>
                                </el-button>
                                <span v-else class="verified-mark"><el-icon><Select /></el-icon></span>
                            </el-tooltip>

                            <el-tooltip content="发布任务" placement="top" :hide-after="50">
                                <el-button circle size="small" type="primary" plain class="action-btn publish-btn"
                                    :disabled="!row.verified" @click="handlePublish(row)">
                                    <el-icon>
                                        <Promotion />
                                    </el-icon>
                                </el-button>
                            </el-tooltip>

                            <el-tooltip content="详情与编辑" placement="top" :hide-after="50">
                                <el-button circle size="small" type="info" plain class="action-btn edit-btn"
                                    @click="openDetailDrawer(row)">
                                    <el-icon>
                                        <EditPen />
                                    </el-icon>
                                </el-button>
                            </el-tooltip>

                            <el-tooltip content="删除版本" placement="top" :hide-after="50">
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

        <el-drawer v-model="isDrawerVisible" title="固件版本详情" size="450px" append-to-body destroy-on-close
            class="firmware-drawer">
            <div v-if="currentDetailRow" class="drawer-content">
                <div class="info-card mb-6">
                    <div class="info-row">
                        <span class="label">固件版本:</span>
                        <span class="value font-mono font-bold">{{ currentDetailRow.version }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">固件库ID:</span>
                        <span class="value font-mono text-xs">{{ currentDetailRow.repoId || 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">固件Key:</span>
                        <span class="value font-mono text-xs">{{ currentDetailRow.firmwareKey || 'N/A' }}</span>
                    </div>
                </div>

                <el-form :model="currentDetailRow" label-position="top">
                    <el-form-item label="固件Key (系统标识)">
                        <el-input v-model="currentDetailRow.firmwareKey" placeholder="例如: FW_KEY_ESP32_MAIN" />
                    </el-form-item>

                    <el-form-item label="覆盖国家/地区">
                        <el-select v-model="currentDetailRow.country" placeholder="默认所有" class="w-full">
                            <el-option label="全球 (Global)" value="Global" />
                            <el-option label="中国 (CN)" value="CN" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="更新说明">
                        <el-input v-model="currentDetailRow.releaseNotes" type="textarea" :rows="6" resize="none" />
                    </el-form-item>
                </el-form>

                <div class="drawer-footer">
                    <el-button @click="isDrawerVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleSaveDrawer">保存修改</el-button>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Upload, InfoFilled, Check, Delete, Select, Promotion, EditPen, Key } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product } from '@/types'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import AppPagination from '@/components/AppPagination.vue'
import { ElMessage } from 'element-plus'

import ExpFirmwareUploadWizard from './ExpFirmwareUploadWizard.vue'
import ExpFirmwareVerifyModal from './ExpFirmwareVerifyModal.vue'
import ExpFirmwareDeleteModal from './ExpFirmwareDeleteModal.vue'

const props = defineProps<{
    product: Product
}>()

const isUploadVisible = ref(false)
const isVerifyVisible = ref(false)
const isDeleteVisible = ref(false)
const isDrawerVisible = ref(false)

const currentVerifyRow = ref<any>(null)
const currentDeleteRow = ref<any>(null)
const currentDetailRow = ref<any>(null)

const {
    loading,
    firmwareList, // 这是数据源
    pagination,
    getFirmwares,
    handlePaginationChange
} = useFirmwareManagement()

// 🔍 [Debug] 监听数据变化并打印，帮助排查字段问题
watch(firmwareList, (newList) => {
    if (newList && newList.length > 0) {
        console.group('🔥 [FirmwarePanel] 数据探针');
        console.log('📦 收到的完整列表:', newList);
        console.log('🕵️ 第一条数据详情:', newList[0]);
        console.log('🕒 时间字段检查 (uploadedAt):', newList[0].uploadedAt);
        console.log('🔑 Key字段检查 (firmwareKey):', newList[0].firmwareKey);
        console.groupEnd();
    } else {
        console.log('⚠️ [FirmwarePanel] 列表为空');
    }
}, { deep: true })

const refreshData = () => {
    if (props.product?.id) {
        console.log('🔄 刷新数据, ProductID:', props.product.id);
        getFirmwares(props.product.id)
    }
}

const onPageChange = () => {
    if (props.product?.id) {
        handlePaginationChange(props.product.id)
    }
}

watch(() => props.product.id, (newId) => {
    if (newId) {
        pagination.currentPage = 1
        refreshData()
    }
}, { immediate: true })

// --- Operations ---

const openVerifyDialog = (row: any) => {
    currentVerifyRow.value = row
    isVerifyVisible.value = true
}

const openDeleteDialog = (row: any) => {
    currentDeleteRow.value = row
    isDeleteVisible.value = true
}

const openDetailDrawer = (row: any) => {
    currentDetailRow.value = JSON.parse(JSON.stringify(row))
    isDrawerVisible.value = true
}

const handleSaveDrawer = async () => {
    console.log('💾 保存修改:', currentDetailRow.value)
    ElMessage.success('保存功能待对接 API')
    isDrawerVisible.value = false
}

const handlePublish = (row: any) => {
    ElMessage.info(`准备发布版本 v${row.version}`)
}

const headerStyle = {
    background: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '13px',
    borderBottom: '1px solid var(--border-color-light)'
}
const tableRowClassName = () => 'modern-row'
</script>

<style scoped>
/* 保持原有样式，新增 Key 列样式 */
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
    color: var(--text-secondary);
    font-size: 13px;
    background: var(--bg-hover);
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
    color: #fff;
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

/* Version & Key Styles */
.version-wrapper,
.key-wrapper {
    display: flex;
    align-items: center;
}

.key-icon {
    color: var(--text-placeholder);
    margin-right: 6px;
    font-size: 14px;
}

.key-text {
    color: var(--text-secondary);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.version-code {
    font-family: 'JetBrains Mono', 'Monaco', monospace;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 14px;
}

.latest-badge {
    margin-left: 8px;
    font-size: 10px;
    background: #fee2e2;
    color: var(--color-danger);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
}

.time-text {
    color: var(--text-secondary);
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
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-dot-wrapper.is-success .status-text {
    color: var(--color-success);
}

.status-dot-wrapper.is-pending .dot {
    background-color: var(--color-warning);
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.status-dot-wrapper.is-pending .status-text {
    color: var(--color-warning);
}

.status-text {
    font-size: 13px;
    font-weight: 500;
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
    background-color: transparent;
}

.verify-btn:hover {
    background-color: #dcfce7;
    color: #16a34a;
}

.delete-btn:hover {
    background-color: #fee2e2;
    color: var(--color-danger);
}

.publish-btn:hover {
    background-color: #dbeafe;
    color: var(--color-primary);
}

.edit-btn:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
}

.verified-mark {
    color: var(--text-placeholder);
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
}

:deep(.el-table__inner-wrapper::before) {
    display: none;
}

/* Drawer Styles */
.drawer-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.info-card {
    background: var(--bg-hover);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color-light);
}

.info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
}

.info-row:last-child {
    margin-bottom: 0;
}

.info-row .label {
    color: var(--text-secondary);
}

.info-row .value {
    color: var(--text-primary);
}

.drawer-footer {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>