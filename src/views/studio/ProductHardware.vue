<template>
  <div class="hardware-dashboard">
    <div class="dashboard-header">
      <div>
        <h2 class="page-title">硬件规格定义 (Hardware Spec)</h2>
        <p class="page-subtitle">管理芯片选型、引脚复用及固件交付。</p>
      </div>
      <div class="status-badge" :class="{ ready: store.isHardwareReady }">
        {{ store.isHardwareReady ? '硬件就绪 (READY)' : '配置未完成 (INCOMPLETE)' }}
      </div>
    </div>

    <div class="cards-container">

      <div class="dashboard-card module-card">
        <div class="card-header">
          <span class="title">计算核心模组</span>
          <div class="header-actions">
            <el-tooltip content="下载产品规格书" placement="top" v-if="store.currentModule?.datasheetUrl">
              <a :href="store.currentModule.datasheetUrl" target="_blank" class="icon-btn">
                <el-icon>
                  <Document />
                </el-icon>
              </a>
            </el-tooltip>
            <el-button size="small" class="action-btn" @click="drawerState.module = true">
              更换
            </el-button>
          </div>
        </div>

        <div class="card-body" v-if="store.currentModule">
          <div class="chip-image-placeholder">
            <div class="chip-silkscreen">{{ store.currentModule.name }}</div>
          </div>
          <div class="chip-details">
            <div class="detail-row">
              <span class="label">架构 (Arch)</span>
              <span class="value">{{ store.currentModule.architecture }}</span>
            </div>
            <div class="detail-row">
              <span class="label">存储 (Memory)</span>
              <span class="value">{{ store.currentModule.flashSize }}MB Flash / {{ store.currentModule.ramSize }}KB
                RAM</span>
            </div>
            <div class="detail-row">
              <span class="label">主频 (Clock)</span>
              <span class="value">{{ store.currentModule.clockSpeed }} MHz</span>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else @click="drawerState.module = true">
          <el-icon :size="32">
            <Plus />
          </el-icon>
          <span>选择模组</span>
        </div>
      </div>

      <div class="dashboard-card pin-card">
        <div class="card-header">
          <span class="title">I/O 引脚配置</span>
          <el-button size="small" class="action-btn" @click="drawerState.pin = true">
            配置
          </el-button>
        </div>

        <div class="card-body scrollable">
          <div v-if="store.pinConfiguration.length > 0" class="mini-pin-list">
            <div v-for="item in store.pinConfiguration.slice(0, 5)" :key="item.pin" class="pin-row">
              <span class="pin-id">{{ item.pin }}</span>
              <el-icon class="arrow">
                <Right />
              </el-icon>
              <span class="pin-func">{{ item.function }}</span>
            </div>
            <div v-if="store.pinConfiguration.length > 5" class="more-indicator">
              + 还有 {{ store.pinConfiguration.length - 5 }} 个配置
            </div>
          </div>
          <div class="empty-state" v-else @click="drawerState.pin = true">
            <el-icon :size="32">
              <Setting />
            </el-icon>
            <span>配置引脚映射</span>
          </div>
        </div>
      </div>

      <div class="dashboard-card firmware-card">
        <div class="card-header">
          <span class="title">固件交付</span>
          <el-button size="small" class="action-btn" @click="drawerState.firmware = true">
            管理
          </el-button>
        </div>

        <div class="card-body">
          <div class="fw-status" v-if="latestFirmware">
            <div class="status-icon success"><el-icon>
                <Check />
              </el-icon></div>
            <div class="fw-info">
              <div class="fw-ver">{{ latestFirmware.version }}</div>
              <div class="fw-date">生成于 {{ new Date(latestFirmware.createdAt).toLocaleDateString() }}</div>
            </div>
            <el-button link type="primary">下载</el-button>
          </div>
          <div class="empty-state" v-else @click="drawerState.firmware = true">
            <el-icon :size="32">
              <Box />
            </el-icon>
            <span>暂无固件</span>
          </div>

          <div class="resource-summary" v-if="store.currentModule">
            <div class="bar-label">
              <span>资源负载 (RAM)</span>
              <span>{{ store.resourceAnalysis.ramPercentage }}%</span>
            </div>
            <el-progress :percentage="store.resourceAnalysis.ramPercentage" :show-text="false"
              :color="store.resourceAnalysis.riskLevel === 'critical' ? '#f56c6c' : '#10b981'" />
          </div>
        </div>
      </div>

    </div>

    <ModuleSelectDrawer v-model="drawerState.module" />
    <FirmwareManageDrawer v-model="drawerState.firmware" />
    <PinConfigModal v-model="drawerState.pin" />

  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useStudioStore } from '@/stores/studioStore';
