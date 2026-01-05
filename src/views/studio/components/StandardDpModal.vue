<template>
    <el-dialog v-model="visible" title="添加标准功能" width="800px" destroy-on-close append-to-body class="studio-modal">
        <div class="modal-body">
            <div class="filter-bar">
                <el-input v-model="searchKey" placeholder="搜索功能名称或标识符..." prefix-icon="Search" class="search-input" />
                <el-alert title="已为您筛选出 空气净化器 品类的标准功能" type="info" :closable="false" class="filter-alert" />
            </div>

            <el-table ref="tableRef" :data="standardLibrary" style="width: 100%" height="450"
                @selection-change="handleSelectionChange"
                :header-cell-style="{ background: '#f8fafc', color: '#64748b' }">
                <el-table-column type="selection" width="50" align="center" />
                <el-table-column prop="id" label="ID" width="70" align="center">
                    <template #default="{ row }">
                        <span class="font-mono text-gray-400">#{{ row.id }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="功能" width="140">
                    <template #default="{ row }">
                        <div class="name-box">
                            <span class="font-bold text-gray-700">{{ row.name }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="code" label="标识符" width="180">
                    <template #default="{ row }">
                        <span class="tag-code">{{ row.code }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="type" label="类型" width="100">
                    <template #default="{ row }">
                        <el-tag size="small" effect="plain" round>{{ row.type }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="说明" min-width="200">
                    <template #default="{ row }">
                        <span class="text-gray-500 text-xs">{{ row.desc }}</span>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <div class="selection-stat" v-if="selectedRows.length > 0">
                    已选择 <span class="highlight">{{ selectedRows.length }}</span> 项
                </div>
                <div class="actions">
                    <el-button @click="visible = false">取消</el-button>
                    <el-button type="primary" class="btn-tech" @click="handleConfirm"
                        :disabled="selectedRows.length === 0">
                        确认添加
                    </el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import type { DataPoint } from '@/types/studio';
import { useStudioStore } from '@/stores/studioStore';
import { ElMessage } from 'element-plus';

const props = defineProps<{ modelValue: boolean; }>();
const emit = defineEmits(['update:modelValue', 'success']);
const store = useStudioStore();
const visible = ref(false);
const searchKey = ref('');
const selectedRows = ref<DataPoint[]>([]);

// Mock Data
const standardLibrary: DataPoint[] = [
    { id: 1, code: 'switch_led', name: '电源开关', type: 'Boolean', mode: 'rw', isStandard: true, property: {}, desc: '设备总电源控制' },
    { id: 2, code: 'work_mode', name: '工作模式', type: 'Enum', mode: 'rw', isStandard: true, property: { range: ['auto', 'sleep', 'smart'] }, desc: '设备运行模式设定' },
    { id: 3, code: 'temp_set', name: '目标温度', type: 'Integer', mode: 'rw', isStandard: true, property: { min: 16, max: 30, step: 1, unit: '℃' }, desc: '空调/温控器目标温度' },
    { id: 4, code: 'pm25_value', name: 'PM2.5', type: 'Integer', mode: 'ro', isStandard: true, property: { min: 0, max: 999, step: 1, unit: 'ug/m3' }, desc: '空气质量检测数值' },
    { id: 5, code: 'filter_life', name: '滤芯寿命', type: 'Integer', mode: 'ro', isStandard: true, property: { min: 0, max: 100, step: 1, unit: '%' }, desc: '滤芯剩余寿命百分比' },
    { id: 6, code: 'child_lock', name: '童锁', type: 'Boolean', mode: 'rw', isStandard: true, property: {}, desc: '防止儿童误触' },
    { id: 20, code: 'fault_flags', name: '故障告警', type: 'Integer', mode: 'ro', isStandard: true, property: { min: 0, max: 255 }, desc: '设备故障位图' },
];

watch(() => props.modelValue, (val) => visible.value = val);
watch(visible, (val) => { emit('update:modelValue', val); if (val) selectedRows.value = []; });

const handleSelectionChange = (val: DataPoint[]) => selectedRows.value = val;

const handleConfirm = () => {
    const existingIds = new Set(store.dps.map(dp => dp.id));
    const newDps = selectedRows.value.filter(dp => !existingIds.has(dp.id));

    newDps.forEach(dp => store.upsertDp(dp));

    if (newDps.length > 0) {
        ElMessage.success(`成功添加 ${newDps.length} 个功能`);
        emit('success');
    } else {
        ElMessage.warning('所选功能已存在');
    }
    visible.value = false;
};
</script>

<style scoped>
.filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
}

.search-input {
    width: 300px;
}

.filter-alert {
    background: #f0f9ff;
    color: #0369a1;
    border: 1px solid #bae6fd;
    padding: 6px 16px;
    height: 32px;
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.selection-stat {
    color: #64748b;
    font-size: 14px;
}

.highlight {
    color: var(--studio-primary);
    font-weight: bold;
    font-size: 16px;
    margin: 0 4px;
}

.font-mono {
    font-family: var(--font-mono);
}

.text-gray-400 {
    color: #94a3b8;
}

.text-gray-700 {
    color: #334155;
}

.text-xs {
    font-size: 12px;
}
</style>