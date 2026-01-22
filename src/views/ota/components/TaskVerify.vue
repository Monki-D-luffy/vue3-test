<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="left">
        <el-button link @click="$emit('back')">
          <el-icon class="mr-1"><ArrowLeft /></el-icon> 返回列表
        </el-button>
        <span class="divider">|</span>
        <span class="title">测试设备验证</span>
      </div>
    </div>

    <!-- Task Info Card -->
    <div class="info-card">
      <div class="info-row">
        <span class="page-title-text">测试设备验证</span>
        <el-tag type="success" effect="light" class="version-tag"
          >固件版本: {{ task.firmwareVersion }}</el-tag
        >
      </div>
      <div class="info-row details">
        <span class="detail-item">任务ID: {{ task.otaTaskId }}</span>
        <span class="detail-item">所属产品: {{ task.productName || task.productId }}</span>
        <span class="detail-item">固件库: {{ task.repoName || task.firmwaresRepoId }}</span>
      </div>
      <div class="action-area">
        <el-button type="primary" color="#0066ff" @click="openAddDialog">通过设备号添加</el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <el-table
        :data="deviceList"
        v-loading="loading"
        class="device-table"
        header-cell-class-name="table-header"
      >
        <el-table-column prop="uuid" label="设备ID" min-width="200">
          <template #default="{ row }">
            {{ row.uuid || row.deviceId || row.DeviceId || row.did || row.DeviceID }}
          </template>
        </el-table-column>
        <el-table-column prop="firmwareVersion" label="版本" width="150" align="center">
          <template #default="{ row }">
            {{ row.currentVersion || row.version || row.Version || row.CurrentVersion || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleRemove(row)">移除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <span class="empty-text">尚未添加测试设备</span>
          </div>
        </template>
      </el-table>
    </div>

    <!-- Add Device Dialog -->
    <el-dialog v-model="addDialogVisible" title="添加测试设备" width="500px">
      <el-form>
        <el-form-item label="设备ID" required>
          <el-input v-model="newDeviceUuid" placeholder="请输入设备UUID/DID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddDevice" :loading="adding">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as OtaApi from '@/api/modules/iot-ota'

const props = defineProps<{
  task: OtaApi.OTATaskDto
}>()

defineEmits(['back'])

const loading = ref(false)
const deviceList = ref<OtaApi.OTATaskDeviceInfoDTO[]>([])
const addDialogVisible = ref(false)
const newDeviceUuid = ref('')
const adding = ref(false)

onMounted(() => {
  fetchDevices()
})

const fetchDevices = async () => {
  loading.value = true
  try {
    const res = await OtaApi.queryVerifyDevices(props.task.otaTaskId)
    const data =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res
    console.log('Verify Devices Data:', data) // Debug log
    deviceList.value = ((data.items as Record<string, unknown>[]) || []).map(
      (item: Record<string, unknown>) => ({
        uuid:
          (item.uuid as string) ||
          (item.Uuid as string) ||
          (item.UUID as string) ||
          (item.deviceId as string) ||
          (item.DeviceId as string),
        currentVersion:
          (item.currentVersion as string) ||
          (item.version as string) ||
          (item.Version as string) ||
          (item.CurrentVersion as string),
        status: (item.status !== undefined ? item.status : item.Status) as number,
        message: (item.message as string) || (item.Message as string),
        updateTime: (item.updateTime as string) || (item.UpdateTime as string),
      }),
    ) as OtaApi.OTATaskDeviceInfoDTO[]
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  newDeviceUuid.value = ''
  addDialogVisible.value = true
}

const submitAddDevice = async () => {
  if (!newDeviceUuid.value) return ElMessage.warning('请输入设备ID')
  adding.value = true
  try {
    const success = await OtaApi.addVerifyDevice(props.task.otaTaskId, newDeviceUuid.value)
    if (success) {
      ElMessage.success('添加成功')
      addDialogVisible.value = false
      fetchDevices()
    } else {
      ElMessage.error('添加失败')
    }
  } finally {
    adding.value = false
  }
}

const handleRemove = async (row: OtaApi.OTATaskDeviceInfoDTO) => {
  const uuid = row.uuid
  try {
    await ElMessageBox.confirm(`确定要移除设备 ${uuid} 吗?`, '提示', { type: 'warning' })
    await OtaApi.removeVerifyDevice(props.task.otaTaskId, uuid)
    ElMessage.success('已移除')
    fetchDevices()
  } catch {}
}
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.left {
  display: flex;
  align-items: center;
}
.divider {
  margin: 0 12px;
  color: #dcdfe6;
}
.title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.info-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 24px;
  background: #fff;
  position: relative;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.info-row.details {
  color: #909399;
  font-size: 13px;
  margin-bottom: 0;
}
.page-title-text {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.detail-item {
  margin-right: 24px;
}
.action-area {
  position: absolute;
  right: 20px;
  top: 20px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.device-table {
  width: 100%;
}
.empty-state {
  padding: 60px 0;
  text-align: center;
}
.empty-text {
  color: #c0c4cc;
  font-size: 14px;
}

:deep(.table-header) {
  background-color: #f5f7fa !important;
  color: #606266;
  font-weight: bold;
}
</style>