import { Plus, Setting, Box, Right, Check, Document } from '@element-plus/icons-vue';

// 引入子组件
import ModuleSelectDrawer from './components/hardware/ModuleSelectDrawer.vue';
import FirmwareManageDrawer from './components/hardware/FirmwareManageDrawer.vue';
import PinConfigModal from './components/hardware/PinConfigModal.vue';

const store = useStudioStore();

// 控制所有抽屉/弹窗的状态
const drawerState = reactive({
  module: false,
  firmware: false,
  pin: false
});

const latestFirmware = computed(() => {
  return store.firmwareArtifacts.length > 0 ? store.firmwareArtifacts[0] : null;
});
</script>

<style scoped lang="scss">
/* 保持原有样式 */
.hardware-dashboard {
  height: 100%;
  padding: 32px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 4px;
    background: #e4e7ed;
    color: #909399;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;

    &.ready {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
  }
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.dashboard-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  height: 320px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.05);
    border-color: #d4a72c;
  }

  .card-header {
    padding: 20px;
    border-bottom: 1px solid #f5f7fa;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 12px;
      font-weight: 700;
      color: #909399;
      letter-spacing: 1px;
    }

    .action-btn {
      background: #1a1a1a;
      color: #d4a72c;
      border: none;
      font-weight: 600;

      &:hover {
        opacity: 0.9;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      // 文档图标按钮样式
      .icon-btn {
        color: #909399;
        font-size: 16px;
        display: flex;
        align-items: center;
        transition: all 0.2s;

        &:hover {
          color: #d4a72c;
          transform: scale(1.1);
        }
      }
    }

  }

  .card-body {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;

    &.scrollable {
      overflow-y: auto;
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    cursor: pointer;
    border: 2px dashed #ebeef5;
    border-radius: 8px;
    margin: 10px 0;
    transition: all 0.2s;

    &:hover {
      border-color: #d4a72c;
      color: #d4a72c;
      background: #fffbf0;
    }

    span {
      margin-top: 12px;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.chip-image-placeholder {
  height: 100px;
  background: #2b2b2b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);

  .chip-silkscreen {
    color: #777;
    font-family: monospace;
    font-weight: bold;
    font-size: 16px;
    letter-spacing: 2px;
  }
}

.chip-details {
  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 13px;

    .label {
      color: #909399;
    }

    .value {
      font-weight: 600;
      color: #303133;
    }
  }
}

.mini-pin-list {
  .pin-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f5f7fa;
    font-size: 13px;

    .pin-id {
      font-weight: 700;
      color: #303133;
    }

    .arrow {
      color: #d4a72c;
      font-size: 12px;
    }

    .pin-func {
      color: #606266;
      font-family: 'JetBrains Mono', monospace;
    }
  }

  .more-indicator {
    text-align: center;
    font-size: 11px;
    color: #909399;
    margin-top: 12px;
    font-style: italic;
  }
}

.fw-status {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: auto;

  .status-icon {
    width: 32px;
    height: 32px;
    background: #67c23a;
    border-radius: 50%;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }

  .fw-info {
    flex: 1;

    .fw-ver {
      font-weight: 700;
      color: #303133;
    }

    .fw-date {
      font-size: 11px;
      color: #606266;
      margin-top: 2px;
    }
  }
}

.resource-summary {
  margin-top: 20px;

  .bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }
}
</style>