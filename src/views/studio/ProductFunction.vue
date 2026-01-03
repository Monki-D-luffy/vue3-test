<template>
  <div class="function-studio">
    <div class="studio-panel main-panel">
      <div class="panel-header">
        <div class="header-left">
          <div class="title-row">
            <el-tooltip effect="dark" content="定义产品的功能点，系统将自动生成云端协议与嵌入式代码。" placement="bottom-start">
              <h3 class="hover-title">
                物模型定义 (DP)
                <el-icon class="info-icon">
                  <QuestionFilled />
                </el-icon>
              </h3>
            </el-tooltip>
          </div>
        </div>

        <div class="header-right">
          <el-input v-model="searchQuery" placeholder="搜索功能名称/ID" prefix-icon="Search"
            class="search-input-responsive" />
          <el-divider direction="vertical" class="hidden-xs-only" />
          <el-button-group class="action-group">
            <el-button type="primary" color="#000" @click="openStandardModal">
              <el-icon class="el-icon--left">
                <Plus />
              </el-icon>
              标准
            </el-button>
            <el-button plain @click="openCustomDrawer">
              自定义
            </el-button>
          </el-button-group>

          <el-tooltip :content="isCodePanelVisible ? '收起预览' : '展开预览'" placement="bottom">
            <el-button circle plain @click="toggleCodePanel" class="toggle-panel-btn">
              <el-icon>
                <component :is="isCodePanelVisible ? 'Expand' : 'Fold'" />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <div class="dp-list-container">
        <el-table :data="filteredDpList" style="width: 100%"
          :header-cell-style="{ background: 'transparent', color: '#909399', fontWeight: '500' }"
          row-class-name="dp-table-row" height="100%">
          <el-table-column width="40">
            <template #default>
              <el-icon class="drag-handle">
                <Grid />
              </el-icon>
            </template>
          </el-table-column>

          <el-table-column prop="id" label="DP ID" width="80">
            <template #default="{ row }">
              <span class="code-font id-badge">{{ row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="功能名称" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="name-cell">
                <span class="primary-text">{{ row.name }}</span>
                <span class="secondary-text">{{ row.identifier }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.type)" effect="plain" round size="small">
                {{ row.type.toUpperCase() }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="定义详情" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="prop-def">{{ formatPropDef(row) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="mode" label="模式" width="90">
            <template #default="{ row }">
              <div class="mode-badge">
                <el-icon v-if="row.mode === 'rw'">
                  <Switch />
                </el-icon>
                <el-icon v-else>
                  <Top />
                </el-icon>
                <span>{{ row.mode === 'rw' ? 'RW' : 'RO' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100" fixed="right" align="right">
            <template #default>
              <el-button link type="primary" size="small">编辑</el-button>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="filteredDpList.length === 0" class="empty-state">
          <el-empty description="暂无功能点" :image-size="100" />
        </div>
      </div>

      <div class="panel-footer">
        <div class="footer-tips">
          <el-icon>
            <InfoFilled />
          </el-icon>
          <span>修改定义后请保存</span>
        </div>
        <div class="footer-actions">
          <el-button @click="handlePrev">上一步</el-button>

          <el-button @click="handleSave">保存草稿</el-button>
          <el-button type="primary" color="#000" @click="handleNext">
            下一步：面板
            <el-icon class="el-icon--right">
              <ArrowRight />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <transition name="slide-width">
      <div v-show="isCodePanelVisible" class="studio-panel side-panel">
        <div class="panel-header tab-header">
          <div class="tab-options">
            <span class="tab-item" :class="{ active: previewMode === 'json' }" @click="previewMode = 'json'">
              TSL
            </span>
            <span class="tab-item" :class="{ active: previewMode === 'code' }" @click="previewMode = 'code'">
              C SDK
            </span>
          </div>
          <el-button link size="small" @click="copyCode">
            <el-icon>
              <CopyDocument />
            </el-icon>
          </el-button>
        </div>

        <div class="code-preview-content">
          <div v-if="previewMode === 'json'" class="code-block json">
            <pre v-html="highlightJson(tslJson)"></pre>
          </div>
          <div v-else class="code-block c-lang">
            <div class="code-comment">// Auto-generated struct</div>
            <br>
            <pre>{{ generatedCCode }}</pre>
          </div>
        </div>
      </div>
    </transition>

    <StandardDpModal v-model="isStandardModalVisible" @confirm="handleStandardAdd" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Search, Plus, Grid, Switch, Top, CopyDocument, ArrowRight, InfoFilled, QuestionFilled,
  Expand, Fold
} from '@element-plus/icons-vue';
import StandardDpModal from './components/StandardDpModal.vue';

// --- Types & Interfaces ---
type DataType = 'bool' | 'value' | 'enum' | 'string' | 'raw';
interface DpItem {
  id: number;
  identifier: string;
  name: string;
  type: DataType;
  mode: 'rw' | 'ro';
  specs: any;
}

// --- State ---
const router = useRouter();
const searchQuery = ref('');
const previewMode = ref<'json' | 'code'>('code');
const isStandardModalVisible = ref(false);
const isCodePanelVisible = ref(true); // 默认显示右侧面板

// Mock Data
const dpList = ref<DpItem[]>([
  { id: 1, identifier: 'switch_led', name: '开关', type: 'bool', mode: 'rw', specs: { true: '开启', false: '关闭' } },
  { id: 2, identifier: 'work_mode', name: '工作模式', type: 'enum', mode: 'rw', specs: { range: ['white', 'colour', 'scene', 'music'] } },
  { id: 3, identifier: 'bright_value', name: '亮度值', type: 'value', mode: 'rw', specs: { min: 10, max: 1000, step: 1, unit: '' } }
]);

// --- Computed Logic ---
const filteredDpList = computed(() => {
  if (!searchQuery.value) return dpList.value;
  const q = searchQuery.value.toLowerCase();
  return dpList.value.filter(item =>
    item.name.includes(q) || item.identifier.toLowerCase().includes(q) || String(item.id).includes(q)
  );
});

// JSON Generation (Mock)
const tslJson = computed(() => ({
  version: "1.0",
  properties: dpList.value.map(dp => ({ id: dp.id, code: dp.identifier, name: dp.name, type: dp.type, accessMode: dp.mode, specs: dp.specs }))
}));

// C Code Generation (Mock)
const generatedCCode = computed(() => {
  let structContent = '';
  dpList.value.forEach(dp => {
    let cType = dp.type === 'bool' ? 'bool' : dp.type === 'value' ? 'int32_t' : dp.type === 'enum' ? 'uint8_t' : 'void*';
    structContent += `    ${cType} ${dp.identifier}; // DPID: ${dp.id}\n`;
  });
  return `typedef struct {\n${structContent}} product_dp_t;`;
});

// --- Helpers ---
const getTypeTag = (type: DataType) => ({ bool: 'primary', value: 'success', enum: 'warning', string: 'info', raw: 'danger' }[type] || 'info');

const formatPropDef = (row: DpItem) => {
  if (row.type === 'bool') return '布尔型';
  if (row.type === 'value') return `${row.specs.min} - ${row.specs.max}`;
  if (row.type === 'enum') return row.specs.range.join(', ');
  return '-';
};

const highlightJson = (jsonObj: any) => JSON.stringify(jsonObj, null, 2)
  .replace(/"keys"/g, '<span class="json-key">"keys"</span>')
  .replace(/:\s"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
  .replace(/:\s([0-9]+)/g, ': <span class="json-number">$1</span>');

// --- Actions ---
const toggleCodePanel = () => { isCodePanelVisible.value = !isCodePanelVisible.value; };
const openStandardModal = () => { isStandardModalVisible.value = true; };
const openCustomDrawer = () => { ElMessage.info('自定义功能开发中'); };
const handleStandardAdd = (dps: any[]) => {
  let maxId = dpList.value.length > 0 ? Math.max(...dpList.value.map(d => d.id)) : 0;
  dpList.value.push(...dps.map((dp, i) => ({ ...dp, id: maxId + i + 1 })));
  ElMessage.success(`成功添加 ${dps.length} 个功能点`);
};
const copyCode = () => { ElMessage.success('代码已复制'); };

// Navigation
const handlePrev = () => {
  // 如果是第一步，"上一步"通常是返回产品列表
  router.push('/products');
};
const handleNext = () => {
  if (dpList.value.length === 0) return ElMessage.warning('请至少添加一个功能点');
  ElMessage.success('保存成功');
  router.push({ name: 'ProductPanel' });
};
const handleSave = () => { ElMessage.success('草稿已保存'); };
</script>

<style scoped>
.function-studio {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  /* 防止页面整体滚动 */
  background-color: var(--border-base, #e4e7ed);
}

/* --- Left Main Panel --- */
.main-panel {
  flex: 1;
  background-color: var(--bg-card, #ffffff);
  display: flex;
  flex-direction: column;
  min-width: 0;
  /* 关键：防止 Flex 子项被内容撑开导致溢出 */
  position: relative;
  z-index: 2;
}

.panel-header {
  height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-base, #ebedf0);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
  /* 间距 */
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  /* 允许文本截断 */
}

.title-row {
  display: flex;
  align-items: center;
}

.hover-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  cursor: help;
  /* 鼠标样式变成问号 */
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.hover-title:hover {
  color: var(--el-color-primary);
}

.info-icon {
  font-size: 16px;
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  /* 占据剩余空间 */
  justify-content: flex-end;
  overflow: hidden;
}

/* 响应式搜索框 */
.search-input-responsive {
  width: 240px;
  transition: width 0.3s ease;
}

/* 媒体查询：屏幕变窄时，搜索框变短，甚至只保留图标（这步由ElementUI处理） */
@media (max-width: 1100px) {
  .search-input-responsive {
    width: 160px;
  }
}

@media (max-width: 800px) {
  .search-input-responsive {
    width: 120px;
  }

  .action-group span {
    display: none;
    /* 极窄屏幕隐藏按钮文字 */
  }
}

.dp-list-container {
  flex: 1;
  overflow: hidden;
  /* 表格自己滚，不要容器滚 */
  padding: 0;
  /* 移除 padding 贴边显示，更像 Excel */
  display: flex;
  flex-direction: column;
}

/* 修正表格样式 */
:deep(.el-table__inner-wrapper) {
  height: 100% !important;
}

:deep(.dp-table-row) {
  height: 56px;
  /* 稍微紧凑一点 */
}

/* Footer */
.panel-footer {
  height: 56px;
  border-top: 1px solid var(--border-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: #fff;
  z-index: 10;
}

.footer-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* --- Right Side Panel --- */
.side-panel {
  width: 360px;
  /* 稍微调窄一点默认宽度 */
  background-color: #1e1e1e;
  /* 代码区背景深色 */
  border-left: 1px solid var(--border-base, #e4e7ed);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 1;
}

/* 折叠动画 Class */
.slide-width-enter-active,
.slide-width-leave-active {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
  overflow: hidden;
  white-space: nowrap;
}

.slide-width-enter-from,
.slide-width-leave-to {
  width: 0;
  opacity: 0;
}

/* Panel Header Dark Mode Override */
.side-panel .panel-header {
  background-color: #252526;
  border-bottom: 1px solid #333;
  color: #ccc;
  height: 48px;
  min-height: 48px;
}

.tab-item {
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 0 12px;
  color: #858585;
  cursor: pointer;
  position: relative;
}

.tab-item:hover {
  color: #fff;
}

.tab-item.active {
  color: #fff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--el-color-primary);
}

.code-preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #d4d4d4;
  line-height: 1.5;
}

/* Custom Scrollbar for dark panel */
.code-preview-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.code-preview-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-preview-content::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 5px;
}

/* 文本辅助样式 */
.drag-handle {
  cursor: grab;
  color: #c0c4cc;
}

.id-badge {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.name-cell {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.primary-text {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.secondary-text {
  font-size: 11px;
  color: #909399;
  font-family: monospace;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.toggle-panel-btn {
  margin-left: 8px;
  border: none;
}
</style>