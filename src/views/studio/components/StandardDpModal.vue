<template>
    <el-dialog v-model="visible" title="添加标准功能" width="800px" :close-on-click-modal="false" append-to-body
        class="standard-dp-modal">
        <div class="modal-layout">
            <div class="category-sidebar">
                <div v-for="cat in categories" :key="cat.key" class="category-item"
                    :class="{ active: currentCategory === cat.key }" @click="currentCategory = cat.key">
                    <el-icon>
                        <component :is="cat.icon" />
                    </el-icon>
                    <span>{{ cat.label }}</span>
                </div>
            </div>

            <div class="dp-selection-area">
                <div class="selection-header">
                    <span class="tip">已选择 {{ selectedDps.length }} 个功能</span>
                    <el-input v-model="searchKey" placeholder="搜索功能..." prefix-icon="Search" size="small"
                        style="width: 200px" />
                </div>

                <div class="dp-grid">
                    <div v-for="dp in filteredDps" :key="dp.identifier" class="dp-card"
                        :class="{ selected: isSelected(dp) }" @click="toggleSelection(dp)">
                        <div class="check-mark" v-if="isSelected(dp)">
                            <el-icon>
                                <Check />
                            </el-icon>
                        </div>

                        <div class="dp-info">
                            <span class="dp-name">{{ dp.name }}</span>
                            <span class="dp-id">{{ dp.identifier }}</span>
                        </div>

                        <div class="dp-meta">
                            <el-tag size="small" type="info" effect="plain">{{ dp.type }}</el-tag>
                            <span class="dp-mode">{{ dp.mode === 'rw' ? '可下发' : '只读' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :disabled="selectedDps.length === 0">
                    确认添加 ({{ selectedDps.length }})
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    Search, Check,
    Sunny, Connection, Timer, Setting // Icons
} from '@element-plus/icons-vue';

// --- Types ---
interface StandardDp {
    identifier: string;
    name: string;
    type: string;
    mode: 'rw' | 'ro';
    specs?: any;
}

// --- Props & Emits ---
const props = defineProps<{
    modelValue: boolean
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

// --- State ---
const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const currentCategory = ref('common');
const searchKey = ref('');
const selectedDps = ref<StandardDp[]>([]);

// --- Mock Data: 标准功能库 ---
const categories = [
    { key: 'common', label: '通用功能', icon: 'Connection' },
    { key: 'light', label: '照明能力', icon: 'Sunny' },
    { key: 'electric', label: '电工能力', icon: 'Timer' },
    { key: 'sensor', label: '传感器', icon: 'Setting' },
];

const standardLibrary: Record<string, StandardDp[]> = {
    common: [
        { identifier: 'switch', name: '开关', type: 'bool', mode: 'rw', specs: { true: 'ON', false: 'OFF' } },
        { identifier: 'countdown', name: '倒计时', type: 'value', mode: 'rw', specs: { unit: 's', min: 0, max: 86400 } },
        { identifier: 'battery', name: '电池电量', type: 'value', mode: 'ro', specs: { unit: '%', min: 0, max: 100 } },
    ],
    light: [
        { identifier: 'bright_value', name: '亮度值', type: 'value', mode: 'rw', specs: { min: 10, max: 1000 } },
        { identifier: 'temp_value', name: '色温值', type: 'value', mode: 'rw', specs: { min: 0, max: 1000 } },
        { identifier: 'work_mode', name: '工作模式', type: 'enum', mode: 'rw', specs: { range: ['white', 'colour', 'scene'] } },
        { identifier: 'scene_data', name: '场景数据', type: 'string', mode: 'rw' },
    ],
    electric: [
        { identifier: 'cur_current', name: '当前电流', type: 'value', mode: 'ro', specs: { unit: 'mA' } },
        { identifier: 'cur_power', name: '当前功率', type: 'value', mode: 'ro', specs: { unit: 'W' } },
        { identifier: 'cur_voltage', name: '当前电压', type: 'value', mode: 'ro', specs: { unit: 'V' } },
    ],
    sensor: [
        { identifier: 'temp_current', name: '当前温度', type: 'value', mode: 'ro', specs: { unit: '°C' } },
        { identifier: 'humidity_value', name: '当前湿度', type: 'value', mode: 'ro', specs: { unit: '%' } },
        { identifier: 'alarm_state', name: '报警状态', type: 'enum', mode: 'ro', specs: { range: ['normal', 'alarm'] } },
    ]
};

// --- Computed ---
const filteredDps = computed(() => {
    const list = standardLibrary[currentCategory.value] || [];
    if (!searchKey.value) return list;
    return list.filter(item =>
        item.name.includes(searchKey.value) ||
        item.identifier.includes(searchKey.value)
    );
});

// --- Actions ---
const isSelected = (dp: StandardDp) => {
    return selectedDps.value.some(item => item.identifier === dp.identifier);
};

const toggleSelection = (dp: StandardDp) => {
    const index = selectedDps.value.findIndex(item => item.identifier === dp.identifier);
    if (index !== -1) {
        selectedDps.value.splice(index, 1);
    } else {
        selectedDps.value.push(dp);
    }
};

const handleConfirm = () => {
    // 深拷贝选中的数据，避免引用关联
    const dpsToAdd = JSON.parse(JSON.stringify(selectedDps.value));
    emit('confirm', dpsToAdd);
    visible.value = false;
    selectedDps.value = []; // 清空选择
};
</script>

<style scoped>
.modal-layout {
    display: flex;
    height: 400px;
    border: 1px solid var(--border-base);
    border-radius: 4px;
    overflow: hidden;
}

/* Sidebar */
.category-sidebar {
    width: 140px;
    background-color: var(--bg-canvas);
    border-right: 1px solid var(--border-base);
    padding: 12px 0;
}

.category-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}

.category-item:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: var(--text-primary);
}

.category-item.active {
    background-color: white;
    color: var(--el-color-primary);
    font-weight: 500;
    box-shadow: inset 2px 0 0 var(--el-color-primary);
}

/* Selection Area */
.dp-selection-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: white;
}

.selection-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-base);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.tip {
    font-size: 12px;
    color: var(--text-secondary);
}

.dp-grid {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-auto-rows: max-content;
    /* 防止拉伸 */
    gap: 12px;
}

/* DP Card */
.dp-card {
    border: 1px solid var(--border-base);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
    background-color: white;
}

.dp-card:hover {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
}

.dp-card.selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
}

.check-mark {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 18px;
    height: 18px;
    background-color: var(--el-color-primary);
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.dp-info {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
}

.dp-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
}

.dp-id {
    font-size: 12px;
    color: var(--text-secondary);
    font-family: monospace;
}

.dp-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
}

.dp-mode {
    color: var(--text-secondary);
    transform: scale(0.9);
    transform-origin: right center;
}
</style>