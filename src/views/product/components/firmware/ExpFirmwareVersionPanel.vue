<template>
  <div class="exp-panel">
    <div class="panel-toolbar">
      <div class="left-tip">
        <el-icon class="info-icon">
          <InfoFilled />
        </el-icon>
        <span>任务列表 (共 {{ pagination.total }} 条)</span>
      </div>
      <div class="right-action">
        <el-button type="primary" class="tech-btn" @click="isUploadVisible = true">
          <el-icon class="mr-1">
            <Upload />
          </el-icon>
          发布新固件
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="firmwareList" v-loading="loading" style="width: 100%" :header-cell-style="headerStyle"
        :row-class-name="tableRowClassName">
        <el-table-column label="任务标识 (No / ID)" min-width="200">
          <template #default="{ row }">
            <div class="key-wrapper">
              <el-tag v-if="row.no" size="small" type="info" effect="plain" class="mr-2 font-mono">
                #{{ row.no }}
              </el-tag>
              <el-icon class="key-icon">
                <Key />
              </el-icon>
              <span class="key-text font-mono" :title="row.otaTaskId">
                {{ row.otaTaskId || '-' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="固件版本" width="140">
          <template #default="{ row, $index }">
            <div class="version-wrapper">
              <span class="version-code">v{{ row.version }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 1 ? 'info' : 'warning'" effect="plain" class="font-mono">
              {{ row.type === 0 ? 'MCU' : 'Module' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info" size="small">草稿</el-tag>
            <el-tag v-else-if="row.status === 2" type="primary" size="small" effect="dark">发布中</el-tag>
            <el-tag v-else-if="row.status === 1" type="warning" size="small">已暂停</el-tag>
            <el-tag v-else-if="row.status === 3" type="success" size="small">已完成</el-tag>
            <el-tag v-else type="info" size="small">未知({{ row.status }})</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            <span class="time-text" v-if="row.uploadedAt">
              {{ formatDateTime(row.uploadedAt) }}
            </span>
            <span class="text-xs text-gray-300" v-else> - </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="right" fixed="right">
          <template #default="{ row }">
            <div class="actions">
              <el-tooltip content="发布任务" placement="top" v-if="row.status === 0">
                <el-button circle size="small" type="primary" plain class="action-btn publish-btn"
                  @click="handlePublishWizard(row)">
                  <el-icon>
                    <Promotion />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="暂停发布" placement="top" v-else-if="row.status === 2">
                <el-button circle size="small" type="warning" plain @click="handlePauseTask(row)">
                  <el-icon>
                    <CaretRight />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="恢复发布" placement="top" v-else-if="row.status === 0">
                <el-button circle size="small" type="success" @click="handleResumeTask(row)">
                  <el-icon>
                    <CaretRight />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="真机验证推送" placement="top" :hide-after="50">
                <el-button circle size="small" type="success" plain class="action-btn verify-btn"
                  @click="openVerifyDialog(row)">
                  <el-icon>
                    <Check />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="详情与编辑" placement="top" :hide-after="50">
                <el-button circle size="small" type="info" plain class="action-btn edit-btn"
                  @click="openEditDrawer(row)">
                  <el-icon>
                    <EditPen />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <el-tooltip content="删除任务" placement="top" :hide-after="50">
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
          <el-empty description="暂无任务数据" :image-size="80" />
        </template>
      </el-table>
    </div>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <AppPagination :total="pagination.total" v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize" @size-change="onPageChange" @current-change="onPageChange" />
    </div>

    <ExpFirmwareDeleteModal v-model="isDeleteVisible" :firmware="currentDeleteRow" @success="refreshData" />
    <ExpFirmwareEditDrawer v-model="isEditVisible" :firmware="currentEditRow" @success="refreshData" />
    <ExpFirmwareUploadWizard v-model="isUploadVisible" :product="product" @success="refreshData" />

    <ExpFirmwareVerifyModal v-model="isVerifyVisible" :firmware="currentVerifyRow" :product="product"
      @success="refreshData" />

    <ExpCreateTaskWizard v-model="isTaskWizardVisible" :product="product" :preselected-firmware="taskWizardParams"
      @success="handleTaskCreated" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Upload,
  InfoFilled,
  Check,
  Delete,
  Promotion,
  EditPen,
  Key,
  VideoPause,
  CaretRight
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product, Firmware } from '@/types'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import AppPagination from '@/components/AppPagination.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// API
import { pausePublish, publishFull } from '@/api/modules/iot-ota'

// Components
import ExpFirmwareUploadWizard from './ExpFirmwareUploadWizard.vue'
import ExpFirmwareDeleteModal from './ExpFirmwareDeleteModal.vue'
import ExpFirmwareEditDrawer from './ExpFirmwareEditDrawer.vue'
import ExpCreateTaskWizard from './ExpCreateTaskWizard.vue'
import ExpFirmwareVerifyModal from './ExpFirmwareVerifyModal.vue'

const props = defineProps<{
  product: Product
}>()

// UI State
const isUploadVisible = ref(false)
const isDeleteVisible = ref(false)
const isEditVisible = ref(false)
const isTaskWizardVisible = ref(false)
const isVerifyVisible = ref(false)

// Data Selection
const currentDeleteRow = ref<Firmware | null>(null)
const currentEditRow = ref<Firmware | null>(null)
const currentVerifyRow = ref<Firmware | null>(null)
const taskWizardParams = ref<any>(null)

// ✅ 移除 activeTasksMap，不再维护独立状态

const { loading, firmwareList, pagination, getFirmwares, handlePaginationChange } =
  useFirmwareManagement()

// 1. 数据加载
const refreshData = async () => {
  if (props.product?.id) {
    // console.log('🔄 刷新任务列表 (直接使用任务源)...')
    // 仅调用 getFirmwares 即可，因为它现在直接返回任务列表
    await getFirmwares(props.product.id)
  }
}

const onPageChange = () => {
  if (props.product?.id) handlePaginationChange(props.product.id)
}

watch(
  () => props.product.id,
  (newId) => {
    if (newId) {
      pagination.currentPage = 1
      refreshData()
    }
  },
  { immediate: true },
)

// --- Operations ---

const openDeleteDialog = (row: Firmware) => {
  currentDeleteRow.value = row
  isDeleteVisible.value = true
}

// 打开详情/编辑
const openEditDrawer = (row: Firmware) => {
  // row 本身就是完整的任务数据，直接传给 EditDrawer
  currentEditRow.value = row
  isEditVisible.value = true
}

const openVerifyDialog = (row: Firmware) => {
  currentVerifyRow.value = row
  isVerifyVisible.value = true
}

const handlePublishWizard = (row: any) => {
  console.log('🚀 打开发布向导，预选任务:', row.otaTaskId)
  taskWizardParams.value = row
  isTaskWizardVisible.value = true
}

const handlePauseTask = async (row: any) => {
  try {
    await ElMessageBox.confirm(`暂停 v${row.version} 发布？`, '暂停', { type: 'warning' })
    // ✅ 直接使用行数据中的 otaTaskId
    await pausePublish(row.otaTaskId)
    ElMessage.success('已暂停')
    refreshData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const handleResumeTask = async (row: any) => {
  try {
    await ElMessageBox.confirm(`恢复 v${row.version} 发布？`, '恢复', { type: 'success' })
    // ✅ 直接使用行数据中的 otaTaskId
    await publishFull(row.otaTaskId)
    ElMessage.success('已恢复')
    refreshData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const handleTaskCreated = () => refreshData()

// Styles
const headerStyle = {
  background: 'var(--bg-hover)',
  color: 'var(--text-secondary)',
  fontWeight: '600',
  fontSize: '13px',
  borderBottom: '1px solid var(--border-color-light)',
}
const tableRowClassName = () => 'modern-row'
</script>

<style scoped>
/* 核心布局 */
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

/* 按钮 */
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

/* 文本与图标 */
.version-wrapper,
.key-wrapper {
  display: flex;
  align-items: center;
}

.key-icon {
  color: var(--text-placeholder);
  margin-right: 4px;
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

/* Actions */
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

:deep(.el-table__row) {
  transition: background-color 0.2s;
}

:deep(.el-table__row:hover) {
  background-color: var(--bg-hover) !important;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>