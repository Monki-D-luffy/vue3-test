<template>
    <div class="toolbar">
        <div class="toolbar-left">
            <el-input :model-value="filters.keyword" @update:model-value="(val) => updateFilter('keyword', val)"
                placeholder="搜索设备名称/SN..." prefix-icon="Search" clearable class="filter-item w-300"
                @keyup.enter="emits('search')" @clear="emits('search')" />

            <el-select :model-value="filters.productId" @update:model-value="(val) => updateFilter('productId', val)"
                placeholder="所有产品" clearable class="filter-item w-150" @change="emits('search')">
                <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>

            <el-select :model-value="filters.isBound" @update:model-value="(val) => updateFilter('isBound', val)"
                placeholder="绑定状态" clearable class="filter-item w-120" @change="emits('search')">
                <el-option label="已绑定" value="true" />
                <el-option label="未绑定" value="false" />
            </el-select>

            <el-button type="primary" icon="Search" @click="emits('search')" :loading="loading">查询</el-button>
        </div>

        <div class="toolbar-right">
            <el-button icon="Refresh" circle @click="emits('refresh')" :loading="loading" />
            <el-button icon="Download" circle @click="emits('export')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import type { Product } from '@/types'

// Props 定义
const props = defineProps<{
    filters: {
        keyword: string;
        productId: string;
        isBound: string;
    };
    products: Product[];
    loading: boolean;
}>()

// Emits 定义
const emits = defineEmits<{
    (e: 'update:filters', value: any): void
    (e: 'search'): void
    (e: 'refresh'): void
    (e: 'export'): void
}>()

// 辅助函数：更新单个 filter 字段
const updateFilter = (key: string, value: any) => {
    emits('update:filters', { ...props.filters, [key]: value })
}
</script>

<style scoped>
.toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.toolbar-left {
    display: flex;
    gap: 12px;
}

.w-300 {
    width: 300px;
}

.w-150 {
    width: 150px;
}

.w-120 {
    width: 120px;
}
</style>