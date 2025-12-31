<template>
  <div class="product-panel">
    <div class="panel-designer">
      <!-- 左侧：组件面板 -->
      <div class="component-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><Box /></el-icon>
            </div>
            <div class="header-text">
              <h3>组件库</h3>
              <p>拖拽添加面板组件</p>
            </div>
          </div>
          <div class="component-filter">
            <el-radio-group v-model="componentCategory" size="small">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="control">控制</el-radio-button>
              <el-radio-button value="display">显示</el-radio-button>
              <el-radio-button value="sensor">传感器</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="component-list">
          <div
            v-for="component in filteredComponents"
            :key="component.id"
            class="component-item"
            draggable="true"
            @dragstart="handleDragStart($event, component)"
          >
            <div class="component-icon">
              <el-icon :size="24"><component :is="component.icon" /></el-icon>
            </div>
            <div class="component-info">
              <div class="component-name">{{ component.name }}</div>
              <div class="component-desc">{{ component.description }}</div>
            </div>
            <el-tag :type="component.category === 'control' ? 'primary' : component.category === 'display' ? 'success' : 'warning'" size="small">
              {{ getCategoryText(component.category) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 中间：手机模拟器 -->
      <div class="phone-simulator">
        <div class="simulator-header">
          <span class="simulator-title">面板预览</span>
          <div class="simulator-controls">
            <el-select v-model="previewSize" size="small" style="width: 100px">
              <el-option label="手机" value="mobile" />
              <el-option label="平板" value="tablet" />
            </el-select>
            <el-button type="primary" size="small" @click="togglePreviewMode">
              {{ previewMode ? '编辑模式' : '预览模式' }}
            </el-button>
          </div>
        </div>

        <div class="phone-frame" :class="previewSize">
          <div class="phone-screen">
            <div class="panel-canvas" @drop="handleDrop" @dragover="handleDragOver">
              <!-- 面板标题 -->
              <div class="panel-title" v-if="panelConfig.title">
                {{ panelConfig.title }}
              </div>

              <!-- 已添加的组件 -->
              <div class="canvas-components">
                <div
                  v-for="(component, index) in panelComponents"
                  :key="component.id + index"
                  class="canvas-component"
                  :class="{ selected: selectedComponentIndex === index }"
                  :style="getComponentStyle(component) as any"
                  @click="selectComponent(index)"
                  v-show="!previewMode"
                >
                  <div class="component-overlay" v-if="!previewMode">
                    <div class="component-toolbar">
                      <el-button link type="danger" size="small" @click.stop="removeComponent(index)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>

                  <!-- 组件内容 -->
                  <component :is="getComponentView(component)" :config="component.config" :data="component.data" />
                </div>
              </div>

              <!-- 空状态提示 -->
              <div v-if="panelComponents.length === 0" class="empty-canvas">
                <el-empty description="拖拽左侧组件到此处开始设计面板">
                  <template #image>
                    <el-icon size="64" style="color: #c0c4cc;"><Picture /></el-icon>
                  </template>
                </el-empty>
              </div>

              <!-- 预览模式遮罩 -->
              <div v-if="previewMode" class="preview-overlay">
                <div class="preview-indicator">预览模式</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：属性面板 -->
      <div class="property-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><Setting /></el-icon>
            </div>
            <div class="header-text">
              <h3>属性配置</h3>
              <p>配置选中组件属性</p>
            </div>
          </div>
        </div>

        <div class="property-content">
          <template v-if="selectedComponent">
            <div class="property-section">
              <h4>基本属性</h4>
              <el-form label-width="80px" size="small">
                <el-form-item label="组件名">
                  <el-input v-model="selectedComponent.name" />
                </el-form-item>
                <el-form-item label="位置 X">
                  <el-input-number v-model="selectedComponent.x" :min="0" :max="300" />
                </el-form-item>
                <el-form-item label="位置 Y">
                  <el-input-number v-model="selectedComponent.y" :min="0" :max="600" />
                </el-form-item>
                <el-form-item label="宽度">
                  <el-input-number v-model="selectedComponent.width" :min="50" :max="300" />
                </el-form-item>
                <el-form-item label="高度">
                  <el-input-number v-model="selectedComponent.height" :min="30" :max="200" />
                </el-form-item>
              </el-form>
            </div>

            <!-- 组件特定配置 -->
            <div class="property-section">
              <h4>组件配置</h4>
              <component :is="getPropertyEditor(selectedComponent.type)" :config="selectedComponent.config" @update="updateComponentConfig" />
            </div>
          </template>

          <template v-else-if="panelComponents.length > 0">
            <div class="no-selection">
              <el-empty description="请先选择一个组件进行配置" />
            </div>
          </template>

          <template v-else>
            <div class="no-components">
              <el-empty description="请先添加组件到面板" />
            </div>
          </template>
        </div>

        <!-- 面板全局配置 -->
        <div class="panel-config">
          <div class="config-section">
            <h4>面板设置</h4>
            <el-form label-width="80px" size="small">
              <el-form-item label="面板标题">
                <el-input v-model="panelConfig.title" placeholder="输入面板标题" />
              </el-form-item>
              <el-form-item label="背景色">
                <el-color-picker v-model="panelConfig.backgroundColor" />
              </el-form-item>
              <el-form-item label="主题">
                <el-select v-model="panelConfig.theme">
                  <el-option label="浅色" value="light" />
                  <el-option label="深色" value="dark" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  Box,
  Picture,
  Setting,
  Delete,
  Switch,
  Odometer,
  Sunny,
  WindPower,
  Lock,
  DataLine,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'

// 组件类型定义
interface PanelComponent {
  id: string
  type: string
  name: string
  x: number
  y: number
  width: number
  height: number
  config: any
  data: any
}

interface ComponentTemplate {
  id: string
  name: string
  type: string
  category: 'control' | 'display' | 'sensor'
  icon: any
  description: string
  defaultConfig: any
  defaultData: any
}

// Emits
const emit = defineEmits<{
  next: []
  save: [data: any]
}>()

// 响应式数据
const componentCategory = ref<'all' | 'control' | 'display' | 'sensor'>('all')
const previewSize = ref<'mobile' | 'tablet'>('mobile')
const previewMode = ref(false)
const selectedComponentIndex = ref<number | null>(null)
const panelComponents = ref<PanelComponent[]>([])
const panelConfig = reactive({
  title: '智能控制面板',
  backgroundColor: '#ffffff',
  theme: 'light' as 'light' | 'dark'
})

// 组件库
const componentLibrary: ComponentTemplate[] = [
  {
    id: 'switch',
    name: '开关',
    type: 'switch',
    category: 'control',
    icon: Switch,
    description: '开关控制组件',
    defaultConfig: { defaultValue: false, label: '开关' },
    defaultData: { value: false }
  },
  {
    id: 'slider',
    name: '滑块',
    type: 'slider',
    category: 'control',
    icon: Sunny,
    description: '数值调节滑块',
    defaultConfig: { min: 0, max: 100, step: 1, unit: '%', label: '亮度' },
    defaultData: { value: 50 }
  },
  {
    id: 'number-display',
    name: '数值显示',
    type: 'number-display',
    category: 'display',
    icon: Odometer,
    description: '数值数据显示',
    defaultConfig: { unit: '°C', decimals: 1, label: '温度' },
    defaultData: { value: 25.5 }
  },
  {
    id: 'status-indicator',
    name: '状态指示器',
    type: 'status-indicator',
    category: 'display',
    icon: DataLine,
    description: '设备状态显示',
    defaultConfig: { label: '设备状态', successText: '正常', errorText: '异常' },
    defaultData: { status: 'success' }
  },
  {
    id: 'fan-control',
    name: '风扇控制',
    type: 'fan-control',
    category: 'control',
    icon: WindPower,
    description: '风扇转速控制',
    defaultConfig: { speeds: ['关闭', '低速', '中速', '高速'], label: '风扇' },
    defaultData: { speed: 0 }
  },
  {
    id: 'temperature-sensor',
    name: '温度传感器',
    type: 'temperature-sensor',
    category: 'sensor',
    icon: Odometer,
    description: '温度传感器显示',
    defaultConfig: { unit: '°C', minTemp: -40, maxTemp: 125, label: '温度' },
    defaultData: { temperature: 25.0, humidity: 60.0 }
  }
]

// 计算属性
const filteredComponents = computed(() => {
  if (componentCategory.value === 'all') {
    return componentLibrary
  }
  return componentLibrary.filter(comp => comp.category === componentCategory.value)
})

const selectedComponent = computed(() => {
  if (selectedComponentIndex.value === null) return null
  return panelComponents.value[selectedComponentIndex.value]
})

// 方法
const getCategoryText = (category: string) => {
  const map: Record<string, string> = {
    control: '控制',
    display: '显示',
    sensor: '传感器'
  }
  return map[category] || category
}

const handleDragStart = (event: DragEvent, component: ComponentTemplate) => {
  event.dataTransfer!.setData('application/json', JSON.stringify(component))
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const componentData = event.dataTransfer!.getData('application/json')
  if (!componentData) return

  try {
    const template: ComponentTemplate = JSON.parse(componentData)
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left - 50 // 减去组件宽度的一半
    const y = event.clientY - rect.top - 25  // 减去组件高度的一半

    const newComponent: PanelComponent = {
      id: template.id + Date.now(),
      type: template.type,
      name: template.name,
      x: Math.max(0, Math.min(x, 300 - 100)), // 限制在画布范围内
      y: Math.max(0, Math.min(y, 600 - 50)),
      width: 100,
      height: 50,
      config: { ...template.defaultConfig },
      data: { ...template.defaultData }
    }

    panelComponents.value.push(newComponent)
    selectedComponentIndex.value = panelComponents.value.length - 1
  } catch (error) {
    console.error('Failed to parse component data:', error)
  }
}

const selectComponent = (index: number) => {
  if (previewMode.value) return
  selectedComponentIndex.value = index
}

const removeComponent = (index: number) => {
  panelComponents.value.splice(index, 1)
  if (selectedComponentIndex.value === index) {
    selectedComponentIndex.value = null
  }
}

const getComponentStyle = (component: PanelComponent) => {
  return {
    position: 'absolute',
    left: `${component.x}px`,
    top: `${component.y}px`,
    width: `${component.width}px`,
    height: `${component.height}px`,
  }
}

const togglePreviewMode = () => {
  previewMode.value = !previewMode.value
  if (previewMode.value) {
    selectedComponentIndex.value = null
  }
}

const updateComponentConfig = (newConfig: any) => {
  if (selectedComponent.value) {
    selectedComponent.value.config = { ...selectedComponent.value.config, ...newConfig }
  }
}

// 组件渲染方法
const getComponentView = (component: PanelComponent) => {
  const componentMap: Record<string, any> = {
    switch: SwitchComponent,
    slider: SliderComponent,
    'number-display': NumberDisplayComponent,
    'status-indicator': StatusIndicatorComponent,
    'fan-control': FanControlComponent,
    'temperature-sensor': TemperatureSensorComponent,
  }
  return componentMap[component.type] || DefaultComponent
}

const getPropertyEditor = (type: string) => {
  const editorMap: Record<string, any> = {
    switch: SwitchPropertyEditor,
    slider: SliderPropertyEditor,
    'number-display': NumberDisplayPropertyEditor,
    'status-indicator': StatusIndicatorPropertyEditor,
    'fan-control': FanControlPropertyEditor,
    'temperature-sensor': TemperatureSensorPropertyEditor,
  }
  return editorMap[type] || DefaultPropertyEditor
}

// 组件视图组件
const SwitchComponent = {
  props: ['config', 'data'],
  template: `
    <div class="switch-component">
      <div class="component-label">{{ config.label }}</div>
      <el-switch v-model="data.value" :disabled="true" />
    </div>
  `
}

const SliderComponent = {
  props: ['config', 'data'],
  template: `
    <div class="slider-component">
      <div class="component-label">{{ config.label }}</div>
      <el-slider v-model="data.value" :min="config.min" :max="config.max" :step="config.step" :disabled="true" />
      <div class="value-display">{{ data.value }}{{ config.unit }}</div>
    </div>
  `
}

const NumberDisplayComponent = {
  props: ['config', 'data'],
  template: `
    <div class="number-display-component">
      <div class="component-label">{{ config.label }}</div>
      <div class="value">{{ data.value.toFixed(config.decimals) }}{{ config.unit }}</div>
    </div>
  `
}

const StatusIndicatorComponent = {
  props: ['config', 'data'],
  template: `
    <div class="status-indicator-component">
      <div class="component-label">{{ config.label }}</div>
      <el-tag :type="data.status === 'success' ? 'success' : 'danger'">
        {{ data.status === 'success' ? config.successText : config.errorText }}
      </el-tag>
    </div>
  `
}

const FanControlComponent = {
  props: ['config', 'data'],
  template: `
    <div class="fan-control-component">
      <div class="component-label">{{ config.label }}</div>
      <el-select v-model="data.speed" :disabled="true" size="small">
        <el-option v-for="(speed, index) in config.speeds" :key="index" :label="speed" :value="index" />
      </el-select>
    </div>
  `
}

const TemperatureSensorComponent = {
  props: ['config', 'data'],
  template: `
    <div class="temperature-sensor-component">
      <div class="component-label">{{ config.label }}</div>
      <div class="sensor-values">
        <div class="value">{{ data.temperature.toFixed(1) }}°C</div>
        <div class="sub-value">{{ data.humidity.toFixed(0) }}% RH</div>
      </div>
    </div>
  `
}

const DefaultComponent = {
  props: ['config', 'data'],
  template: `
    <div class="default-component">
      <div class="component-label">{{ config.label || '未配置组件' }}</div>
    </div>
  `
}

// 属性编辑器组件
const SwitchPropertyEditor = {
  props: ['config'],
  emits: ['update'],
  template: `
    <el-form label-width="80px" size="small">
      <el-form-item label="标签">
        <el-input v-model="localConfig.label" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="默认值">
        <el-switch v-model="localConfig.defaultValue" @change="emitUpdate" />
      </el-form-item>
    </el-form>
  `,
  setup(props: any, { emit }: any) {
    const localConfig = ref({ ...props.config })

    const emitUpdate = () => {
      emit('update', localConfig.value)
    }

    return { localConfig, emitUpdate }
  }
}

const SliderPropertyEditor = {
  props: ['config'],
  emits: ['update'],
  template: `
    <el-form label-width="80px" size="small">
      <el-form-item label="标签">
        <el-input v-model="localConfig.label" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="最小值">
        <el-input-number v-model="localConfig.min" @change="emitUpdate" />
      </el-form-item>
      <el-form-item label="最大值">
        <el-input-number v-model="localConfig.max" @change="emitUpdate" />
      </el-form-item>
      <el-form-item label="步长">
        <el-input-number v-model="localConfig.step" @change="emitUpdate" :min="0.1" />
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="localConfig.unit" @input="emitUpdate" />
      </el-form-item>
    </el-form>
  `,
  setup(props: any, { emit }: any) {
    const localConfig = ref({ ...props.config })

    const emitUpdate = () => {
      emit('update', localConfig.value)
    }

    return { localConfig, emitUpdate }
  }
}

const NumberDisplayPropertyEditor = {
  props: ['config'],
  emits: ['update'],
  template: `
    <el-form label-width="80px" size="small">
      <el-form-item label="标签">
        <el-input v-model="localConfig.label" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="localConfig.unit" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="小数位数">
        <el-input-number v-model="localConfig.decimals" @change="emitUpdate" :min="0" :max="3" />
      </el-form-item>
    </el-form>
  `,
  setup(props: any, { emit }: any) {
    const localConfig = ref({ ...props.config })

    const emitUpdate = () => {
      emit('update', localConfig.value)
    }

    return { localConfig, emitUpdate }
  }
}

const StatusIndicatorPropertyEditor = {
  props: ['config'],
  emits: ['update'],
  template: `
    <el-form label-width="80px" size="small">
      <el-form-item label="标签">
        <el-input v-model="localConfig.label" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="正常文本">
        <el-input v-model="localConfig.successText" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="异常文本">
        <el-input v-model="localConfig.errorText" @input="emitUpdate" />
      </el-form-item>
    </el-form>
  `,
  setup(props: any, { emit }: any) {
    const localConfig = ref({ ...props.config })

    const emitUpdate = () => {
      emit('update', localConfig.value)
    }

    return { localConfig, emitUpdate }
  }
}

const FanControlPropertyEditor = {
  props: ['config'],
  emits: ['update'],
  template: `
    <el-form label-width="80px" size="small">
      <el-form-item label="标签">
        <el-input v-model="localConfig.label" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="档位设置">
              <el-input v-model="speedsText" @input="() => updateSpeeds()" placeholder="用逗号分隔，如：关闭,低速,中速,高速" />
      </el-form-item>
    </el-form>
  `,
  setup(props: any, { emit }: any) {
    const localConfig = ref({ ...props.config })
    const speedsText = ref(localConfig.value.speeds.join(','))

    const emitUpdate = () => {
      emit('update', localConfig.value)
    }

    const updateSpeeds = () => {
      localConfig.value.speeds = speedsText.value.split(',').map(s => s.trim())
      emitUpdate()
    }

    return { localConfig, speedsText, emitUpdate, updateSpeeds }
  }
}

const TemperatureSensorPropertyEditor = {
  props: ['config'],
  emits: ['update'],
  template: `
    <el-form label-width="80px" size="small">
      <el-form-item label="标签">
        <el-input v-model="localConfig.label" @input="emitUpdate" />
      </el-form-item>
      <el-form-item label="单位">
        <el-select v-model="localConfig.unit" @change="emitUpdate">
          <el-option label="°C" value="°C" />
          <el-option label="°F" value="°F" />
          <el-option label="K" value="K" />
        </el-select>
      </el-form-item>
      <el-form-item label="最小温度">
        <el-input-number v-model="localConfig.minTemp" @change="emitUpdate" />
      </el-form-item>
      <el-form-item label="最大温度">
        <el-input-number v-model="localConfig.maxTemp" @change="emitUpdate" />
      </el-form-item>
    </el-form>
  `,
  setup(props: any, { emit }: any) {
    const localConfig = ref({ ...props.config })

    const emitUpdate = () => {
      emit('update', localConfig.value)
    }

    return { localConfig, emitUpdate }
  }
}

const DefaultPropertyEditor = {
  template: `
    <div class="default-property-editor">
      <p>此组件暂无特殊配置项</p>
    </div>
  `
}
</script>

<style lang="scss" scoped>
.product-panel {
  height: 100%;
  padding: 24px;
  background: var(--bg-canvas);

  .panel-designer {
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    gap: 24px;
    height: 100%;

    .component-panel,
    .property-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-base);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-card);
    }

    .component-panel {
      .component-list {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .component-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-base);
          cursor: grab;
          transition: all 0.3s ease;

          &:hover {
            background: var(--bg-canvas);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          &:active {
            cursor: grabbing;
          }

          .component-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
          }

          .component-info {
            flex: 1;

            .component-name {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 4px;
            }

            .component-desc {
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }
      }
    }

    .phone-simulator {
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border: 1px solid var(--border-base);
      border-radius: 16px;
      box-shadow: var(--shadow-card);

      .simulator-header {
        padding: 16px 24px;
        border-bottom: 1px solid var(--border-base);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .simulator-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .simulator-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }

      .phone-frame {
        flex: 1;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;

        &.mobile {
          .phone-screen {
            width: 320px;
            height: 640px;
          }
        }

        &.tablet {
          .phone-screen {
            width: 480px;
            height: 640px;
          }
        }

        .phone-screen {
          background: #000;
          border-radius: 24px;
          padding: 12px;
          position: relative;

          .panel-canvas {
            width: 100%;
            height: 100%;
            background: #fff;
            border-radius: 16px;
            position: relative;
            overflow: hidden;

            .panel-title {
              text-align: center;
              padding: 16px;
              font-size: 18px;
              font-weight: 600;
              color: var(--text-primary);
              background: var(--bg-canvas);
              border-bottom: 1px solid var(--border-base);
            }

            .canvas-components {
              position: relative;
              height: calc(100% - 69px);

              .canvas-component {
                position: absolute;
                border: 2px dashed transparent;
                border-radius: 8px;
                transition: all 0.3s ease;
                cursor: pointer;

                &:hover,
                &.selected {
                  border-color: var(--el-color-primary);
                  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
                }

                .component-overlay {
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: rgba(255, 255, 255, 0.9);
                  display: flex;
                  align-items: flex-start;
                  justify-content: flex-end;
                  padding: 8px;
                  opacity: 0;
                  transition: opacity 0.3s ease;

                  .component-toolbar {
                    background: white;
                    border-radius: 6px;
                    box-shadow: var(--shadow-card);
                    padding: 4px;
                  }
                }

                &:hover .component-overlay {
                  opacity: 1;
                }
              }
            }

            .empty-canvas {
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .preview-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding: 16px;

              .preview-indicator {
                background: var(--el-color-primary);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
              }
            }
          }
        }
      }
    }

    .property-panel {
      .property-content {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .property-section {
          padding: 20px;
          border-bottom: 1px solid var(--border-base);

          h4 {
            margin: 0 0 16px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }

          &:last-child {
            border-bottom: none;
          }
        }

        .no-selection,
        .no-components {
          padding: 40px 20px;
          text-align: center;
        }
      }

      .panel-config {
        border-top: 1px solid var(--border-base);

        .config-section {
          padding: 20px;

          h4 {
            margin: 0 0 16px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }
        }
      }
    }

    .panel-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-base);

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

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

      .component-filter {
        display: flex;
        justify-content: center;
      }
    }
  }
}

