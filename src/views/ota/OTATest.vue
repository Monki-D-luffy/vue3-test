<template>
  <div class="ota-test-page h-full flex flex-col p-4 bg-gray-50">
    <!-- 顶部标题 -->
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
        🛠️ OTA 综合测试台
        <el-tag size="small" effect="plain">Beta</el-tag>
      </h2>
      <div class="text-sm text-gray-500">
        当前环境: <span class="text-primary font-bold">Production</span>
      </div>
    </div>

    <!-- 主要内容区 (Tabs) -->
    <el-card
      class="flex-1 flex flex-col overflow-hidden"
      :body-style="{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '0',
      }"
    >
      <el-tabs v-model="activeTab" class="h-full flex flex-col custom-tabs">
        <!-- Tab 1: 固件库 -->
        <el-tab-pane label="固件资源库" name="repo" class="h-full">
          <div class="h-full p-4 overflow-hidden">
            <RepoManager />
          </div>
        </el-tab-pane>

        <!-- Tab 2: 任务管理 -->
        <el-tab-pane label="OTA 任务管理" name="task" class="h-full">
          <div class="h-full p-4 overflow-hidden">
            <TaskManager @monitor="handleGoToMonitor" />
          </div>
        </el-tab-pane>

        <!-- Tab 3: 升级监控 -->
        <el-tab-pane label="升级监控大屏" name="monitor" class="h-full">
          <div class="h-full p-4 overflow-hidden">
            <UpgradeMonitor :initial-task-id="monitorTaskId" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RepoManager from './components/RepoManager.vue'
import TaskManager from './components/TaskManager.vue'
import UpgradeMonitor from './components/UpgradeMonitor.vue'
import type { OTATaskDto } from '@/api/modules/iot-ota'

const activeTab = ref('repo')
const monitorTaskId = ref('')

const handleGoToMonitor = (task: OTATaskDto) => {
  monitorTaskId.value = task.otaTaskId
  activeTab.value = 'monitor'
}
</script>

<style scoped>
.ota-test-page {
  height: 100%;
  background-color: var(--el-bg-color-page);
}

/* 强制 Tabs 内容撑满 */
:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  height: 100%;
}
:deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

/* 通用工具类 (模拟 Tailwind) */
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.flex-1 {
  flex: 1;
}
.h-full {
  height: 100%;
}
.p-4 {
  padding: 1rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.overflow-hidden {
  overflow: hidden;
}
.text-xl {
  font-size: 1.25rem;
}
.font-bold {
  font-weight: 700;
}
.text-primary {
  color: var(--el-color-primary);
}
</style>
