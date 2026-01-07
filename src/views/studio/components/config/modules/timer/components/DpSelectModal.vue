<template>
    <el-dialog v-model="visible" title="添加可定时功能 (Add Capability)" width="480px" append-to-body class="noir-dialog"
        destroy-on-close>
        <div class="dp-selector-body">
            <div class="search-bar">
                <el-input v-model="searchQuery" placeholder="搜索功能名称或 DP ID" prefix-icon="Search"
                    class="noir-input-ghost" clearable />
            </div>

            <div class="dp-grid-list custom-scrollbar">
                <el-empty v-if="filteredDps.length === 0" description="暂无符合条件的 DP 或已全部添加" :image-size="60" />

                <div v-for="dp in filteredDps" :key="dp.id" class="dp-card-item"
                    :class="{ active: selectedDpId === dp.id }" @click="selectedDpId = dp.id">
                    <div class="card-icon">
                        <span class="dp-id">DP{{ dp.id }}</span>
                    </div>
                    <div class="card-info">
                        <span class="dp-name">{{ dp.name }}</span>
                        <span class="dp-code">{{ dp.code }}</span>
                    </div>
                    <div class="card-meta">
                        <el-tag size="small" type="info" effect="light">{{ dp.type }}</el-tag>
                    </div>
                    <div class="check-mark" v-if="selectedDpId === dp.id">
                        <el-icon>
                            <Check />
                        </el-icon>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <span class="footer-tip" v-if="selectedDpId">
                    已选择: <span class="highlight">{{ getSelectedName }}</span>
                </span>
                <div class="footer-btns">
                    <el-button @click="visible = false">取消</el-button>
                    <el-button type="primary" class="gold-btn-solid" :disabled="!selectedDpId" @click="handleConfirm">
                        确认添加
                    </el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, Check } from '@element-plus/icons-vue';

// 定义传入的原始 DP 类型
interface RawDp {
    id: number;
    code: string;
    name: string;
    type: string;
    mode: string;
}

const props = defineProps<{
    modelValue: boolean;
    allDps: RawDp[];      // Store 里的所有 DP
    excludeIds: number[]; // 已经添加过的 DP ID
}>();

const emit = defineEmits(['update:modelValue', 'select']);

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const searchQuery = ref('');
const selectedDpId = ref<number | null>(null);

// 过滤逻辑：排除只读(ro)、已添加的、不符合搜索词的
const filteredDps = computed(() => {
    return props.allDps.filter(dp => {
        // 1. 必须是可写的 (rw)
        if (dp.mode === 'ro') return false;
        // 2. 不能是已添加的
        if (props.excludeIds.includes(dp.id)) return false;
        // 3. 搜索匹配
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            return (
                dp.name.toLowerCase().includes(q) ||
                dp.code.toLowerCase().includes(q) ||
                String(dp.id).includes(q)
            );
        }
        return true;
    });
});

const getSelectedName = computed(() => {
    const dp = props.allDps.find(d => d.id === selectedDpId.value);
    return dp ? dp.name : '';
});

const handleConfirm = () => {
    if (selectedDpId.value !== null) {
        const dp = props.allDps.find(d => d.id === selectedDpId.value);
        if (dp) {
            emit('select', dp);
            visible.value = false;
            selectedDpId.value = null; // 重置
        }
    }
};

// 每次打开重置状态
watch(() => props.modelValue, (val) => {
    if (val) {
        searchQuery.value = '';
        selectedDpId.value = null;
    }
});
</script>

<style scoped lang="scss">
.dp-selector-body {
    padding: 10px 0;
}

.search-bar {
    margin-bottom: 16px;
    padding: 0 4px;
}

.dp-grid-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    max-height: 320px;
    overflow-y: auto;
    padding: 4px;
}

.dp-card-item {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fff;

    &:hover {
        border-color: #c0c4cc;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &.active {
        border-color: #d4af37;
        background: #fffcf5;
        box-shadow: 0 0 0 1px #d4af37 inset;
    }
}

.card-icon {
    margin-bottom: 8px;

    .dp-id {
        font-size: 12px;
        font-weight: 700;
        color: #909399;
        background: #f4f4f5;
        padding: 2px 6px;
        border-radius: 4px;
    }
}

.card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
}

.dp-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    line-height: 1.3;
}

.dp-code {
    font-size: 12px;
    color: #909399;
    font-family: monospace;
}

.card-meta {
    display: flex;
    justify-content: flex-end;
}

.check-mark {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: #d4af37;
    border-radius: 50%;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    animation: zoomIn 0.2s;
}

@keyframes zoomIn {
    from {
        transform: scale(0);
    }

    to {
        transform: scale(1);
    }
}

.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer-tip {
    font-size: 13px;
    color: #606266;

    .highlight {
        color: #d4af37;
        font-weight: 600;
    }
}

/* 覆盖输入框样式 */
:deep(.noir-input-ghost .el-input__wrapper) {
    box-shadow: 0 0 0 1px #dcdfe6 inset;

    &:hover {
        box-shadow: 0 0 0 1px #c0c4cc inset;
    }

    &.is-focus {
        box-shadow: 0 0 0 1px #d4af37 inset !important;
    }
}

:deep(.gold-btn-solid) {
    background: #1a1a1a;
    border-color: #1a1a1a;
    color: #d4af37;

    &:disabled {
        background: #f4f4f5;
        border-color: #e4e7ed;
        color: #c0c4cc;
    }
}
</style>