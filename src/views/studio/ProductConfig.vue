<template>
  <div class="product-config">
    <div class="config-designer">
      <!-- 左侧：配置分类 -->
      <div class="config-sidebar">
        <div class="sidebar-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><Setting /></el-icon>
            </div>
            <div class="header-text">
              <h3>配置分类</h3>
              <p>选择配置项</p>
            </div>
          </div>
        </div>

        <div class="config-categories">
          <div
            v-for="category in configCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: activeCategory === category.id }"
            @click="activeCategory = category.id"
          >
            <div class="category-icon">
              <el-icon :size="20"><component :is="category.icon" /></el-icon>
            </div>
            <div class="category-info">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-desc">{{ category.description }}</div>
            </div>
            <el-tag v-if="category.status" :type="getStatusType(category.status)" size="small">
              {{ category.status === 'completed' ? '已配置' : '未配置' }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 右侧：配置详情 -->
      <div class="config-content">
        <div class="content-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon :size="24"><component :is="activeCategoryData?.icon || Setting" /></el-icon>
            </div>
            <div class="header-text">
              <h3>{{ activeCategoryData?.name || '配置详情' }}</h3>
              <p>{{ activeCategoryData?.description || '配置产品相关参数' }}</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="saveConfig" :loading="saving">
              <el-icon><Check /></el-icon>
              保存配置
            </el-button>
          </div>
        </div>

        <div class="config-panel" v-loading="loading">
          <!-- 多语言配置 -->
          <template v-if="activeCategory === 'languages'">
            <div class="config-section">
              <h4>支持语言</h4>
              <div class="language-selector">
                <div class="selected-languages">
                  <el-tag
                    v-for="lang in productConfig.languages.selected"
                    :key="lang.code"
                    closable
                    @close="removeLanguage(lang.code)"
                    class="language-tag"
                  >
                    {{ lang.name }} ({{ lang.code }})
                  </el-tag>
                </div>
                <el-select
                  v-model="newLanguage"
                  placeholder="添加语言"
                  @change="addLanguage"
                  style="width: 200px"
                >
                  <el-option
                    v-for="lang in availableLanguages"
                    :key="lang.code"
                    :label="`${lang.name} (${lang.code})`"
                    :value="lang.code"
                    :disabled="productConfig.languages.selected.some(l => l.code === lang.code)"
                  />
                </el-select>
              </div>
            </div>

            <div class="config-section">
              <h4>默认语言</h4>
              <el-radio-group v-model="productConfig.languages.default">
                <el-radio
                  v-for="lang in productConfig.languages.selected"
                  :key="lang.code"
                  :value="lang.code"
                >
                  {{ lang.name }}
                </el-radio>
              </el-radio-group>
            </div>

            <div class="config-section">
              <h4>语言包管理</h4>
              <div class="language-packages">
                <div
                  v-for="lang in productConfig.languages.selected"
                  :key="lang.code"
                  class="language-item"
                >
                  <div class="language-header">
                    <span class="language-name">{{ lang.name }}</span>
                    <el-button
                      type="primary"
                      size="small"
                      @click="editLanguagePack(lang)"
                    >
                      编辑翻译
                    </el-button>
                  </div>
                  <div class="translation-status">
                    <el-progress
                      :percentage="getTranslationProgress(lang.code)"
                      :status="getTranslationProgress(lang.code) === 100 ? 'success' : 'warning'"
                      :stroke-width="8"
                    />
                    <span class="progress-text">
                      {{ getTranslationProgress(lang.code) }}% 已翻译
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 告警配置 -->
          <template v-if="activeCategory === 'alerts'">
            <div class="config-section">
              <h4>告警规则</h4>
              <div class="alert-rules">
                <div
                  v-for="(rule, index) in productConfig.alerts.rules"
                  :key="index"
                  class="rule-item"
                >
                  <div class="rule-header">
                    <div class="rule-info">
                      <div class="rule-name">{{ rule.name }}</div>
                      <div class="rule-desc">{{ rule.description }}</div>
                    </div>
                    <div class="rule-controls">
                      <el-switch v-model="rule.enabled" size="small" />
                      <el-button type="danger" size="small" @click="removeAlertRule(index)">
                        删除
                      </el-button>
                    </div>
                  </div>
                  <div class="rule-config" v-if="rule.enabled">
                    <el-form label-width="100px" size="small">
                      <el-form-item label="触发条件">
                        <el-select v-model="rule.condition.type" style="width: 120px">
                          <el-option label="大于" value="gt" />
                          <el-option label="小于" value="lt" />
                          <el-option label="等于" value="eq" />
                          <el-option label="范围" value="range" />
                        </el-select>
                        <el-input-number
                          v-model="rule.condition.value"
                          style="width: 100px; margin-left: 8px"
                        />
                        <span v-if="rule.condition.type === 'range'" style="margin-left: 8px">至</span>
                        <el-input-number
                          v-if="rule.condition.type === 'range'"
                          v-model="rule.condition.maxValue"
                          style="width: 100px; margin-left: 8px"
                        />
                      </el-form-item>
                      <el-form-item label="告警级别">
                        <el-select v-model="rule.level">
                          <el-option label="低" value="low" />
                          <el-option label="中" value="medium" />
                          <el-option label="高" value="high" />
                          <el-option label="紧急" value="critical" />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="通知方式">
                        <el-checkbox-group v-model="rule.notifications">
                          <el-checkbox label="app">App推送</el-checkbox>
                          <el-checkbox label="sms">短信</el-checkbox>
                          <el-checkbox label="email">邮件</el-checkbox>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
                <el-button type="primary" @click="addAlertRule" style="margin-top: 16px">
                  <el-icon><Plus /></el-icon>
                  添加告警规则
                </el-button>
              </div>
            </div>

            <div class="config-section">
              <h4>告警模板</h4>
              <div class="alert-templates">
                <div class="template-item">
                  <div class="template-name">设备离线告警</div>
                  <div class="template-desc">当设备超过指定时间未上报数据时触发</div>
                  <el-button type="primary" size="small" @click="applyTemplate('offline')">
                    应用模板
                  </el-button>
                </div>
                <div class="template-item">
                  <div class="template-name">传感器异常告警</div>
                  <div class="template-desc">当传感器数值超出正常范围时触发</div>
                  <el-button type="primary" size="small" @click="applyTemplate('sensor')">
                    应用模板
                  </el-button>
                </div>
                <div class="template-item">
                  <div class="template-name">低电量告警</div>
                  <div class="template-desc">当设备电量低于设定值时触发</div>
                  <el-button type="primary" size="small" @click="applyTemplate('battery')">
                    应用模板
                  </el-button>
                </div>
              </div>
            </div>
          </template>

          <!-- 配网配置 -->
          <template v-if="activeCategory === 'networking'">
            <div class="config-section">
              <h4>配网方式</h4>
              <div class="networking-methods">
                <el-checkbox-group v-model="productConfig.networking.methods">
                  <el-checkbox label="wifi_ap">WiFi AP模式</el-checkbox>
                  <el-checkbox label="wifi_station">WiFi Station模式</el-checkbox>
                  <el-checkbox label="bluetooth">蓝牙配网</el-checkbox>
                  <el-checkbox label="zigbee">Zigbee配网</el-checkbox>
                  <el-checkbox label="lora">LoRa配网</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <div class="config-section">
              <h4>配网引导</h4>
              <el-form label-width="120px" size="small">
                <el-form-item label="引导标题">
                  <el-input v-model="productConfig.networking.guide.title" />
                </el-form-item>
                <el-form-item label="引导步骤">
                  <div class="guide-steps">
                    <div
                      v-for="(step, index) in productConfig.networking.guide.steps"
                      :key="index"
                      class="step-item"
                    >
                      <div class="step-number">{{ index + 1 }}</div>
                      <el-input
                        v-model="step.title"
                        placeholder="步骤标题"
                        style="flex: 1; margin-right: 8px"
                      />
                      <el-input
                        v-model="step.description"
                        placeholder="步骤描述"
                        style="flex: 2; margin-right: 8px"
                      />
                      <el-button type="danger" size="small" @click="removeGuideStep(index)">
                        删除
                      </el-button>
                    </div>
                    <el-button type="primary" size="small" @click="addGuideStep" style="margin-top: 8px">
                      添加步骤
                    </el-button>
                  </div>
                </el-form-item>
                <el-form-item label="超时时间">
                  <el-input-number
                    v-model="productConfig.networking.timeout"
                    :min="30"
                    :max="300"
                    suffix="秒"
                  />
                </el-form-item>
                <el-form-item label="重试次数">
                  <el-input-number
                    v-model="productConfig.networking.retryCount"
                    :min="1"
                    :max="10"
                  />
                </el-form-item>
              </el-form>
            </div>

            <div class="config-section">
              <h4>配网预览</h4>
              <div class="networking-preview">
                <div class="preview-device">
                  <div class="device-icon">
                    <el-icon size="48"><Connection /></el-icon>
                  </div>
                  <div class="device-name">{{ productConfig.networking.guide.title || '智能设备' }}</div>
                </div>
                <div class="preview-steps">
                  <div
                    v-for="(step, index) in productConfig.networking.guide.steps"
                    :key="index"
                    class="preview-step"
                  >
                    <div class="step-indicator">{{ index + 1 }}</div>
                    <div class="step-content">
                      <div class="step-title">{{ step.title }}</div>
                      <div class="step-desc">{{ step.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 安全配置 -->
          <template v-if="activeCategory === 'security'">
            <div class="config-section">
              <h4>安全设置</h4>
              <el-form label-width="120px" size="small">
                <el-form-item label="设备认证">
                <el-radio-group v-model="productConfig.security.authentication">
                  <el-radio value="none">无认证</el-radio>
                  <el-radio value="password">密码认证</el-radio>
                  <el-radio value="certificate">证书认证</el-radio>
                </el-radio-group>
                </el-form-item>
                <el-form-item label="数据加密">
                  <el-checkbox-group v-model="productConfig.security.encryption">
                    <el-checkbox label="transport">传输加密</el-checkbox>
                    <el-checkbox label="storage">存储加密</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="访问控制">
                  <el-switch v-model="productConfig.security.accessControl" />
                </el-form-item>
              </el-form>
            </div>

            <div class="config-section">
              <h4>固件安全</h4>
              <el-form label-width="120px" size="small">
                <el-form-item label="固件签名">
                  <el-switch v-model="productConfig.security.firmware.signature" />
                </el-form-item>
                <el-form-item label="完整性校验">
                  <el-switch v-model="productConfig.security.firmware.integrity" />
                </el-form-item>
                <el-form-item label="防降级攻击">
                  <el-switch v-model="productConfig.security.firmware.rollback" />
                </el-form-item>
              </el-form>
            </div>
          </template>

          <!-- 其他配置 -->
          <template v-if="activeCategory === 'advanced'">
            <div class="config-section">
              <h4>高级设置</h4>
              <el-form label-width="120px" size="small">
                <el-form-item label="心跳间隔">
                  <el-input-number
                    v-model="productConfig.advanced.heartbeatInterval"
                    :min="30"
                    :max="3600"
                    suffix="秒"
                  />
                </el-form-item>
                <el-form-item label="数据上报频率">
                  <el-select v-model="productConfig.advanced.reportFrequency">
                    <el-option label="实时" value="realtime" />
                    <el-option label="每分钟" value="1min" />
                    <el-option label="每5分钟" value="5min" />
                    <el-option label="每小时" value="1hour" />
                  </el-select>
                </el-form-item>
                <el-form-item label="日志级别">
                  <el-select v-model="productConfig.advanced.logLevel">
                    <el-option label="ERROR" value="error" />
                    <el-option label="WARN" value="warn" />
                    <el-option label="INFO" value="info" />
                    <el-option label="DEBUG" value="debug" />
                  </el-select>
                </el-form-item>
                <el-form-item label="本地存储">
                  <el-switch v-model="productConfig.advanced.localStorage" />
                </el-form-item>
                <el-form-item label="自动重启">
                  <el-switch v-model="productConfig.advanced.autoRestart" />
                </el-form-item>
              </el-form>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Setting,
  ChatDotRound,
  Bell,
  Connection,
  Lock,
  More,
  Check,
  Plus,
} from '@element-plus/icons-vue'

// Emits
const emit = defineEmits<{
  next: []
  save: [data: any]
}>()

// 响应式数据
const activeCategory = ref('languages')
const loading = ref(false)
const saving = ref(false)
const newLanguage = ref('')

// 配置分类
const configCategories = [
  {
    id: 'languages',
    name: '多语言配置',
    description: '设置产品支持的语言和翻译',
    icon: ChatDotRound,
    status: 'completed'
  },
  {
    id: 'alerts',
    name: '告警配置',
    description: '配置设备告警规则和通知',
    icon: Bell,
    status: 'pending'
  },
  {
    id: 'networking',
    name: '配网配置',
    description: '设置设备配网方式和引导',
    icon: Connection,
    status: 'pending'
  },
  {
    id: 'security',
    name: '安全配置',
    description: '配置设备安全和认证设置',
    icon: Lock,
    status: 'pending'
  },
  {
    id: 'advanced',
    name: '高级配置',
    description: '高级功能和性能设置',
    icon: More,
    status: 'pending'
  }
]

// 产品配置
const productConfig = reactive({
  languages: {
    selected: [
      { code: 'zh-CN', name: '中文(简体)' },
      { code: 'en-US', name: 'English' }
    ],
    default: 'zh-CN',
    translations: {
      'zh-CN': { progress: 100 },
      'en-US': { progress: 85 }
    }
  },
  alerts: {
    rules: [
      {
        name: '温度过高告警',
        description: '当温度超过设定值时触发告警',
        enabled: true,
        condition: { type: 'gt', value: 40, maxValue: null },
        level: 'high',
        notifications: ['app']
      }
    ]
  },
  networking: {
    methods: ['wifi_ap', 'bluetooth'],
    guide: {
      title: '智能温湿度传感器配网',
      steps: [
        { title: '开机', description: '长按电源键开机，等待指示灯闪烁' },
        { title: '进入配网模式', description: '指示灯快速闪烁时表示进入配网模式' },
        { title: '连接WiFi', description: '在手机WiFi列表中选择设备热点' },
        { title: '配置网络', description: '在浏览器中输入配置信息' },
        { title: '完成配网', description: '配网成功后指示灯常亮' }
      ]
    },
    timeout: 120,
    retryCount: 3
  },
  security: {
    authentication: 'password',
    encryption: ['transport'],
    accessControl: true,
    firmware: {
      signature: true,
      integrity: true,
      rollback: true
    }
  },
  advanced: {
    heartbeatInterval: 300,
    reportFrequency: '5min',
    logLevel: 'info',
    localStorage: true,
    autoRestart: true
  }
})

// 可用语言列表
const availableLanguages = [
  { code: 'zh-CN', name: '中文(简体)' },
  { code: 'zh-TW', name: '中文(繁体)' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'es-ES', name: 'Español' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'ru-RU', name: 'Русский' }
]

// 计算属性
const activeCategoryData = computed(() => {
  return configCategories.find(cat => cat.id === activeCategory.value)
})

// 方法
const getStatusType = (status: string) => {
  return status === 'completed' ? 'success' : 'warning'
}

const addLanguage = () => {
  const lang = availableLanguages.find(l => l.code === newLanguage.value)
  if (lang && !productConfig.languages.selected.some(l => l.code === lang.code)) {
    productConfig.languages.selected.push(lang)
    productConfig.languages.translations[lang.code] = { progress: 0 }
    newLanguage.value = ''
    ElMessage.success(`已添加 ${lang.name}`)
  }
}

const removeLanguage = (code: string) => {
  const index = productConfig.languages.selected.findIndex(l => l.code === code)
  if (index !== -1) {
    const lang = productConfig.languages.selected[index]
    productConfig.languages.selected.splice(index, 1)
    delete (productConfig.languages.translations as any)[code]

    // 如果删除的是默认语言，设置第一个语言为默认
    if (productConfig.languages.default === code && productConfig.languages.selected.length > 0) {
      productConfig.languages.default = productConfig.languages.selected[0].code
    }

    ElMessage.success(`已移除 ${lang?.name || '语言'}`)
  }
}

const getTranslationProgress = (code: string) => {
  return (productConfig.languages.translations as any)[code]?.progress || 0
}

const editLanguagePack = (lang: any) => {
  ElMessage.info(`编辑 ${lang.name} 语言包功能开发中...`)
}

const addAlertRule = () => {
  productConfig.alerts.rules.push({
    name: '新告警规则',
    description: '请配置告警条件',
    enabled: false,
    condition: { type: 'gt', value: 0, maxValue: null },
    level: 'medium',
    notifications: ['app']
  })
}

const removeAlertRule = (index: number) => {
  productConfig.alerts.rules.splice(index, 1)
}

const applyTemplate = (template: string) => {
  const templates: Record<string, any> = {
    offline: {
      name: '设备离线告警',
      description: '设备超过10分钟未上报数据',
      enabled: true,
      condition: { type: 'gt', value: 600 },
      level: 'high',
      notifications: ['app', 'sms']
    },
    sensor: {
      name: '传感器异常告警',
      description: '传感器数值超出正常范围',
      enabled: true,
      condition: { type: 'range', value: -50, maxValue: 100 },
      level: 'medium',
      notifications: ['app']
    },
    battery: {
      name: '低电量告警',
      description: '设备电量低于20%',
      enabled: true,
      condition: { type: 'lt', value: 20 },
      level: 'medium',
      notifications: ['app']
    }
  }

  productConfig.alerts.rules.push(templates[template])
  ElMessage.success('模板已应用')
}

const addGuideStep = () => {
  productConfig.networking.guide.steps.push({
    title: '新步骤',
    description: '请填写步骤说明'
  })
}

const removeGuideStep = (index: number) => {
  productConfig.networking.guide.steps.splice(index, 1)
}

const saveConfig = async () => {
  saving.value = true
  try {
    // 这里应该调用API保存配置
    await new Promise(resolve => setTimeout(resolve, 1000))
    emit('save', productConfig)
    ElMessage.success('配置保存成功')

    // 更新分类状态
    configCategories.forEach(cat => {
      cat.status = 'completed'
    })
  } catch (error) {
    ElMessage.error('配置保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.product-config {
  height: 100%;
  padding: 24px;
  background: var(--bg-canvas);

  .config-designer {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    height: 100%;

    .config-sidebar,
    .config-content {
      background: var(--bg-card);
      border: 1px solid var(--border-base);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-card);
    }

    .config-sidebar {
      .config-categories {
        flex: 1;
        padding: 0;

        .category-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-base);
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: var(--bg-canvas);
            transform: translateY(-2px);
          }

          &.active {
            border-left: 4px solid var(--el-color-primary);
            background: rgba(var(--el-color-primary-rgb), 0.05);
          }

          .category-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
          }

          .category-info {
            flex: 1;

            .category-name {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 4px;
            }

            .category-desc {
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }
      }
    }

    .config-content {
      .content-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-base);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;

          .header-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-text {
            h3 {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: var(--text-primary);
            }

            p {
              margin: 4px 0 0 0;
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }
      }

      .config-panel {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .config-section {
          padding: 20px;
          border-bottom: 1px solid var(--border-base);

          &:last-child {
            border-bottom: none;
          }

          h4 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }
        }

        .language-selector {
          .selected-languages {
            margin-bottom: 16px;

            .language-tag {
              margin-right: 8px;
              margin-bottom: 8px;
            }
          }
        }

        .language-packages {
          .language-item {
            padding: 16px;
            border: 1px solid var(--border-base);
            border-radius: 8px;
            margin-bottom: 12px;

            .language-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;

              .language-name {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
              }
            }

            .translation-status {
              display: flex;
              align-items: center;
              gap: 12px;

              .progress-text {
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
          }
        }

        .alert-rules {
          .rule-item {
            border: 1px solid var(--border-base);
            border-radius: 8px;
            margin-bottom: 16px;
            overflow: hidden;

            .rule-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px;
              background: var(--bg-canvas);

              .rule-info {
                .rule-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                  margin-bottom: 4px;
                }

                .rule-desc {
                  font-size: 12px;
                  color: var(--text-secondary);
                }
              }

              .rule-controls {
                display: flex;
                align-items: center;
                gap: 12px;
              }
            }

            .rule-config {
              padding: 16px;
              background: white;
            }
          }
        }

        .alert-templates {
          .template-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border: 1px solid var(--border-base);
            border-radius: 8px;
            margin-bottom: 12px;

            .template-name {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 4px;
            }

            .template-desc {
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }

        .networking-methods {
          margin-bottom: 16px;
        }

        .guide-steps {
          .step-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;

            .step-number {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: var(--el-color-primary);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              margin-right: 12px;
              flex-shrink: 0;
            }
          }
        }

        .networking-preview {
          .preview-device {
            text-align: center;
            padding: 24px;
            background: var(--bg-canvas);
            border-radius: 12px;
            margin-bottom: 20px;

            .device-icon {
              margin-bottom: 12px;
              color: var(--el-color-primary);
            }

            .device-name {
              font-size: 16px;
              font-weight: 600;
              color: var(--text-primary);
            }
          }

          .preview-steps {
            .preview-step {
              display: flex;
              align-items: flex-start;
              margin-bottom: 16px;

              .step-indicator {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--el-color-primary);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                margin-right: 16px;
                flex-shrink: 0;
              }

              .step-content {
                flex: 1;

                .step-title {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                  margin-bottom: 4px;
                }

                .step-desc {
                  font-size: 12px;
                  color: var(--text-secondary);
                  line-height: 1.4;
                }
              }
            }
          }
        }
      }
    }

    .sidebar-header,
    .content-header .header-content {
      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-text {
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }

          p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .config-designer {
    grid-template-columns: 1fr;

    .config-sidebar {
      order: 2;
    }

    .config-content {
      order: 1;
    }
  }
}

@media (max-width: 768px) {
  .product-config {
    padding: 16px;
  }

  .config-designer {
    gap: 16px;

    .sidebar-header,
    .content-header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }
    }

    .config-sidebar {
      .config-categories {
        .category-item {
          flex-direction: column;
          text-align: center;
          gap: 8px;

          .category-icon {
            margin-right: 0;
            margin-bottom: 8px;
          }
        }
      }
    }

    .config-content {
      .config-panel {
        .config-section {
          padding: 16px;
        }

        .guide-steps .step-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;

          .step-number {
            align-self: flex-start;
          }
        }

        .networking-preview {
          .preview-steps .preview-step {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            .step-indicator {
              align-self: flex-start;
            }
          }
        }
      }
    }
  }
}
</style>
