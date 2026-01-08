<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">产品智能配置</h2>
        <p class="page-desc">
          配置产品的云端逻辑与交互表现。已启用
          <span class="highlight-num">{{ activeCount }}</span> / {{ staticCards.length }} 个模块
        </p>
      </div>
      <div class="header-actions">
      </div>
    </div>

    <el-row :gutter="20">
      <el-col v-for="item in staticCards" :key="item.id" :xs="24" :sm="12" :md="12" :lg="8" :xl="8">
        <div class="standard-card hover-effect" :class="{ 'is-selected': getCardStatus(item.key) }"
          @click="openDetail(item)">
          <div class="card-body">
            <div class="icon-wrapper">
              <el-icon :size="24" :color="getCardStatus(item.key) ? '#ffd700' : '#fff'">
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
              <el-switch :model-value="getCardStatus(item.key)" inline-prompt active-text="ON" inactive-text="OFF"
                class="gold-switch" @change="(val: any) => handleSwitchChange(item, val as boolean)" />
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
import { ref, computed, markRaw } from 'vue'
import {
  Notebook, Connection, Timer, Share, Upload, Bell
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ConfigDrawer from './components/config/ConfigDrawer.vue'
import { useStudioStore } from '@/stores/studioStore' // ✅ 引入 Store

const store = useStudioStore()

// --- 静态卡片定义 (只存元数据，不存状态) ---
interface ConfigItem {
  id: number
  key: string       // ✅ 新增 key 字段，对应 Store 中的字段名
  title: string
  desc: string
  icon: any
  tags: string[]
}

const staticCards: ConfigItem[] = [
  { id: 1, key: 'i18n', title: '多语言 (I18N)', desc: '托管 App 端的文案翻译，支持 AI 补全。', icon: markRaw(Notebook), tags: ['标准', '高级'] },
  { id: 2, key: 'provisioning', title: '配网引导', desc: '自定义设备配网时的图文引导与排查。', icon: markRaw(Connection), tags: ['网关', 'App'] },
  { id: 3, key: 'cloudTimer', title: '云端定时', desc: '无硬件 RTC，通过云端下发指令实现定时。', icon: markRaw(Timer), tags: ['云端', '低功耗'] }, // ✅ 修正 key 为 cloudTimer
  { id: 4, key: 'scene', title: '场景联动', desc: '定义设备作为条件或动作时的自动化规则。', icon: markRaw(Share), tags: ['点对点', '群控'] },
  { id: 5, key: 'ota', title: '固件升级 (OTA)', desc: '配置自动升级策略、升级文案及灰度推送。', icon: markRaw(Upload), tags: ['组件', '无感'] },
  { id: 6, key: 'alert', title: '告警配置', desc: '设置设备离线、数值越界等异常推送通知。', icon: markRaw(Bell), tags: ['短信', '电话'] }
]

// --- 响应式状态获取 ---
// 核心：直接从 Store 读取 enabled 状态
const getCardStatus = (key: string) => {
  if (!store.productMetadata) return false
  const config = (store.productMetadata as any)[key]
  return config ? config.enabled : false
}

// 自动计算激活数量
const activeCount = computed(() => {
  return staticCards.filter(c => getCardStatus(c.key)).length
})

// --- 交互逻辑 ---
const drawerVisible = ref(false)
const currentModuleKey = ref('')
const currentModuleTitle = ref('')
const currentModuleIcon = ref<any>(null)

// 开关切换
const handleSwitchChange = async (item: ConfigItem, newVal: boolean) => {
  if (!store.productMetadata) return

  // 确保对象存在
  if (!(store.productMetadata as any)[item.key]) {
    (store.productMetadata as any)[item.key] = { enabled: newVal }
  } else {
    (store.productMetadata as any)[item.key].enabled = newVal
  }

  await store.saveMetadata() // 调用 Store 的保存方法
  ElMessage.success({
    message: `${item.title} 已${newVal ? '启用' : '禁用'}`,
    type: 'success',
    duration: 2000
  })
}

// 打开抽屉
const openDetail = (item: ConfigItem) => {
  // 暂未开发的模块拦截
  if (['scene'].includes(item.key)) {
    ElMessage.warning('该模块正在开发中...')
    return
  }

  // 映射 key (cloudTimer -> timer 以匹配 Drawer 里的组件映射)
  let drawerKey = item.key
  if (item.key === 'cloudTimer') drawerKey = 'timer'

  currentModuleKey.value = drawerKey
  currentModuleTitle.value = item.title
  currentModuleIcon.value = item.icon
  drawerVisible.value = true
}

const handleConfigSaved = () => {
  ElMessage.success('配置已保存')
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