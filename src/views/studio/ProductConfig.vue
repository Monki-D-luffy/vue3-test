<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">产品智能配置</h2>
        <p class="page-desc">
          配置产品的云端逻辑与交互表现。已启用
          <span class="highlight-num">{{ activeCount }}</span> / {{ configCards.length }} 个模块
        </p>
      </div>
      <div class="header-actions">
        <el-button round>重置默认</el-button>
        <el-button type="primary" color="#1f1f1f" class="gold-btn">预览面板</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col v-for="item in configCards" :key="item.id" :xs="24" :sm="12" :md="12" :lg="8" :xl="8">
        <div class="standard-card hover-effect" :class="{ 'is-selected': item.isActive }" @click="openDetail(item)">
          <div class="card-body">
            <div class="icon-wrapper">
              <el-icon :size="24" :color="item.isActive ? '#ffd700' : '#fff'">
                <component :is="item.icon" />
              </el-icon>
            </div>

            <div class="content-wrapper">
              <div class="card-header-row">
                <h3 class="card-title">{{ item.title }}</h3>
              </div>
              <p class="card-desc">{{ item.desc }}</p>

              <div class="tags-row">
                <el-tag v-for="tag in item.tags" :key="tag" size="small" class="black-gold-tag">
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <div class="switch-wrapper" @click.stop>
              <el-switch v-model="item.isActive" inline-prompt active-text="ON" inactive-text="OFF" class="gold-switch"
                @change="handleSwitchChange(item)" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <ConfigDrawer v-model="drawerVisible" :module-key="currentModuleKey" :title="currentModuleTitle"
      :icon="currentModuleIcon" @saved="handleConfigSaved" />
  </div>
</template>

<script setup lang="ts">
// ✅ FIX: 引入 shallowRef
import { ref, computed, markRaw, reactive, shallowRef } from 'vue'
import {
  Notebook, Connection, Timer, Share, Upload, Bell, InfoFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ConfigDrawer from './components/config/ConfigDrawer.vue'

// --- 1. 数据定义 ---
interface ConfigItem {
  id: number
  title: string
  desc: string
  icon: any
  tags: string[]
  isActive: boolean
}

const configCards = ref<ConfigItem[]>([
  { id: 1, title: '多语言 (I18N)', desc: '托管 App 端的文案翻译，支持 AI 补全。', icon: markRaw(Notebook), tags: ['标准', '高级'], isActive: true },
  { id: 2, title: '配网引导', desc: '自定义设备配网时的图文引导与排查。', icon: markRaw(Connection), tags: ['网关', 'App'], isActive: true },
  { id: 3, title: '云端定时', desc: '无硬件 RTC，通过云端下发指令实现定时。', icon: markRaw(Timer), tags: ['云端', '低功耗'], isActive: false },
  { id: 4, title: '场景联动', desc: '定义设备作为条件或动作时的自动化规则。', icon: markRaw(Share), tags: ['点对点', '群控'], isActive: false },
  { id: 5, title: '固件升级 (OTA)', desc: '配置自动升级策略、升级文案及灰度推送。', icon: markRaw(Upload), tags: ['组件', '无感'], isActive: true },
  { id: 6, title: '告警配置', desc: '设置设备离线、数值越界等异常推送通知。', icon: markRaw(Bell), tags: ['短信', '电话'], isActive: false }
])

const activeCount = computed(() => configCards.value.filter(c => c.isActive).length)

// --- 2. 交互逻辑 ---
const drawerVisible = ref(false)
const currentModuleKey = ref('')
const currentModuleTitle = ref('')
// ✅ 使用 shallowRef 避免 Vue 对图标组件进行深层响应式转换，提升性能
const currentModuleIcon = shallowRef<any>(null)

// 开关点击（不弹窗）
const handleSwitchChange = (item: ConfigItem) => {
  console.log('Switch toggled:', item.title, item.isActive)
}

// 卡片点击（弹窗）
const openDetail = (item: ConfigItem) => {
  // 映射 Item ID 或 Title 到具体的 moduleKey
  const keyMap: Record<number, string> = {
    2: 'provisioning', // 配网引导
    1: 'i18n',         // 多语言
    // 其他模块暂时未开发，可以留空或映射到 default
  };

  const key = keyMap[item.id];
  if (!key) {
    ElMessage.warning(`【${item.title}】模块配置面板正在开发中...`);
    return;
  }

  currentModuleKey.value = key;
  currentModuleTitle.value = item.title;
  currentModuleIcon.value = item.icon;
  drawerVisible.value = true;
}

const handleConfigSaved = () => {
  ElMessage.success({
    message: '配置已保存并同步至云端',
    type: 'success',
    offset: 60,
  })
}
</script>

<style scoped>
/* --- 全局容器 --- */
.page-container {
  background-color: var(--bg-canvas, #f5f7fa);
  min-height: 100vh;
  padding: 24px;
}

/* --- 头部 --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.page-desc {
  color: #606266;
  font-size: 14px;
}

.highlight-num {
  color: #d4af37;
  font-weight: bold;
  font-size: 16px;
}

.gold-btn {
  border: 1px solid #000;
  color: #d4af37 !important;
  background-color: #000 !important;
}

/* --- 卡片样式 (Tech-Noir Premium) --- */
.standard-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.standard-card:hover,
.standard-card.is-selected {
  border-color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #1f1f1f;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.content-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
}

.card-desc {
  font-size: 13px;
  color: #606266;
  margin: 0;
  line-height: 1.5;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* Tag 样式 */
:deep(.black-gold-tag) {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
  border-radius: 4px;
  border-style: solid;
  border-width: 1px;
}

.is-selected :deep(.black-gold-tag) {
  background-color: #000000;
  border-color: #000000;
  color: #d4af37;
}

/* 开关 */
.switch-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
  padding-left: 10px;
  align-self: center;
}

:deep(.gold-switch.el-switch) {
  --el-switch-on-color: #d4af37;
  --el-switch-off-color: #dcdfe6;
}
</style>