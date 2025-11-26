<template>
    <div class="filter-card card-base">
        <div class="filter-left">
            <el-input :model-value="filters.keyword" @update:model-value="(val) => updateFilter('keyword', val)"
                placeholder="搜索设备名称/SN..." :prefix-icon="Search" clearable class="filter-item search-input"
                @keyup.enter="emits('search')" @clear="emits('search')" />

            <el-date-picker :model-value="filters.dateRange"
                @update:model-value="(val) => updateFilter('dateRange', val)" type="daterange" unlink-panels
                range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
                class="filter-item date-picker-item" @change="emits('search')" />

            <el-select :model-value="filters.productId" @update:model-value="(val) => updateFilter('productId', val)"
                placeholder="所有产品" clearable class="filter-item product-select" @change="emits('search')">
                <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>

            <el-select :model-value="filters.isBound" @update:model-value="(val) => updateFilter('isBound', val)"
                placeholder="绑定状态" clearable class="filter-item status-select" @change="emits('search')">
                <el-option label="已绑定" value="true" />
                <el-option label="未绑定" value="false" />
            </el-select>

            <el-button type="primary" :icon="Search" @click="emits('search')" :loading="loading" class="action-btn">
                查询
            </el-button>

            <el-button :icon="RefreshLeft" @click="emits('reset')" class="action-btn" plain>
                重置
            </el-button>
        </div>

        <div class="filter-right">
            <el-tooltip content="刷新列表" placement="top">
                <el-button :icon="Refresh" circle @click="emits('refresh')" :loading="loading" />
            </el-tooltip>
            <el-tooltip content="导出数据" placement="top">
                <el-button :icon="Download" circle @click="emits('export')" />
            </el-tooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Search, Refresh, Download, RefreshLeft } from '@element-plus/icons-vue'
import type { Product } from '@/types'

// 接收父组件数据
const props = defineProps < {
    filters: {
        keyword: string;
        productId: string;
        isBound: string;
        dateRange: any;
    };
    products: Product[];
    loading: boolean;
} > ()

// 定义事件
const emits = defineEmits < {
    (e: 'update:filters', value: any): void
    (e: 'search'): void
        (e: 'reset'): void
            (e: 'refresh'): void
                (e: 'export'): void
}> ()

// 手动触发更新，解决输入框卡死问题
const updateFilter = (key: string, value: any) => {
    emits('update:filters', { ...props.filters, [key]: value })
}
</script>

<style scoped>
.filter-card {
    padding: 18px 24px;
    background-color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
}

.filter-left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    flex: 1;
}

.filter-right {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.filter-item {
    transition: width 0.3s ease;
}

.search-input {
    width: 220px;
    max-width: 100%;
}

.date-picker-item {
    width: 260px !important;
    max-width: 100%;
}

.product-select {
    width: 150px;
}

.status-select {
    width: 120px;
}

@media (max-width: 1024px) {
    .filter-card {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-left {
        width: 100%;
    }

    .search-input,
    .date-picker-item,
    .product-select,
    .status-select,
    .action-btn {
        width: 100% !important;
    }

    .filter-right {
        justify-content: flex-end;
        width: 100%;
        border-top: 1px solid #f0f2f5;
        padding-top: 12px;
    }
}
</style>