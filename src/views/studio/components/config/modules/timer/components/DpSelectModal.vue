<template>
    <el-dialog :model-value="modelValue" title="选择功能点 (Select DP)" width="880px" :close-on-click-modal="false"
        class="dp-select-modal noir-skin" append-to-body @update:model-value="handleClose">
        <div class="modal-body">
            <div class="search-bar">
                <el-input v-model="searchText" placeholder="搜索功能名称或标识..." prefix-icon="Search" clearable
                    class="noir-input" />
            </div>

            <div class="cards-container custom-scrollbar">
                <el-empty v-if="filteredDps.length === 0" :description="getEmptyText" :image-size="120" />

                <div v-else class="cards-grid">
                    <div v-for="dp in filteredDps" :key="dp.id" class="dp-card hover-gold" @click="handleSelect(dp)">
                        <div class="card-header">
                            <span class="dp-name text-ellipsis" :title="dp.name">{{ dp.name }}</span>
                            <el-tag type="info" size="small" effect="plain" class="dp-id-tag">
                                DP {{ dp.id }}
                            </el-tag>
                        </div>

                        <div class="card-content">
                            <div class="info-row">
                                <el-icon class="icon">
                                    <Key />
                                </el-icon>
                                <span class="label">标识:</span>
                                <span class="value text-ellipsis" :title="dp.code">{{ dp.code }}</span>
                            </div>
                            <div class="info-row">
                                <el-icon class="icon">
                                    <Connection />
                                </el-icon>
                                <span class="label">类型:</span>
                                <span class="value">{{ dp.type }}</span>
                            </div>
                            <div class="info-row">
                                <el-icon class="icon">
                                    <Setting />
                                </el-icon>
                                <span class="label">模式:</span>
                                <span class="value">{{ dp.mode.toUpperCase() }}</span>
                            </div>
                        </div>

                        <div class="card-action-area">
                            <el-icon class="plus-icon">
                                <Plus />
                            </el-icon>
                            <span class="select-text">选择</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Key, Connection, Setting, Plus } from '@element-plus/icons-vue';

// 定义 Props, Emits 和 Interfaces
interface DpDef {
    id: number;
    code: string;
    name: string;
    type: string;
    mode: string;
}

const props = defineProps<{
    modelValue: boolean,
    allDps: DpDef[],
    excludeIds: number[]
}>();

const emit = defineEmits(['update:modelValue', 'select']);

const searchText = ref('');

// 核心逻辑修改：先剔除已选的，再过滤搜索词
const filteredDps = computed(() => {
    // 1. 第一步：物理剔除已存在于 excludeIds 中的功能
    let candidates = props.allDps.filter(dp => !props.excludeIds.includes(dp.id));

    // 2. 第二步：如果有搜索词，进行模糊匹配
    if (searchText.value) {
        const text = searchText.value.toLowerCase();
        candidates = candidates.filter(dp =>
            dp.name.toLowerCase().includes(text) ||
            dp.code.toLowerCase().includes(text)
        );
    }
    return candidates;
});

// 动态显示空状态文案
const getEmptyText = computed(() => {
    if (searchText.value) return '未找到匹配的功能点';
    // 如果没有搜索词却为空，说明所有功能都绑定完了
    return '所有可用功能已全部添加';
});

const handleClose = (val: boolean) => {
    emit('update:modelValue', val);
    // 关闭时清空搜索，体验更好
    if (!val) searchText.value = '';
};

const handleSelect = (dp: DpDef) => {
    emit('select', dp);
    handleClose(false);
};
</script>

<style lang="scss">
/* 定义局部 CSS 变量 */
.dp-select-modal {
    --card-bg: #ffffff;
    --card-border: #e4e7ed;
    --card-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    --text-primary: #303133;
    --text-secondary: #909399;
    --accent-gold: #d4af37;
    --accent-gold-hover-bg: #fffdf5;
    --accent-gold-shadow: rgba(212, 175, 55, 0.2);
    --action-bg: #f5f7fa;
}

/* 暗黑模式适配 */
html.dark .dp-select-modal {
    --card-bg: #252525;
    --card-border: #363637;
    --card-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
    --accent-gold-hover-bg: #2a2822;
    --action-bg: #1f1f1f;
}

.dp-select-modal .el-dialog__body {
    padding: 20px !important;
    height: 600px;
    display: flex;
    flex-direction: column;
}
</style>

<style scoped lang="scss">
.modal-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.search-bar {
    margin-bottom: 20px;
    flex-shrink: 0;
}

.cards-container {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
}

.cards-grid {
    display: grid;
    /* 响应式网格：最小宽度 240px，自动填充 */
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    padding-bottom: 16px;
}

.dp-card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: var(--card-shadow);
    cursor: pointer;

    /* 悬浮金光效果 */
    &.hover-gold:hover {
        border-color: var(--accent-gold);
        background: var(--accent-gold-hover-bg);
        box-shadow: 0 8px 20px var(--accent-gold-shadow);
        transform: translateY(-4px);

        .card-action-area {
            color: var(--accent-gold);
            background: transparent;
            border-top-color: rgba(212, 175, 55, 0.1);

            .plus-icon {
                transform: scale(1.1);
            }
        }
    }
}

.card-header {
    padding: 16px 16px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dp-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin-right: 8px;
}

.dp-id-tag {
    font-family: 'Inter', monospace;
    background: transparent !important;
    border-color: var(--card-border) !important;
    color: var(--text-secondary) !important;
}

.card-content {
    padding: 0 16px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-row {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;

    .icon {
        margin-right: 6px;
        font-size: 14px;
        opacity: 0.8;
    }

    .label {
        margin-right: 6px;
    }

    .value {
        font-weight: 500;
        color: var(--text-primary);
        font-family: 'Inter', monospace;
    }
}

/* 卡片底部动作区 */
.card-action-area {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--action-bg);
    border-top: 1px solid var(--card-border);
    color: var(--text-secondary);
    font-size: 14px;
    transition: all 0.3s ease;

    .plus-icon {
        font-size: 16px;
        transition: transform 0.3s ease;
    }
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>