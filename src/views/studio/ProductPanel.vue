<template>
  <div class="panel-studio-layout">

    <aside class="sidebar left">
      <div class="sidebar-header"><span class="title">组件库</span></div>
      <div class="component-scroll-area">
        <div v-for="(group, key) in libraryGroups" :key="key" class="comp-group">
          <div class="group-title">{{ group.title }}</div>
          <div class="comp-grid">
            <div v-for="comp in group.items" :key="comp.type" class="comp-item" draggable="true"
              @dragstart="onDragStart($event, comp)">
              <div v-if="comp.type === 'Switch'" class="smart-dot"></div>
              <el-icon class="comp-icon"><img :src="`https://api.iconify.design/${comp.icon}.svg?color=%2364748b`"
                  alt="" /></el-icon>
              <span class="comp-name">{{ comp.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <section class="canvas-area">
      <div class="canvas-toolbar">
        <div class="tool-group"></div>
        <div class="device-status-debug">
          <span class="status-dot"></span> 虚拟设备在线
        </div>
        <div class="tool-group">
          <el-button link @click="clearCanvas"><el-icon>
              <Delete />
            </el-icon></el-button>
        </div>
      </div>

      <div class="simulator-viewport">
        <div class="phone-frame">
          <div class="notch">
            <div class="camera"></div>
            <div class="speaker"></div>
          </div>
          <div class="button-power"></div>

          <div class="phone-screen">
            <div class="status-bar">
              <span class="time">9:41</span>
              <div class="icons"><el-icon>
                  <Connection />
                </el-icon></div>
            </div>
            <div class="nav-bar">
              <el-icon>
                <ArrowLeft />
              </el-icon>
              <span class="nav-title">设备面板</span>
              <el-icon>
                <MoreFilled />
              </el-icon>
            </div>

            <div class="app-body" @dragover.prevent @drop="onDrop" @click.self="currentSelection = null">
              <div v-if="canvasComponents.length === 0" class="empty-placeholder">
                <el-icon class="icon">
                  <Box />
                </el-icon>
                <p>拖拽组件到这里</p>
              </div>

              <div v-for="(item, index) in canvasComponents" :key="item.id" class="renderer-item-wrapper"
                :class="{ 'is-selected': currentSelection?.id === item.id }" @click.stop="selectComponent(item)">
                <component :is="getComponentByType(item.type)" :config="item" :model-value="getComponentValue(item)"
                  @update:model-value="val => updateComponentValue(item, val)" />

                <div v-if="currentSelection?.id === item.id" class="selection-tools">
                  <div class="tool-btn delete" @click.stop="deleteComponent(index)"><el-icon>
                      <Delete />
                    </el-icon></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="sidebar right">
      <div class="sidebar-header"><span class="title">属性配置</span></div>
      <div class="config-content">
        <PanelConfigForm v-if="currentSelection" v-model="currentSelection" />
        <el-empty v-else description="未选中组件" :image-size="80" />

        <div class="debug-panel">
          <div class="debug-title">VIRTUAL DEVICE MEMORY</div>
          <div v-if="Object.keys(virtualDeviceState).length === 0" class="debug-empty">
            无数据 (请先在 Step 1 定义功能)
          </div>
          <pre v-else class="debug-json">{{ virtualDeviceState }}</pre>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Delete, Connection, ArrowLeft, MoreFilled, Box } from '@element-plus/icons-vue';
import { COMPONENT_LIBRARY, type ComponentMeta, type PanelComponent } from '@/types/panel';
import { useStudioStore } from '@/stores/studioStore';

// 引入所有组件
import PanelSwitch from './components/mobile/PanelSwitch.vue';
import PanelButton from './components/mobile/PanelButton.vue';
import PanelSlider from './components/mobile/PanelSlider.vue';
import PanelText from './components/mobile/PanelText.vue';       // ✅ 新增
import PanelDashboard from './components/mobile/PanelDashboard.vue'; // ✅ 新增
import PanelConfigForm from './components/panel/PanelConfigForm.vue';
import PanelEnumSelector from './components/mobile/PanelEnumSelector.vue';

const route = useRoute();
const store = useStudioStore();

const searchKey = ref('');
const canvasComponents = ref<PanelComponent[]>([]);
const currentSelection = ref<PanelComponent | null>(null);
const virtualDeviceState = reactive<Record<number, any>>({});

// 生命周期：初始化数据
onMounted(async () => {
  const pid = route.params.pid as string;
  if (pid) {
    if (store.dps.length === 0) await store.initStudio(pid);
    initVirtualMemory();
  }
});

// ✅ 初始化虚拟内存：把所有 DP 的默认值填进去
const initVirtualMemory = () => {
  store.dps.forEach(dp => {
    if (virtualDeviceState[dp.id] === undefined) {
      // 根据类型设置默认值
      if (dp.type === 'Boolean') virtualDeviceState[dp.id] = false;
      else if (dp.type === 'Integer') virtualDeviceState[dp.id] = dp.property.min || 0;
      else if (dp.type === 'String') virtualDeviceState[dp.id] = '';
      else if (dp.type === 'Enum' && dp.property.range?.length) {
        virtualDeviceState[dp.id] = dp.property.range[0]; // 默认选第一个
      }
    }
  });
};

// 监听 DPs 变化（比如刚从网络加载回来），重新同步内存
watch(() => store.dps, initVirtualMemory, { deep: true });

const libraryGroups = computed(() => [
  { title: '基础组件', items: COMPONENT_LIBRARY.basic },
  { title: '控制组件', items: COMPONENT_LIBRARY.control },
  { title: '传感显示', items: COMPONENT_LIBRARY.sensor },
]);

// ✅ 修复 Bug 3: 注册新组件映射
const getComponentByType = (type: string) => {
  const map: any = {
    'Switch': PanelSwitch,
    'Button': PanelButton,
    'Slider': PanelSlider,
    'Text': PanelText,           // ✅ 映射 Text
    'Dashboard': PanelDashboard, // ✅ 映射 Dashboard
    'EnumSelector': PanelEnumSelector,
  };
  return map[type] || 'div';
};

// 读写逻辑
const getComponentValue = (comp: PanelComponent) => {
  const dpId = comp.binding?.dpId;
  return dpId ? virtualDeviceState[dpId] : undefined;
};

const updateComponentValue = (comp: PanelComponent, val: any) => {
  const dpId = comp.binding?.dpId;
  if (dpId) virtualDeviceState[dpId] = val;
};

// 拖拽逻辑
const onDragStart = (event: DragEvent, comp: ComponentMeta) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify(comp));
  }
};

