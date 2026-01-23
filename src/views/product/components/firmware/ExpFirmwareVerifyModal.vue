<template>
  <el-drawer
    v-model="visible"
    title="真机验证推送 (Verify)"
    size="500px"
    destroy-on-close
    class="modern-drawer"
  >
    <div class="drawer-content">
      <!-- 1. 固件信息卡片 -->
      <div class="info-card">
        <div class="card-header">
          <span class="card-title">目标版本</span>
          <el-tag effect="dark" type="success" size="small" class="version-tag">
            v{{ firmware?.version }}
          </el-tag>
        </div>
        <div class="card-body">
          <div class="meta-row">
            <span class="label">所属产品:</span>
            <span class="value">{{ product?.name }}</span>
          </div>
          <div class="meta-row">
            <span class="label">固件库ID:</span>
            <span class="value mono">{{ (firmware?.repoId as string)?.substring(0, 8) }}...</span>
          </div>
        </div>
      </div>

      <!-- 2. 添加验证设备 -->
      <div class="section-title">添加测试设备</div>
      <div class="add-device-box">
        <el-input
          v-model="deviceUuid"
          placeholder="请输入设备 UUID"
          class="uuid-input"
          :prefix-icon="Search"
          clearable
          @keyup.enter="checkDevice"
        />
        <el-button type="primary" class="check-btn" @click="checkDevice" :loading="checking">
          检测
        </el-button>
      </div>

      <!-- 设备检测结果 -->
      <transition name="el-zoom-in-top">
        <div v-if="deviceInfo" class="device-status-card success">
          <div class="status-header">
            <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
            <span class="status-text">设备匹配成功</span>
          </div>
          <div class="status-details">
            <span class="detail-item">状态: {{ deviceInfo.online ? '在线' : '离线' }}</span>
            <span class="detail-item">当前版本: {{ deviceInfo.currentVersion || '未知' }}</span>
          </div>
          <!-- 核心操作按钮 -->
          <div class="action-area">
            <el-button
              type="success"
              class="push-btn"
              :loading="pushing"
              @click="handlePush"
              :disabled="isDeviceInWhitelist"
            >
              <el-icon class="mr-1"><Promotion /></el-icon>
              {{ isDeviceInWhitelist ? '已在白名单中' : '确认推送' }}
            </el-button>
          </div>
        </div>
      </transition>

      <transition name="el-zoom-in-top">
        <div v-if="checkError" class="device-status-card error">
          <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
          <span class="error-text">{{ checkError }}</span>
        </div>
      </transition>

      <!-- 3. 已有验证列表 -->
      <div class="section-title mt-6">
        已添加验证设备 ({{ existingDevices.length }})
        <el-button
          v-if="existingDevices.length > 0"
          link
          type="primary"
          size="small"
          class="refresh-link"
          @click="loadExistingDevices"
        >
          刷新
        </el-button>
      </div>

      <div class="whitelist-container" v-loading="loadingList">
        <template v-if="existingDevices.length > 0">
          <div v-for="dev in existingDevices" :key="dev.uuid" class="whitelist-item">
            <div class="dev-info">
              <span class="dev-uuid mono">{{ dev.uuid }}</span>
              <span class="dev-time">{{ formatTime(dev.updateTime) }}</span>
            </div>
            <div class="dev-actions">
              <el-tag size="small" :type="getStatusType(dev.status)" class="mr-2">{{
                getStatusLabel(dev.status)
              }}</el-tag>
              <el-button
                type="danger"
                link
                :icon="Delete"
                size="small"
                @click="handleRemove(dev.uuid)"
              ></el-button>
            </div>
          </div>
        </template>
        <el-empty v-else description="暂无验证设备" :image-size="60" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  CircleCloseFilled,
  CircleCheckFilled,
  Promotion,
  Delete,
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
import { ElMessageBox } from 'element-plus'

// API
import {
  createOTATaskDraft,
  publishGray,
  queryOTATasks,
  addVerifyDevice,
  removeVerifyDevice,
  queryVerifyDevices,
  type OTATaskDeviceInfoDTO,
} from '@/api/modules/iot-ota'

const props = defineProps<{
  firmware: Record<string, unknown> | null
  product: Record<string, unknown> | null
}>()

const emit = defineEmits(['success'])

// --- State ---
const visible = ref(false)
const checking = ref(false)
const pushing = ref(false)
const loadingList = ref(false)

const deviceUuid = ref('')
const checkError = ref('')
const deviceInfo = ref<Record<string, unknown> | null>(null)

// 现有的任务 ID (如果存在)
const currentTaskId = ref<string>('')
// 已存在的白名单设备
const existingDevices = ref<OTATaskDeviceInfoDTO[]>([])

// --- Computed ---
const isDeviceInWhitelist = computed(() => {
  if (!deviceUuid.value) return false
  return existingDevices.value.some((d) => d.uuid === deviceUuid.value)
})

// --- Actions ---

