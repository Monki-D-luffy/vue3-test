<template>
  <div class="upgrade-monitor h-full flex flex-col">
    <!-- 顶部筛选 -->
    <div class="monitor-header">
      <div class="left-panel">
        <h3 class="panel-title">升级监控</h3>
        <el-input
          v-model="taskId"
          placeholder="输入任务ID"
          class="task-id-input"
          clearable
          @keyup.enter="fetchDevices"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="fetchDevices" :loading="loading">查询</el-button>
        <el-select
          v-model="filterStatus"
          placeholder="状态筛选"
          clearable
          class="status-select"
          @change="fetchDevices"
        >
          <el-option label="待升级" :value="0" />
          <el-option label="下载中" :value="1" />
          <el-option label="升级中" :value="2" />
          <el-option label="成功" :value="3" />
          <el-option label="失败" :value="4" />
        </el-select>
      </div>

      <div class="right-panel">
        <span class="refresh-label">自动刷新</span>
        <el-switch v-model="autoRefresh" active-text="开" inactive-text="关" inline-prompt />
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid" v-if="stats">
      <div
        class="stat-card"
        :class="{ active: filterStatus === undefined }"
        @click="handleFilter(undefined)"
      >
        <div class="stat-label">总设备</div>
        <div class="stat-value">{{ stats.total }}</div>
      </div>
      <div
        class="stat-card success"
        :class="{ active: filterStatus === 3 }"
        @click="handleFilter(3)"
      >
        <div class="stat-label">成功</div>
        <div class="stat-value">{{ stats.success }}</div>
      </div>
      <div
        class="stat-card upgrading"
        :class="{ active: filterStatus === 1 || filterStatus === 2 }"
        @click="handleFilter(2)"
      >
        <div class="stat-label">升级中</div>
        <div class="stat-value">{{ stats.upgrading }}</div>
      </div>
      <div
        class="stat-card failed"
        :class="{ active: filterStatus === 4 }"
        @click="handleFilter(4)"
      >
        <div class="stat-label">失败</div>
        <div class="stat-value">{{ stats.failed }}</div>
      </div>
    </div>

    <!-- 设备列表 -->
    <div class="table-container">
      <el-table :data="deviceList" v-loading="loading" height="100%" stripe style="width: 100%">
        <el-table-column label="设备 UUID" prop="uuid" min-width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="消息/日志" prop="message" min-width="200" show-overflow-tooltip />
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import * as OtaApi from '@/api/modules/iot-ota'
import { formatDateTime } from '@/utils/formatters'

const props = defineProps<{ initialTaskId?: string }>()

const taskId = ref('')
const loading = ref(false)
const deviceList = ref<OtaApi.OTATaskDeviceInfoDTO[]>([])
const autoRefresh = ref(false)
const stats = reactive({ total: 0, success: 0, upgrading: 0, failed: 0 })
const filterStatus = ref<number | undefined>(undefined)

let timer: number | undefined = undefined

const fetchDevices = async () => {
  if (!taskId.value) return
  loading.value = true
  try {
    const res = await OtaApi.queryTaskDevices({
      otaTaskId: taskId.value,
      status: filterStatus.value,
      pageIndex: 1,
      pageSize: 100,
    })
    console.log('[UpgradeMonitor] fetchDevices raw:', res)

    // 适配
    const data = res

    // 字段名归一化
    deviceList.value = ((data.items as unknown as Record<string, unknown>[]) || []).map(
      (item: Record<string, unknown>) => ({
        uuid:
          (item.uuid as string) ||
          (item.Uuid as string) ||
          (item.UUID as string) ||
          (item.deviceId as string) ||
          (item.DeviceId as string),
        status: (item.status !== undefined ? item.status : item.Status) as number,
        message: (item.message as string) || (item.Message as string),
        updateTime: (item.updateTime as string) || (item.UpdateTime as string),
      }),
    ) as OtaApi.OTATaskDeviceInfoDTO[]

    // Note: If filtering by status, these stats will be based on the filtered list (current page).
    // Ideally we should get global stats from a separate API or the task info.
    // For now, we recalculate based on what we see.
    calculateStats()
  } catch (e: unknown) {
    console.error('[UpgradeMonitor] fetchDevices error:', e)
  } finally {
    loading.value = false
  }
}

const handleFilter = (status: number | undefined) => {
  filterStatus.value = status
  fetchDevices()
}

const calculateStats = () => {
  // Simple client-side stats (approximate if paginated/filtered)
  stats.total = deviceList.value.length
  stats.success = deviceList.value.filter((d) => d.status === 3).length
  stats.upgrading = deviceList.value.filter((d) => d.status === 1 || d.status === 2).length
  stats.failed = deviceList.value.filter((d) => d.status === 4).length
}

const getStatusText = (s: number) => ['待升级', '下载中', '升级中', '成功', '失败'][s] || '未知'
const getStatusType = (s: number) => ['info', 'primary', 'warning', 'success', 'danger'][s] || ''

watch(autoRefresh, (val) => {
  if (val) {
    timer = setInterval(fetchDevices, 3000)
  } else {
    clearInterval(timer)
  }
})

watch(
  () => props.initialTaskId,
  (val) => {
    if (val) {
      taskId.value = val
      fetchDevices()
    }
  },
  { immediate: true },
)

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.upgrade-monitor {
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.left-panel {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
  margin-bottom: 0;
}

.task-id-input {
  width: 240px;
}

.status-select {
  width: 140px;
}

.right-panel {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-label {
  font-size: 14px;
  color: #606266;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-card.active {
  background-color: #fff;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-card.success .stat-value {
  color: #67c23a;
}
.stat-card.upgrading .stat-value {
  color: #409eff;
}
.stat-card.failed .stat-value {
  color: #f56c6c;
}

.table-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
</style>