// 组件样式
.switch-component,
.slider-component,
.number-display-component,
.status-indicator-component,
.fan-control-component,
.temperature-sensor-component,
.default-component {
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-card);

  .component-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
    text-align: center;
  }
}

.slider-component {
  .value-display {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-top: 4px;
  }
}

.number-display-component {
  .value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }
}

.temperature-sensor-component {
  .sensor-values {
  text-align: center;

    .value {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .sub-value {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }
  }
}

.fan-control-component {
  :deep(.el-select) {
    width: 100%;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .panel-designer {
    grid-template-columns: 250px 1fr 300px;
  }
}

@media (max-width: 1200px) {
  .panel-designer {
    grid-template-columns: 1fr;

    .phone-simulator {
      order: 2;
      min-height: 600px;
    }

    .component-panel,
    .property-panel {
      order: 3;
    }
  }
}

@media (max-width: 768px) {
  .product-panel {
    padding: 16px;
  }

  .panel-designer {
    gap: 16px;

    .panel-header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }
    }

    .phone-simulator {
      .simulator-header {
        padding: 12px 16px;
        flex-direction: column;
        gap: 12px;

        .simulator-controls {
          width: 100%;
          justify-content: center;
        }
      }

      .phone-frame {
        padding: 16px;

        &.mobile .phone-screen {
          width: 280px;
          height: 560px;
        }

        &.tablet .phone-screen {
          width: 320px;
          height: 480px;
        }
      }
    }

    .component-panel {
      .component-list {
        .component-item {
          flex-direction: column;
          text-align: center;
          gap: 8px;

          .component-icon {
            margin-right: 0;
            margin-bottom: 8px;
          }
        }
      }
    }

    .property-panel {
      .property-content .property-section,
      .panel-config .config-section {
        padding: 16px;
      }
    }
  }
}
</style>