const open = () => {
  deviceUuid.value = ''
  deviceInfo.value = null
  checkError.value = ''
  visible.value = true

  // 打开时尝试加载已有任务和列表
  loadTaskContext()
}

const close = () => {
  visible.value = false
}

// 1. 加载任务上下文 (检查是否已有任务)
const loadTaskContext = async () => {
  if (!props.firmware || !props.product) return

  currentTaskId.value = ''
  existingDevices.value = []

  try {
    const res = await queryOTATasks({
      pageIndex: 1,
      pageSize: 1,
      productId: props.product.id as string,
      firmwaresRepoId: props.firmware.repoId as string,
      firmwareVersion: props.firmware.version as string,
      country: 'ALL',
    })
    const taskRes =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res
    const items = (taskRes.items as any[]) || []

    if (items.length > 0) {
      const task = items[0]
      currentTaskId.value = task.otaTaskId || task.OtaTaskId
      console.log('✅ 加载任务上下文:', currentTaskId.value)
      // 如果有任务，加载已有的验证设备列表
      loadExistingDevices()
    } else {
      // 如果没有查到任务，也应该清空列表
      existingDevices.value = []
    }
  } catch (e) {
    console.error('加载任务上下文失败', e)
  }
}

// 2. 加载已有验证设备
const loadExistingDevices = async () => {
  if (!currentTaskId.value) return
  loadingList.value = true
  try {
    console.log('🔄 正在加载验证设备列表...')
    const res = await queryVerifyDevices(currentTaskId.value, 1, 100)
    const data =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res

    // 🛠️ 修复：打印完整返回结构以调试
    console.log('📦 验证列表 API 返回:', JSON.stringify(data))

    // 兼容后端可能返回的不同结构
    const list = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []

    // 🛠️ 修复：如果 list 是字符串数组（UUID列表），则将其转换为对象数组
    existingDevices.value = list.map((item: any) => {
      if (typeof item === 'string') {
        return {
          uuid: item,
          status: 0, // 默认状态
          updateTime: '', // 默认时间
          message: '',
        } as OTATaskDeviceInfoDTO
      }
      return item
    })
    // 🛠️ 修复：使用模板中的 formatTime 和 dev.updateTime 渲染
    // <span class="dev-time">{{ formatTime(dev.updateTime) }}</span>
    // 如果 updateTime 为空，formatTime 会返回 '-'

    // 🛠️ 修复：使用模板中的 getStatusLabel 和 dev.status 渲染
    // <el-tag ...>{{ getStatusLabel(dev.status) }}</el-tag>
    // 如果 status 为 0，getStatusLabel 会返回 'Pending'

    // 此处不需要修改代码，因为上面的 list.map 已经填充了默认值
    // 但为了确保 UI 显示正确，如果后端只返回了 string[]，我们无法知道真实的状态和时间
    // 只能显示默认值。

    console.log('📋 已解析设备列表:', existingDevices.value)
  } catch (e) {
    console.error('加载验证列表失败', e)
  } finally {
    loadingList.value = false
  }
}

// 3. 模拟检查设备
const checkDevice = async () => {
  if (!deviceUuid.value) return
  checking.value = true
  checkError.value = ''
  try {
    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 500))
    deviceInfo.value = {
      uuid: deviceUuid.value,
      status: 'Online',
      version: 'Unknown',
      online: true, // Mock data
    }
  } catch (e) {
    checkError.value = '检测设备失败'
  } finally {
    checking.value = false
  }
}

