<template>
  <div class="page-container">
    <!-- Header -->
    <div class="page-header">
      <div class="left">
        <el-button link @click="$emit('back')">
          <el-icon class="mr-1"><ArrowLeft /></el-icon> 返回列表
        </el-button>
        <span class="divider">|</span>
        <span class="title">版本发布</span>
      </div>
    </div>

    <!-- Task Info Card -->
    <div class="info-card">
      <div class="info-header">
        <span class="label">版本发布</span>
        <el-tag effect="light" type="success" size="small" class="version-tag">
          固件版本: {{ task.firmwareVersion }}
        </el-tag>
        <el-tag v-if="task.status === 1" type="success" size="small" effect="dark">发布中</el-tag>
        <el-tag v-else-if="task.status === 2" type="warning" size="small" effect="dark"
          >暂停中</el-tag
        >
      </div>
      <div class="info-body">
        <span class="info-item"
          >固件Key: <span class="mono">{{ task.otaTaskId }}</span></span
        >
        <span class="info-item"
          >所属产品: <span>{{ task.productName || task.productId }}</span></span
        >
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <h3 class="section-title">升级发布规则设置</h3>

      <div class="config-panel">
        <el-form label-width="100px" class="config-form">
          <el-form-item label="发布方式">
            <el-radio-group v-model="publishType" :disabled="isPublished">
              <el-radio :value="0">全量发布</el-radio>
              <el-radio :value="1">灰度发布</el-radio>
            </el-radio-group>
          </el-form-item>

          <template v-if="publishType === 1">
            <el-form-item label="灰度策略">
              <el-select v-model="grayPolicy" style="width: 200px" :disabled="isPublished">
                <el-option label="按比例" :value="0" />
                <el-option label="按数量" :value="1" />
              </el-select>
            </el-form-item>
            <el-form-item :label="grayPolicy === 0 ? '灰度比例(%)' : '灰度数量'">
              <el-input-number
                v-model="grayValue"
                :min="1"
                :max="grayPolicy === 0 ? 100 : 999999"
                :disabled="isPublished"
              />
              <div class="form-tip">
                {{
                  grayPolicy === 0
                    ? '默认灰度范围为当前可升级设备总数，表示可以控制发布的百分比'
                    : '表示可以控制发布的最大设备数量'
                }}
              </div>
            </el-form-item>
          </template>

          <el-form-item v-if="publishType === 0">
            <div class="form-tip">全量发布将向所有符合条件的设备推送此更新。</div>
          </el-form-item>

          <el-form-item>
            <div class="actions">
              <template v-if="task.status === 0 || task.status === 2">
                <el-button type="primary" @click="handlePublish" :loading="publishing">
                  {{ task.status === 2 ? '恢复发布' : '立即发布' }}
                </el-button>
              </template>
              <template v-else-if="task.status === 1">
                <el-button type="warning" @click="handlePause" :loading="publishing">
                  暂停发布
                </el-button>
                <el-button type="info" plain disabled> 版本升级发布执行中 </el-button>
              </template>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as OtaApi from '@/api/modules/iot-ota'

const props = defineProps<{
  task: OtaApi.OTATaskDto
}>()

const emit = defineEmits(['back', 'refresh'])

const publishType = ref(0)
const grayPolicy = ref(0)
const grayValue = ref(10)
const publishing = ref(false)

const isPublished = computed(() => {
  return props.task.status === 1 || props.task.status === 3
})

onMounted(() => {
  // Initialize state based on task
  if (props.task.upgradeMode === 1) {
    // Assuming 1 is Gray/Check
    publishType.value = 1
  } else {
    publishType.value = 0
  }
  // Note: API doesn't seem to return current gray policy in task dto,
  // so we default to defaults or would need a separate query if persistent.
})

const handlePublish = async () => {
  try {
    await ElMessageBox.confirm('确定要执行发布操作吗?', '确认', { type: 'warning' })
    publishing.value = true

    if (publishType.value === 0) {
      await OtaApi.publishFull(props.task.otaTaskId)
    } else {
      await OtaApi.publishGray({
        otaTaskId: props.task.otaTaskId,
        grayPolicy: grayPolicy.value,
        grayValue: grayValue.value,
      })
    }

    ElMessage.success('发布成功')
    emit('refresh')
    emit('back')
  } catch {
    // error handled by interceptor usually
  } finally {
    publishing.value = false
  }
}

const handlePause = async () => {
  try {
    await ElMessageBox.confirm('确定暂停发布?', '确认', { type: 'warning' })
    publishing.value = true
    await OtaApi.pausePublish(props.task.otaTaskId)
    ElMessage.success('已暂停')
    emit('refresh')
    emit('back')
  } catch {
  } finally {
    publishing.value = false
  }
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
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px 24px;
  margin-bottom: 32px;
}
.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.label {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.info-body {
  display: flex;
  gap: 32px;
  font-size: 14px;
  color: #606266;
}
.info-item {
  display: flex;
  gap: 8px;
}
.mono {
  font-family: monospace;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.config-panel {
  max-width: 800px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}
</style>
