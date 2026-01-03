<template>
  <div class="panel-studio-v2">

    <div class="layout-column left-preview">
      <div class="column-header">
        <span class="title">界面预览</span>
        <div class="header-actions">
          <el-tooltip content="刷新" effect="dark">
            <el-button link size="small"><el-icon>
                <Refresh />
              </el-icon></el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="simulator-container">
        <div class="device-shell">
          <div class="device-status-bar">
            <span>9:41</span>
            <div class="icons">
              <el-icon>
                <Connection />
              </el-icon>
              <el-icon>
                <Lightning />
              </el-icon>
            </div>
          </div>

          <div class="device-nav-bar" :style="{ background: globalConfig.themeColor }">
            <el-icon>
              <ArrowLeft />
            </el-icon>
            <span>{{ globalConfig.navTitle }}</span>
            <el-icon>
              <MoreFilled />
            </el-icon>
          </div>

          <el-scrollbar class="device-viewport">
            <div class="widget-list">
              <div v-for="(item, index) in canvasItems" :key="item.id" class="widget-wrapper"
                :class="{ 'is-active': activeItemId === item.id }" @click="selectItem(item.id)">
                <div v-if="item.type === 'switch'" class="ui-switch-row">
                  <div class="ui-info">
                    <div class="ui-label">{{ item.props.label }}</div>
                    <div class="ui-desc" v-if="item.props.showState">
                      {{ item.mockValue ? (item.props.onText || '已开启') : (item.props.offText || '已关闭') }}
                    </div>
                  </div>
                  <el-switch v-model="item.mockValue" :active-color="globalConfig.themeColor" />
                </div>

                <div v-if="item.type === 'slider'" class="ui-slider-box">
                  <div class="ui-header">
                    <span class="ui-label">{{ item.props.label }}</span>
                    <span class="ui-val" :style="{ color: globalConfig.themeColor }">
                      {{ item.mockValue }} <small>{{ item.props.unit }}</small>
                    </span>
                  </div>
                  <el-slider v-model="item.mockValue" :min="item.props.min" :max="item.props.max"
                    :step="item.props.step" :show-tooltip="false"
                    :style="{ '--el-slider-main-bg-color': globalConfig.themeColor }" />
                </div>

                <div v-if="item.type === 'card'" class="ui-value-card">
                  <div class="card-icon"
                    :style="{ background: globalConfig.themeColor + '15', color: globalConfig.themeColor }">
                    <el-icon :size="20">
                      <component :is="item.props.icon" />
                    </el-icon>
                  </div>
                  <div class="card-content">
                    <div class="ui-val">{{ item.mockValue }} <small>{{ item.props.unit }}</small></div>
                    <div class="ui-label">{{ item.props.label }}</div>
                  </div>
                </div>

                <div class="delete-handler" v-if="activeItemId === item.id" @click.stop="deleteItem(index)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                </div>
              </div>

              <div v-if="canvasItems.length === 0" class="empty-placeholder">
                <el-icon :size="24">
                  <Pointer />
                </el-icon>
                <p>从中间拖入组件</p>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <div class="layout-column center-library">
      <div class="column-header">
        <span class="title">组件市场</span>
        <el-input v-model="searchKey" placeholder="搜索组件" prefix-icon="Search" size="small" style="width: 200px" />
      </div>

      <el-scrollbar class="library-scroll">
        <div class="library-grid-container">
          <div v-for="group in componentLibrary" :key="group.category" class="lib-group">
            <div class="group-label">{{ group.category }}</div>
            <div class="group-items">
              <div v-for="comp in group.items" :key="comp.type" class="lib-card" @click="addComponent(comp)">
                <div class="lib-icon">
                  <el-icon>
                    <component :is="comp.icon" />
                  </el-icon>
                </div>
                <div class="lib-info">
                  <span class="name">{{ comp.name }}</span>
                  <span class="desc">{{ comp.desc }}</span>
                </div>
                <div class="lib-tags">
                  <el-tag size="small" type="info" effect="plain">{{ comp.dpType }}</el-tag>
                </div>

                <div class="add-btn"><el-icon>
                    <Plus />
                  </el-icon></div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="layout-column right-inspector">
      <div class="column-header">
        <span class="title">{{ activeItem ? '组件属性' : '全局配置' }}</span>
        <el-button v-if="activeItem" type="danger" link size="small"
          @click="deleteItem(canvasItems.findIndex(i => i.id === activeItemId))">删除</el-button>
      </div>

      <el-scrollbar class="config-scroll">
        <div class="config-form-container">

          <div v-if="!activeItem" class="form-group">
            <div class="form-section">
              <span class="section-title">导航栏设置</span>
              <el-form label-position="top" size="small">
                <el-form-item label="标题文字">
                  <el-input v-model="globalConfig.navTitle" maxlength="10" show-word-limit />
                </el-form-item>
                <el-form-item label="主题色 (Brand Color)">
                  <el-color-picker v-model="globalConfig.themeColor" show-alpha />
                </el-form-item>
              </el-form>
            </div>

            <div class="info-block">
              <el-icon>
                <InfoFilled />
              </el-icon>
              <span>点击左侧手机屏幕内的组件，可在此处配置详细属性。</span>
            </div>
          </div>

          <div v-else class="form-group">

            <div class="form-section highlight">
              <span class="section-title">
                <el-icon>
                  <Link />
                </el-icon> 数据源绑定 (DP)
              </span>
              <el-select v-model="activeItem.bindDp" placeholder="请选择关联功能点" class="full-width">
                <el-option v-for="dp in getMatchDps(activeItem.allowDpTypes)" :key="dp.id"
                  :label="`${dp.id}. ${dp.name}`" :value="dp.id">
                  <span class="dp-option-left">{{ dp.name }}</span>
                  <span class="dp-option-right">{{ dp.type }}</span>
                </el-option>
              </el-select>
              <div class="field-tip" v-if="!activeItem.bindDp">请先绑定 DP 点以生效</div>
            </div>

            <el-divider />

            <div class="form-section">
              <span class="section-title">UI 样式</span>
              <el-form label-position="top" size="small">

                <el-form-item label="主标题">
                  <el-input v-model="activeItem.props.label" />
                </el-form-item>

                <template v-if="activeItem.type === 'switch'">
                  <el-form-item label="显示状态文字">
                    <el-switch v-model="activeItem.props.showState" />
                  </el-form-item>
                  <div class="row-inputs" v-if="activeItem.props.showState">
                    <el-input v-model="activeItem.props.onText" placeholder="开启时文案" />
                    <el-input v-model="activeItem.props.offText" placeholder="关闭时文案" />
                  </div>
                </template>

                <template v-if="activeItem.type === 'slider'">
                  <div class="row-inputs">
                    <el-form-item label="最小值">
                      <el-input-number v-model="activeItem.props.min" :controls="false" />
                    </el-form-item>
                    <el-form-item label="最大值">
                      <el-input-number v-model="activeItem.props.max" :controls="false" />
                    </el-form-item>
                  </div>
                  <div class="row-inputs">
                    <el-form-item label="步长">
                      <el-input-number v-model="activeItem.props.step" :min="1" :controls="false" />
                    </el-form-item>
                    <el-form-item label="单位">
                      <el-input v-model="activeItem.props.unit" placeholder="如 %" />
                    </el-form-item>
                  </div>
                </template>

                <template v-if="activeItem.type === 'card'">
                  <el-form-item label="图标">
                    <div class="icon-selector">
                      <div v-for="icon in ['Sunny', 'Moon', 'Lightning', 'Odometer', 'Timer']" :key="icon"
                        class="icon-opt" :class="{ active: activeItem.props.icon === icon }"
                        @click="activeItem.props.icon = icon">
                        <el-icon>
                          <component :is="icon" />
                        </el-icon>
                      </div>
                    </div>
                  </el-form-item>
                  <el-form-item label="单位后缀">
                    <el-input v-model="activeItem.props.unit" />
                  </el-form-item>
                </template>

              </el-form>
            </div>

          </div>
        </div>
      </el-scrollbar>

      <div class="column-footer">
        <el-button class="full-btn" type="primary" color="#000" @click="savePanel">
          保存并下一步
        </el-button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Refresh, Connection, Lightning, ArrowLeft, MoreFilled,
  Search, Plus, Delete, InfoFilled, Link, Pointer,
  Switch, Operation, DataBoard, Sunny, Moon, Odometer, Timer
} from '@element-plus/icons-vue';

