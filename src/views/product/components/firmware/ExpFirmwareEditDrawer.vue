<template>
  <el-drawer v-model="visible" title="固件版本详情" size="600px" append-to-body destroy-on-close class="modern-drawer">
    <div v-if="localData" class="drawer-container">

      <div class="header-section">
        <div class="version-display">
          <span class="v-number">v{{ localData.version || localData.firmwareVersion }}</span>
          <el-tag v-if="localData.otaTaskId" :type="getStatusType(localData.status)" effect="dark"
            class="ml-3 status-tag">
            {{ getStatusLabel(localData.status) }}
          </el-tag>
          <el-tag v-else type="info" effect="plain" class="ml-3">未发布</el-tag>
        </div>
        <div class="sub-header">
          <span class="time-label">创建于 {{ formatDateTime(localData.createdAt || localData.uploadedAt) }}</span>
        </div>
      </div>

      <div class="scroll-content">

        <div class="data-group">
          <div class="group-title">核心标识 (Identification)</div>

          <div class="info-row" @click="copyText(localData.otaTaskId)">
            <div class="label">任务 ID (otaTaskId)</div>
            <div class="value font-mono">{{ localData.otaTaskId || 'N/A' }}</div>
            <el-icon class="copy-icon">
              <CopyDocument />
            </el-icon>
          </div>

          <div class="info-row" @click="copyText(localData.firmwaresRepoId || localData.repoId)">
            <div class="label">固件库 ID (RepoId)</div>
            <div class="value font-mono">{{ localData.firmwaresRepoId || localData.repoId || 'N/A' }}</div>
            <el-icon class="copy-icon">
              <CopyDocument />
            </el-icon>
          </div>

          <div class="info-row" @click="copyText(localData.productId)">
            <div class="label">产品 ID (ProductId)</div>
            <div class="value font-mono">{{ localData.productId || 'N/A' }}</div>
            <el-icon class="copy-icon">
              <CopyDocument />
            </el-icon>
          </div>
        </div>

        <div class="data-group" v-if="localData.otaTaskId">
          <div class="group-title">发布策略 (Strategy)</div>
          <div class="grid-2">
            <div class="info-box" @click="copyText(localData.upgradeMode)">
              <div class="label">升级模式</div>
              <div class="value">{{ getModeLabel(localData.upgradeMode) }} ({{ localData.upgradeMode }})</div>
            </div>
            <div class="info-box" @click="copyText(localData.country)">
              <div class="label">目标区域</div>
              <div class="value">{{ localData.country || 'ALL' }}</div>
            </div>
            <div class="info-box" @click="copyText(localData.grayPolicy)">
              <div class="label">灰度策略</div>
              <div class="value">{{ localData.grayPolicy === 1 ? '比例灰度' : '白名单' }} ({{ localData.grayPolicy }})</div>
            </div>
            <div class="info-box" @click="copyText(localData.grayValue)">
              <div class="label">灰度值</div>
              <div class="value">{{ localData.grayValue }}%</div>
            </div>
          </div>
        </div>

        <div class="data-group" v-if="localData.otaTaskId">
          <div class="group-title">数据统计 (Statistics)</div>
          <div class="grid-3">
            <div class="stat-box" @click="copyText(localData.totalTriggeredCount)">
              <div class="num">{{ localData.totalTriggeredCount || 0 }}</div>
              <div class="lbl">触发总数</div>
            </div>
            <div class="stat-box success" @click="copyText(localData.totalSuccessCount)">
              <div class="num">{{ localData.totalSuccessCount || 0 }}</div>
              <div class="lbl">成功数</div>
            </div>
            <div class="stat-box fail" @click="copyText(localData.totalFailCount)">
              <div class="num">{{ localData.totalFailCount || 0 }}</div>
              <div class="lbl">失败数</div>
            </div>
          </div>
          <div class="info-row mt-3" @click="copyText(localData.upgradeableCountSnapshot)">
            <div class="label">可升级设备快照</div>
            <div class="value">{{ localData.upgradeableCountSnapshot || 0 }}</div>
          </div>
        </div>

        <div class="data-group">
          <div class="group-title">其他信息 (Meta)</div>

          <div class="info-row" @click="copyText(localData.remark)">
            <div class="label">内部备注 (Remark)</div>
            <div class="value">{{ localData.remark || '-' }}</div>
            <el-icon class="copy-icon">
              <CopyDocument />
            </el-icon>
          </div>

          <div class="info-row" @click="copyText(localData.updatedAt)">
            <div class="label">更新时间</div>
            <div class="value">{{ formatDateTime(localData.updatedAt) }}</div>
            <el-icon class="copy-icon">
              <CopyDocument />
            </el-icon>
          </div>
        </div>

        <div class="data-group no-border">
          <div class="group-title">对外更新日志 (Release Note)</div>
          <el-input v-model="editNote" type="textarea" :rows="5" resize="none" placeholder="请输入 Release Notes..."
            class="clean-textarea" />
        </div>
      </div>

      <div class="drawer-footer">
        <el-button @click="close" class="cancel-btn">关闭</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading" class="save-btn">
          保存配置
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/formatters'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'

