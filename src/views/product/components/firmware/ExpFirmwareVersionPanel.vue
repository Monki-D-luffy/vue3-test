<template>
  <div class="exp-panel">
    <div class="panel-toolbar">
      <div class="left-tip">
        <el-icon class="info-icon">
          <InfoFilled />
        </el-icon>
        <span>固件版本库 (共 {{ pagination.total }} 个版本)</span>
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
              <!-- 调试信息：悬停显示所有字段 -->
              <!-- 打印 row 到控制台以供调试 -->
              {{ console.log('Row Data:', row) }}
              <span class="key-text font-mono" :title="row.firmwareKey || row.id">
                {{ (row.firmwareKey || row.id || '').substring(0, 18) || '-' }}
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
            <el-tag size="small" :type="row.type === 1 ? 'info' : 'warning'" effect="plain" class="font-mono">
              {{ row.type === 1 ? 'MCU' : 'Module' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            <span class="time-text" v-if="row.uploadedAt">
              {{ formatDateTime(row.uploadedAt) }}
            </span>
            <span class="text-xs text-gray-300" v-else> (无时间数据) </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="right" fixed="right">
          <template #default="{ row }">
            <div class="actions">
              <!-- 0: 未发布 (显示发布按钮) -->
              <el-tooltip content="发布任务" placement="top"
                v-if="getActiveTask(row.version)?.status === 0 || !getActiveTask(row.version)">
                <el-button circle size="small" type="primary" plain class="action-btn publish-btn"
                  @click="handlePublishWizard(row)">
                  <el-icon>
                    <Promotion />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <!-- 1: 已发布 (显示暂停/恢复按钮 - 灰色纸飞机) -->
              <el-tooltip content="恢复发布" placement="top" v-else>
                <el-button circle size="small" type="info" class="action-btn"
                  @click="handleResumeTask(getActiveTask(row.version))">
                  <el-icon>
                    <Promotion />
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
import { ref, watch, reactive } from 'vue'
import {
  Upload,
  InfoFilled,
  Check,
  Delete,
  Promotion,
  EditPen,
  Key,
  VideoPause,
  CaretRight, // ✅ Fix: 使用 CaretRight 替代 VideoPlay
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import type { Product, Firmware } from '@/types'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import AppPagination from '@/components/AppPagination.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// API
import { queryOTATasks, pausePublish, publishFull, type OTATaskDto } from '@/api/modules/iot-ota'

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
const taskWizardParams = ref<{ repoId: string; version: string; repoType: number } | null>(null)

// 任务状态管理
const activeTasksMap = reactive<Record<string, OTATaskDto>>({})

const { loading, firmwareList, pagination, getFirmwares, handlePaginationChange } =
  useFirmwareManagement()

// 1. 数据加载
const refreshData = async () => {
  if (props.product?.id) {
    console.log('🔄 正在刷新固件列表和任务状态...')
    await Promise.all([getFirmwares(props.product.id), loadActiveTasks(props.product.id)])
    // 调试：打印当前活跃任务映射表
    console.log('🗺️ 活跃任务映射表:', JSON.parse(JSON.stringify(activeTasksMap)))
  }
}

const loadActiveTasks = async (productId: string) => {
  try {
    const res = await queryOTATasks({
      pageIndex: 1,
      pageSize: 50,
      productId: productId,
    })
    const items = (res.data as any)?.items || (res.data as any)?.data?.items || []

    // 清理旧数据
    for (const key in activeTasksMap) delete activeTasksMap[key]

    // 重新映射：status 1(发布中) 或 2(暂停)
    items.forEach((task: OTATaskDto) => {
      // 调试：打印任务状态
      // console.log(`Task: ${task.firmwareVersion}, Status: ${task.status}, ID: ${task.otaTaskId}`)

      // 注意：这里需要确保 task.firmwareVersion 格式与 row.version 完全一致（例如 v1.0.0 vs 1.0.0）
      // 如果后端返回不带 'v' 而前端带 'v'，需要处理

      // ✅ 修复：现在将所有状态的任务都存入映射表，不仅仅是 1 和 2
      // 这样前端可以区分 "有任务但未发布(0)" 和 "完全没任务(undefined)"
      if (true) {
        // 存储任务状态，使用版本号作为 key
        activeTasksMap[task.firmwareVersion] = task

        // 防御性：尝试去掉或加上 'v' 前缀再存一份，防止版本号格式不一致
        if (task.firmwareVersion.startsWith('v')) {
          activeTasksMap[task.firmwareVersion.substring(1)] = task
        } else {
          activeTasksMap[`v${task.firmwareVersion}`] = task
        }

        // 尝试匹配不带前导零的版本号 (例如 00.00.14 -> 0.0.14)
        // 这是一个比较激进的尝试，但能解决很多格式问题
        const cleanVer = task.firmwareVersion
          .replace(/^v/, '')
          .split('.')
          .map((p) => parseInt(p).toString())
          .join('.')
        activeTasksMap[cleanVer] = task
      }
    })
  } catch (e) {
    console.error('加载任务状态失败', e)
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

const getActiveTask = (version: string) => {
  // 尝试直接匹配
  if (activeTasksMap[version]) return activeTasksMap[version]

  // 尝试匹配清理后的版本号 (00.00.14 -> 0.0.14)
  const cleanVer = version
    .replace(/^v/, '')
    .split('.')
    .map((p) => parseInt(p).toString())
    .join('.')
  if (activeTasksMap[cleanVer]) return activeTasksMap[cleanVer]

  return undefined
}

// --- Operations ---

const openDeleteDialog = (row: Firmware) => {
  currentDeleteRow.value = row
  isDeleteVisible.value = true
}

const openEditDrawer = (row: Firmware) => {
  currentEditRow.value = row
  isEditVisible.value = true
}

const openVerifyDialog = (row: Firmware) => {
  currentVerifyRow.value = row
  isVerifyVisible.value = true
}

const handlePublishWizard = (row: any) => {
  taskWizardParams.value = {
    repoId: row.repoId,
    version: row.version,
    repoType: row.type || 1,
  }
  isTaskWizardVisible.value = true
}

const handlePauseTask = async (task: OTATaskDto) => {
  try {
    await ElMessageBox.confirm(`暂停 v${task.firmwareVersion} 发布？`, '暂停', { type: 'warning' })
    await pausePublish(task.otaTaskId)
    ElMessage.success('已暂停')
    refreshData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const handleResumeTask = async (task: OTATaskDto) => {
  try {
    await ElMessageBox.confirm(`恢复 v${task.firmwareVersion} 发布？`, '恢复', { type: 'success' })

    // ✅ Fix: 使用 publishFull 恢复所有任务，规避灰度参数问题
    // 后端逻辑通常是: 如果任务已经是灰度模式 (UpgradeMode=1), publishFull 只是将 Status 置为 1 (发布中)
    await publishFull(task.otaTaskId)

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
</style>