const router = useRouter();

// --- Mock Data: 来自 Step 1 的 DP 定义 ---
const mockStep1Dps = [
  { id: 1, name: '主开关', type: 'bool' },
  { id: 2, name: '目标温度', type: 'value' },
  { id: 3, name: '模式选择', type: 'enum' },
  { id: 4, name: '当前湿度', type: 'value' },
  { id: 5, name: '童锁', type: 'bool' },
];

// --- Config ---
const globalConfig = reactive({
  navTitle: '智能空气净化器',
  themeColor: '#10B981', // 默认绿色
});

const searchKey = ref('');
const activeItemId = ref<string | null>(null);

// --- State: 画布组件 ---
interface Widget {
  id: string;
  type: 'switch' | 'slider' | 'card';
  bindDp: number | null;
  allowDpTypes: string[]; // 允许绑定的 DP 类型
  props: any;
  mockValue: any;
}

const canvasItems = ref<Widget[]>([
  {
    id: 'init_1',
    type: 'switch',
    bindDp: 1,
    allowDpTypes: ['bool'],
    props: { label: '主开关', showState: true, onText: '开启', offText: '关闭' },
    mockValue: true
  }
]);

// --- Component Library ---
const componentLibrary = [
  {
    category: '常用控制',
    items: [
      {
        name: '布尔开关',
        type: 'switch',
        icon: 'Switch',
        desc: '适用于开关、锁等两态控制',
        dpType: 'bool',
        defaultProps: { label: '开关名称', showState: true, onText: 'On', offText: 'Off' }
      },
      {
        name: '数值滑块',
        type: 'slider',
        icon: 'Operation',
        desc: '拖动调节数值，如亮度、温度',
        dpType: 'value',
        defaultProps: { label: '调节项', min: 0, max: 100, step: 1, unit: '%' }
      },
    ]
  },
  {
    category: '数据展示',
    items: [
      {
        name: '数值卡片',
        type: 'card',
        icon: 'DataBoard',
        desc: '展示传感器数据，如温湿度',
        dpType: 'value',
        defaultProps: { label: '传感器', icon: 'Sunny', unit: '°C' }
      }
    ]
  }
];