const props = defineProps<{
  modelValue: boolean
  firmware: any // 使用 any 以容纳混合后的 Task 数据
}>()

const emit = defineEmits(['update:modelValue', 'success'])
const { updateAction, loading } = useFirmwareManagement()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const localData = ref<any>(null)
const editNote = ref('')

watch(
  () => props.firmware,
  (newVal) => {
    if (newVal) {
      localData.value = { ...newVal }
      editNote.value = newVal.releaseNotes || newVal.releaseNote || ''
    }
  },
  { immediate: true }
)

const close = () => {
  visible.value = false
}

const handleSave = async () => {
  if (!localData.value) return
  // 注意：这里可能只更新 releaseNote，如果需要更新 task 其他字段需要对应 API
  const success = await updateAction(localData.value, editNote.value)
  if (success) {
    emit('success')
    close()
  }
}

// 文本复制
const copyText = (text: any) => {
  if (text === null || text === undefined || text === '') return
  navigator.clipboard.writeText(String(text))
  ElMessage.success({ message: '已复制', grouping: true, duration: 1000 })
}

// 状态映射
const getStatusType = (status?: number) => {
  switch (status) {
    case 1: return 'primary' // 进行中
    case 2: return 'warning' // 暂停
    case 3: return 'success' // 完成
    case 0: return 'info'    // 草稿
    default: return 'info'
  }
}

const getStatusLabel = (status?: number) => {
  const map: Record<number, string> = {
    0: '草稿 (Draft)',
    1: '发布中 (Active)',
    2: '已暂停 (Paused)',
    3: '已完成 (Finished)',
    4: '已取消 (Cancelled)'
  }
  return map[status as number] || `未知状态 (${status})`
}

const getModeLabel = (mode?: number) => {
  return mode === 1 ? '正式发布' : '测试/灰度'
}
</script>

<style scoped>
/* 全局容器：工业灰风格 */
.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 顶部 Header */
.header-section {
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.version-display {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.v-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.sub-header {
  font-size: 13px;
  color: #64748b;
}

/* 滚动区域 */
.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

/* 数据分组 */
.data-group {
  margin-bottom: 32px;
}

.group-title {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 通用信息行 (整行点击复制) */
.info-row {
  display: flex;
  align-items: flex-start;
  /* 支持多行文本顶部对齐 */
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f8fafc;
  /* 极浅灰 */
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.info-row:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.info-row .label {
  font-size: 13px;
  color: #64748b;
  width: 140px;
  /* 固定标签宽度 */
  flex-shrink: 0;
}

.info-row .value {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  flex: 1;
  word-break: break-all;
  /* 强制换行，不省略 */
  line-height: 1.5;
  text-align: right;
  padding-right: 8px;
}

.copy-icon {
  color: #cbd5e1;
  margin-top: 3px;
}

.info-row:hover .copy-icon {
  color: #3b82f6;
}

/* 网格布局 */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

/* 统计卡片 */
.stat-box,
.info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-box:hover,
.info-box:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.stat-box {
  text-align: center;
}

.stat-box .num {
  font-size: 20px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 4px;
}

.stat-box .lbl {
  font-size: 12px;
  color: #64748b;
}

.stat-box.success .num {
  color: #10b981;
}

.stat-box.fail .num {
  color: #ef4444;
}

.info-box .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.info-box .value {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

/* 字体 */
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

/* 底部按钮 */
.drawer-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.save-btn {
  background: #0f172a;
  border: none;
}

.save-btn:hover {
  background: #1e293b;
}

/* 输入框 */
.clean-textarea :deep(.el-textarea__inner) {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: none;
  padding: 12px;
}

.clean-textarea :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  border-color: #94a3b8;
}
</style>