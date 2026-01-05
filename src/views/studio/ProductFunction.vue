<template>
  <div class="studio-page-container">

    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">功能定义 <span class="en-title">Definition</span></h2>
        <p class="page-desc">定义设备与云端通信的数据模型 (DP)。建议优先使用标准功能以获得最佳的语音生态兼容性。</p>
      </div>
      <div class="header-stat">
        <div class="stat-item">
          <span class="num">{{ standardDps.length }}</span>
          <span class="label">标准功能</span>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <span class="num">{{ customDps.length }}</span>
          <span class="label">自定义</span>
        </div>
      </div>
    </div>

    <div class="tech-card mb-24">
      <div class="card-header">
        <div class="header-left">
          <div class="icon-box standard">
            <el-icon>
              <Checked />
            </el-icon>
          </div>
          <div>
            <h3 class="card-title">标准功能</h3>
            <p class="card-subtitle">已接入 Alexa / Google Home 语音控制语义库</p>
          </div>
        </div>
        <el-button link type="primary" @click="handleOpenStandardModal">
          <el-icon class="mr-1">
            <Plus />
          </el-icon> 从库中添加
        </el-button>
      </div>

      <el-table :data="standardDps" style="width: 100%" row-key="id" class="tech-table"
        :header-cell-style="{ background: '#f8fafc', color: '#64748b' }">
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="{ row }">
            <span class="id-badge">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="功能名称" width="180">
          <template #default="{ row }">
            <span class="font-bold text-main">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="标识符 (Code)" min-width="200">
          <template #default="{ row }">
            <span class="tag-code">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="数据类型" width="140">
          <template #default="{ row }">
            <el-tag effect="light" round size="small" :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="属性定义" min-width="200">
          <template #default="{ row }">
            <span class="prop-text">{{ formatDpProp(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="" width="80" align="right">
          <template #default="{ row }">
            <el-button link class="btn-danger-hover" @click="handleDelete(row)">
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="tech-card">
      <div class="card-header">
        <div class="header-left">
          <div class="icon-box custom">
            <el-icon>
              <EditPen />
            </el-icon>
          </div>
          <div>
            <h3 class="card-title">自定义功能</h3>
            <p class="card-subtitle">扩展私有协议，满足个性化开发需求</p>
          </div>
        </div>
        <el-button type="primary" class="btn-tech" @click="handleCreate">
          <el-icon class="mr-1">
            <Plus />
          </el-icon> 创建功能点
        </el-button>
      </div>

      <el-table :data="customDps" style="width: 100%" class="tech-table" empty-text="暂无自定义功能，点击右上方创建"
        :header-cell-style="{ background: '#f8fafc', color: '#64748b' }">
        <el-table-column prop="id" label="ID" width="80" align="center">
          <template #default="{ row }">
            <span class="id-badge custom">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="功能名称" width="180">
          <template #default="{ row }">
            <span class="font-bold text-main">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="标识符" min-width="200">
          <template #default="{ row }">
            <span class="tag-code">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="数据类型" width="140">
          <template #default="{ row }">
            <el-tag effect="plain" round size="small" :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="读写" width="100">
          <template #default="{ row }">
            <span class="mode-text">{{ row.mode === 'rw' ? '下发+上报' : '仅上报' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link class="btn-danger-hover" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <CustomDpDrawer v-model="drawerVisible" :edit-data="currentEditDp" @success="handleSuccess" />

    <StandardDpModal v-model="showStandardModal" @success="handleSuccess" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Plus, Delete, Checked, EditPen } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useStudioStore } from '@/stores/studioStore';
import type { DataPoint } from '@/types/studio';
import CustomDpDrawer from './components/CustomDpDrawer.vue';
import StandardDpModal from './components/StandardDpModal.vue';

const route = useRoute();
const store = useStudioStore();

const drawerVisible = ref(false);
const currentEditDp = ref<DataPoint | null>(null);
const showStandardModal = ref(false);

const standardDps = computed(() => store.dps.filter(dp => dp.isStandard));
const customDps = computed(() => store.dps.filter(dp => !dp.isStandard));

onMounted(() => {
  const pid = route.params.pid as string;
  if (pid) store.initStudio(pid);
});

const handleCreate = () => { currentEditDp.value = null; drawerVisible.value = true; };
const handleEdit = (row: DataPoint) => { currentEditDp.value = JSON.parse(JSON.stringify(row)); drawerVisible.value = true; };
const handleOpenStandardModal = () => { showStandardModal.value = true; };

const handleDelete = (row: DataPoint) => {
  ElMessageBox.confirm(
    `确定删除功能点 "${row.name}" 吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.removeDp(row.id);
    ElMessage.success('已删除');
  });
};
const handleSuccess = () => { };

const formatDpProp = (dp: DataPoint) => {
  const p = dp.property;
  if (dp.type === 'Boolean') return 'Bool';
  if (dp.type === 'Integer') return `${p.min}~${p.max} ${p.unit || ''}`;
  if (dp.type === 'Enum') return `Enum: [${p.range?.length}]`;
  if (dp.type === 'String') return `Max: ${p.maxlen}`;
  return '-';
};

const getTypeTag = (type: string) => {
  const map: Record<string, string> = { Boolean: '', Integer: 'success', Enum: 'warning', String: 'info' };
  return map[type] || 'info';
};

defineExpose({
  save: async () => await store.saveChanges()
});
</script>

<style scoped>
.studio-page-container {
  padding: 0 0 80px 0;
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--studio-primary);
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.en-title {
  font-size: 14px;
  font-weight: 400;
  color: #94a3b8;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.page-desc {
  color: #64748b;
  font-size: 14px;
  max-width: 600px;
}

.header-stat {
  display: flex;
  gap: 24px;
  background: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .num {
  font-size: 20px;
  font-weight: 700;
  color: var(--studio-primary);
  line-height: 1;
}

.stat-item .label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.divider {
  width: 1px;
  background: #e2e8f0;
}

/* Card Headers */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.icon-box.standard {
  background: #ecfdf5;
  color: #10b981;
}

.icon-box.custom {
  background: #eff6ff;
  color: #3b82f6;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Table Details */
.id-badge {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.id-badge.custom {
  background: #fff1f2;
  color: #e11d48;
}

.text-main {
  color: #334155;
}

.prop-text {
  font-size: 13px;
  color: #64748b;
  font-family: var(--font-mono);
}

.mode-text {
  font-size: 13px;
  color: #64748b;
}

.btn-danger-hover:hover {
  color: #ef4444;
}

.mb-24 {
  margin-bottom: 24px;
}

.mr-1 {
  margin-right: 4px;
}
</style>