// --- Computed ---
const activeItem = computed(() => canvasItems.value.find(i => i.id === activeItemId.value));

// --- Methods ---
const addComponent = (comp: any) => {
  // 1. 尝试自动寻找一个未绑定的、类型匹配的 DP
  const availableDp = mockStep1Dps.find(dp =>
    dp.type === comp.dpType &&
    !canvasItems.value.some(w => w.bindDp === dp.id)
  );

  const newItem: Widget = {
    id: `w_${Date.now()}`,
    type: comp.type,
    bindDp: availableDp ? availableDp.id : null, // 自动绑定
    allowDpTypes: [comp.dpType],
    props: { ...comp.defaultProps, label: availableDp ? availableDp.name : comp.name },
    mockValue: comp.type === 'switch' ? false : 50
  };

  canvasItems.value.push(newItem);
  activeItemId.value = newItem.id;

  if (availableDp) {
    ElMessage.success(`已添加并自动绑定: ${availableDp.name}`);
  } else {
    ElMessage.info('添加成功，请在右侧绑定数据点');
  }
};

const selectItem = (id: string) => activeItemId.value = id;

const deleteItem = (index: number) => {
  canvasItems.value.splice(index, 1);
  activeItemId.value = null;
};

const getMatchDps = (allowedTypes: string[]) => {
  return mockStep1Dps.filter(dp => allowedTypes.includes(dp.type));
};