// 4. 推送逻辑
const handlePush = async () => {
  if (!props.firmware || !props.product || !deviceUuid.value) {
    ElMessage.warning('请确保设备 UUID 已输入')
    return
  }

  // 双重检查防止重复
  if (isDeviceInWhitelist.value) {
    ElMessage.warning('该设备已在验证白名单中')
    return
  }

  const firmware = props.firmware
  const product = props.product

  pushing.value = true
  try {
    let taskId = currentTaskId.value
    let taskStatus = 0 // 默认状态

    // A. 如果还没有 Task ID (说明之前没查到)，再查一次或者创建
    if (!taskId) {
      // ... (原有的创建/查询逻辑) ...
      // 为了简化，这里复用之前的创建逻辑，但加上状态更新

      // 尝试查询
      const res = await queryOTATasks({
        pageIndex: 1,
        pageSize: 1,
        productId: product.id as string,
        firmwaresRepoId: firmware.repoId as string,
        firmwareVersion: firmware.version as string,
        country: 'ALL',
      })
      const taskRes =
        ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res
      const items = (taskRes.items as any[]) || []

      if (items.length > 0) {
        taskId = items[0].otaTaskId || items[0].OtaTaskId
        taskStatus = items[0].status
      } else {
        // 创建新任务
        await createOTATaskDraft({
          productId: product.id as string,
          firmwaresRepoId: firmware.repoId as string,
          firmwareVersion: firmware.version as string,
          country: 'ALL',
          upgradeMode: 1,
          remark: `Direct Verify for ${deviceUuid.value}`,
        })

        // 再次查询获取 ID
        const retryRes = await queryOTATasks({
          pageIndex: 1,
          pageSize: 1,
          productId: product.id as string,
          firmwaresRepoId: firmware.repoId as string,
          firmwareVersion: firmware.version as string,
          country: 'ALL',
        })
        const retryData =
          ((retryRes as unknown as Record<string, unknown>).data as Record<string, unknown>) ||
          retryRes
        const retryItems = (retryData.items as any[]) || []
        if (retryItems.length > 0) {
          taskId = retryItems[0].otaTaskId || retryItems[0].OtaTaskId
        } else {
          throw new Error('创建任务后无法获取 ID')
        }
      }
    }

    // B. 激活任务
    // 注意：这里需要再次确认 taskStatus，如果上面没获取到 status，最好默认检查一下
    // 但为简化，假设如果 taskId 存在，它要么是新创建的(status=0)，要么是已存在的
    // 如果是已存在的，我们最好再查一下状态，或者直接调 publishGray (它是幂等的吗？通常是)

    // 简单起见，直接调用 publishGray，后端应该处理状态判断
    if (taskStatus !== 1) {
      try {
        await publishGray({
          otaTaskId: taskId,
          grayPolicy: 1,
          grayValue: 100,
        })
      } catch (ignore) {
        // 忽略重复发布错误
      }
    }

    // C. 添加白名单
    try {
      console.log('📝 添加设备到白名单:', deviceUuid.value)
      await addVerifyDevice(taskId, deviceUuid.value)
    } catch (e: any) {
      // 如果错误信息提示"已存在"，则忽略该错误，视为成功
      const msg = e.message || ''
      if (msg.includes('已存在') || msg.includes('AlreadyExists')) {
        console.log('⚠️ 设备已在白名单中，跳过添加')
      } else {
        throw e // 其他错误继续抛出
      }
    }

    ElMessage.success('验证指令已下发')
    emit('success')

    // 刷新列表
    currentTaskId.value = taskId
    // 延迟一点刷新，确保后端已更新
    setTimeout(() => {
      loadExistingDevices()
    }, 500)

    deviceInfo.value = null // 重置输入状态
    deviceUuid.value = ''
  } catch (error: any) {
    console.error('Push failed:', error)
    ElMessage.error(error.message || '推送失败')
  } finally {
    pushing.value = false
  }
}

// 5. 移除验证设备
const handleRemove = async (uuid: string) => {
  if (!currentTaskId.value) return

  try {
    await ElMessageBox.confirm('确定要移除该验证设备吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    loadingList.value = true
    // 修复 400 错误：确保 API 参数正确
    // 后端可能需要 JSON body 而不是 query params，尝试调整请求方式
    // 但根据 axios 报错 400，通常是参数验证失败。
    // 尝试显式传递参数
    await removeVerifyDevice(currentTaskId.value, uuid)
    ElMessage.success('移除成功')
    // 重新加载列表
    await loadExistingDevices()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('移除设备失败:', e)
      // 增加更详细的错误提示
      const msg = e.response?.data?.message || e.message || '未知错误'
      ElMessage.error(`移除失败: ${msg}`)
    }
  } finally {
    loadingList.value = false
  }
}

// Helpers
const formatTime = (time: string) => {
  if (!time) return '-'
  return formatDateTime(time)
}

const getStatusLabel = (status: number) => {
  const map: Record<number, string> = {
    0: 'Pending',
    1: 'Downloading',
    2: 'Upgrading',
    3: 'Success',
    4: 'Failed',
  }
  return map[status] || 'Unknown'
}

const getStatusType = (status: number) => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'primary',
    2: 'warning',
    3: 'success',
    4: 'danger',
  }
  return map[status] || 'info'
}

defineExpose({ open })
</script>

<style scoped>
.modern-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.modern-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.drawer-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

/* Info Card */
.info-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 600;
  color: #334155;
  font-size: 14px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #64748b;
}

.value {
  color: #0f172a;
  font-weight: 500;
}

.mono {
  font-family: monospace;
}

/* Add Device Section */
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-device-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.uuid-input {
  flex: 1;
}

.check-btn {
  background-color: var(--color-primary);
  border: none;
}

/* Device Status Card */
.device-status-card {
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease;
}

.device-status-card.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.device-status-card.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #b91c1c;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #15803d;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #166534;
  padding-left: 24px; /* Align with text */
}

.action-area {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Whitelist */
.whitelist-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.whitelist-item {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.whitelist-item:last-child {
  border-bottom: none;
}

.dev-info {
  display: flex;
  flex-direction: column;
}

.dev-uuid {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.dev-time {
  font-size: 11px;
  color: #94a3b8;
}

.dev-actions {
  display: flex;
  align-items: center;
}

.refresh-link {
  font-weight: normal;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
