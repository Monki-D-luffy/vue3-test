<template>
    <div class="toolbar-container">
        <div class="left-panel">
            <div class="search-box">
                <el-input v-model="searchQuery" placeholder="搜索产品名称或 PID..." clearable @input="emitChange">
                    <template #prefix><el-icon>
                            <Search />
                        </el-icon></template>
                </el-input>
            </div>

            <div class="divider"></div>

            <div class="filter-group">
                <el-check-tag v-for="status in filters" :key="status.value" :checked="activeFilter === status.value"
                    @change="handleFilterChange(status.value)">
                    {{ status.label }}
                </el-check-tag>
            </div>
        </div>

        <div class="right-panel">
            <el-tooltip content="切换视图" placement="top">
                <el-radio-group v-model="viewMode" size="small" @change="emitViewChange">
                    <el-radio-button value="grid"><el-icon>
                            <Grid />
                        </el-icon></el-radio-button>
                    <el-radio-button value="list"><el-icon>
                            <Operation />
                        </el-icon></el-radio-button>
                </el-radio-group>
            </el-tooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search, Grid, Operation } from '@element-plus/icons-vue';

const emit = defineEmits(['update:search', 'update:filter', 'update:view', 'change']);

const searchQuery = ref('');
const activeFilter = ref('ALL');
const viewMode = ref('grid');

const filters = [
    { label: '全部', value: 'ALL' },
    { label: '开发中', value: 'DEVELOPMENT' },
    { label: '已发布', value: 'RELEASED' },
    { label: '异常', value: 'ALERT' },
];

const handleFilterChange = (val: string) => {
    activeFilter.value = val;
    emitChange();
};

const emitChange = () => {
    emit('change', { q: searchQuery.value, status: activeFilter.value });
};

const emitViewChange = (val: string) => {
    emit('update:view', val);
};
</script>

<style scoped>
.toolbar-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--bg-card);
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid var(--border-base);
    margin-bottom: 24px;
    box-shadow: var(--shadow-card);
    flex-wrap: wrap;
    /* 响应式换行 */
    gap: 16px;
}

.left-panel {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 300px;
}

.search-box {
    width: 280px;
}

/* 覆盖 Element Plus Input 样式，去边框化 */
.search-box :deep(.el-input__wrapper) {
    background-color: var(--bg-canvas);
    box-shadow: none !important;
    border-radius: 8px;
}

.search-box :deep(.el-input__wrapper.is-focus) {
    background-color: var(--bg-card);
    box-shadow: 0 0 0 1px var(--el-color-primary) !important;
}

.divider {
    width: 1px;
    height: 20px;
    background-color: var(--border-base);
}

.filter-group {
    display: flex;
    gap: 8px;
    overflow-x: auto;
}

/* 覆盖 Check Tag 样式 */
.filter-group :deep(.el-check-tag) {
    background-color: transparent;
    border: 1px solid transparent;
    font-weight: normal;
    color: var(--text-secondary);
    padding: 4px 12px;
    border-radius: 20px;
    transition: all 0.2s;
}

.filter-group :deep(.el-check-tag:hover) {
    background-color: var(--bg-canvas);
}

.filter-group :deep(.el-check-tag.is-checked) {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
}

.right-panel {
    display: flex;
    align-items: center;
}
</style>