const savePanel = () => {
  if (canvasItems.value.some(i => !i.bindDp)) {
    ElMessage.warning('存在未绑定数据的组件，请检查');
    return;
  }
  ElMessage.success('面板配置已保存');
  router.push({ name: 'ProductHardware' });
};
</script>

<style scoped>
/* Panel Studio V2
  Layout: Left (Phone) | Center (Library) | Right (Inspector)
*/
.panel-studio-v2 {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
}

.layout-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

.layout-column.left-preview {
  width: 380px;
  flex-shrink: 0;
  background: #f0f2f5;
}

.layout-column.center-library {
  flex: 1;
  min-width: 0;
}

.layout-column.right-inspector {
  width: 340px;
  flex-shrink: 0;
  border-left: 1px solid #e4e7ed;
  border-right: none;
}

/* Headers */
.column-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  flex-shrink: 0;
}

.column-header .title {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
}

/* 1. LEFT: Simulator */
.simulator-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}

.device-shell {
  width: 320px;
  /* 涂鸦风格标准窄屏 */
  height: 640px;
  background: #fff;
  border-radius: 36px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border: 8px solid #1a1a1a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.device-status-bar {
  height: 24px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.device-status-bar .icons {
  display: flex;
  gap: 4px;
}

.device-nav-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
}

.device-viewport {
  flex: 1;
  background: #f7f8fa;
}

.widget-list {
  padding: 12px;
  min-height: 100%;
}

/* Widgets in Phone */
.widget-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
  transition: all 0.2s;
}

.widget-wrapper:hover {
  border-color: #dcdfe6;
}

.widget-wrapper.is-active {
  border-color: #1a1a1a;
}

/* Delete Btn */
.delete-handler {
  position: absolute;
  right: -8px;
  top: -8px;
  background: #f56c6c;
  color: #fff;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* UI Components inside Phone */
.ui-switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ui-label {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.ui-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.ui-slider-box .ui-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ui-val {
  font-weight: 600;
  font-size: 14px;
}

.ui-value-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content .ui-val {
  font-size: 18px;
  line-height: 1.2;
}

.card-content .ui-label {
  font-size: 12px;
  color: #999;
  font-weight: 400;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #ccc;
  gap: 8px;
  font-size: 12px;
  border: 2px dashed #e4e7ed;
  border-radius: 12px;
}

/* 2. CENTER: Library */
.library-grid-container {
  padding: 20px;
}

.lib-group {
  margin-bottom: 24px;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  margin-bottom: 12px;
}

.group-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.lib-card {
  background: #f9fafb;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.lib-card:hover {
  background: #fff;
  border-color: #1a1a1a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.lib-icon {
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  border: 1px solid #eee;
}

.lib-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lib-info .name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.lib-info .desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.lib-tags {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0.5;
}

.add-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 12px;
  background: #1a1a1a;
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.lib-card:hover .add-btn {
  opacity: 1;
}

/* 3. RIGHT: Inspector */
.config-scroll {
  flex: 1;
}

.config-form-container {
  padding: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #ebedf0;
}

.form-section.highlight {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

/* 强调数据绑定 */

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-block {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.field-tip {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 6px;
}

.row-inputs {
  display: flex;
  gap: 12px;
}

.icon-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.icon-opt {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-opt.active {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
}

.column-footer {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
}

.full-btn {
  width: 100%;
  height: 40px;
}

.dp-option-left {
  float: left;
  color: #333;
  font-weight: 500;
}

.dp-option-right {
  float: right;
  color: #999;
  font-size: 12px;
  font-family: monospace;
}

.full-width {
  width: 100%;
}

/* Scrollbar beautify */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}
</style>