const onDrop = (event: DragEvent) => {
  const rawData = event.dataTransfer?.getData('application/json');
  if (rawData) {
    const meta = JSON.parse(rawData) as ComponentMeta;
    const newComponent: PanelComponent = {
      id: `${meta.type.toLowerCase()}_${Math.random().toString(36).substr(2, 6)}`,
      type: meta.type,
      name: meta.name,
      style: { ...meta.defaultProps },
      binding: { dpId: undefined } // ✅ 显式初始化 binding 防止报错
    };
    canvasComponents.value.push(newComponent);
    selectComponent(newComponent);
  }
};

const selectComponent = (comp: PanelComponent) => { currentSelection.value = comp; };
const deleteComponent = (index: number) => { canvasComponents.value.splice(index, 1); currentSelection.value = null; };
const clearCanvas = () => { canvasComponents.value = []; currentSelection.value = null; };
</script>

<style scoped>
/* 样式复用之前的，这里仅补充 Debug 样式 */
.panel-studio-layout {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  overflow: hidden;
}

/* ... (Sidebar, Canvas, Phone Frame CSS 与之前完全一致，请保留) ... */

.sidebar {
  background: #fff;
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
}

.sidebar.left {
  width: 260px;
  border-right: 1px solid #e2e8f0;
}

.sidebar.right {
  width: 320px;
  border-left: 1px solid #e2e8f0;
}

.sidebar-header {
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.sidebar-header .title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.tech-input-search {
  width: 140px;
}

.component-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.comp-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
  font-weight: 600;
  padding-left: 4px;
}

.comp-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.comp-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

.comp-item:hover {
  border-color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.comp-item:hover .comp-icon img {
  filter: brightness(0);
  opacity: 1;
}

.comp-item:active {
  cursor: grabbing;
}

.comp-icon img {
  width: 24px;
  height: 24px;
  opacity: 0.6;
  transition: all 0.2s;
}

.comp-name {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

.smart-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  background-color: #f0f2f5;
  overflow: hidden;
}

.canvas-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.simulator-viewport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 40px;
}

.phone-frame {
  width: 375px;
  height: 812px;
  background: #fff;
  border-radius: 50px;
  box-shadow: 0 0 0 6px #1a1a1a, 0 0 0 8px #333, 0 30px 60px -10px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 8px solid #000;
  box-sizing: content-box;
}

.notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 30px;
  background: #000;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.notch .camera {
  width: 10px;
  height: 10px;
  background: #1a1a1a;
  border-radius: 50%;
  border: 1px solid #333;
}

.notch .speaker {
  width: 40px;
  height: 4px;
  background: #222;
  border-radius: 2px;
}

.button-volume-up {
  position: absolute;
  left: -10px;
  top: 120px;
  width: 4px;
  height: 36px;
  background: #222;
  border-radius: 2px;
}

.button-volume-down {
  position: absolute;
  left: -10px;
  top: 170px;
  width: 4px;
  height: 36px;
  background: #222;
  border-radius: 2px;
}

.button-power {
  position: absolute;
  right: -10px;
  top: 130px;
  width: 4px;
  height: 50px;
  background: #222;
  border-radius: 2px;
}

.phone-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  border-radius: 42px;
}

.status-bar {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 2px;
}

.nav-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 18px;
  color: #1a1a1a;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
}

.app-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.app-body::-webkit-scrollbar {
  display: none;
}

.empty-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  margin: 10px;
  background: rgba(255, 255, 255, 0.5);
}

.empty-placeholder .icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.renderer-item-wrapper {
  position: relative;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.renderer-item-wrapper:hover {
  border-color: rgba(26, 26, 26, 0.2);
}

.renderer-item-wrapper.is-selected {
  border: 1px dashed #1a1a1a;
  background-color: rgba(26, 26, 26, 0.03);
}

.selection-tools {
  position: absolute;
  top: -12px;
  right: -12px;
  display: flex;
  z-index: 10;
}

.tool-btn {
  width: 24px;
  height: 24px;
  background: #1a1a1a;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.tool-btn:hover {
  background: #ff4d4f;
}

.config-content {
  padding: 20px;
}

/* Device Status & Debug */
.device-status-debug {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ecfdf5;
  padding: 4px 12px;
  border-radius: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #d1fae5;
}

.debug-panel {
  margin-top: 40px;
  padding: 16px;
  background: #1a1a1a;
  border-radius: 8px;
  color: #fff;
}

.debug-title {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.debug-json {
  font-family: monospace;
  font-size: 11px;
  color: #4ade80;
  white-space: pre-wrap;
  margin: 0;
}

.debug-empty {
  color: #64748b;
  font-size: 12px;
  font-style: italic;
}
</style>