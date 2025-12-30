<template>
    <div class="p-6 h-full flex flex-col gap-6 bg-[var(--bg-canvas)] overflow-hidden">

        <div class="flex justify-between items-end shrink-0">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-primary)] tracking-tight">产品管理</h1>
                <p class="text-[var(--text-secondary)] mt-1 text-sm">管理您的 IoT 设备定义与生命周期</p>
            </div>

            <div class="flex gap-3">
                <el-input v-model="searchKeyword" placeholder="搜索产品..." prefix-icon="Search" class="w-64" clearable
                    @input="handleSearch" />

                <el-button type="primary" size="default" icon="Plus" class="shadow-md shadow-primary/30"
                    @click="goCreate">
                    创建产品
                </el-button>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0 -mr-2 pr-2" v-loading="loading">

            <div v-if="products.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                <ProductCard v-for="item in products" :key="item.id" :product="item" @enter="handleEnter" />
            </div>

            <div v-else-if="!loading"
                class="h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
                <el-empty description="暂无产品，去创建一个吧！" />
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';
import ProductCard from './components/ProductCard.vue';
import { fetchProducts } from '@/api/modules/product';
import type { ProductListItem } from '@/types/product';

const router = useRouter();
const loading = ref(false);
const products = ref<ProductListItem[]>([]);
const searchKeyword = ref('');

// 获取数据
const loadData = async () => {
    loading.value = true;
    try {
        const res = await fetchProducts({ q: searchKeyword.value });
        // 兼容 mock-server 的不同返回结构
        // @ts-ignore
        products.value = Array.isArray(res) ? res : (res.data?.items || []);
    } catch (err) {
        console.error('Failed to load products:', err);
    } finally {
        loading.value = false;
    }
};

// 搜索防抖
const handleSearch = useDebounceFn(() => {
    loadData();
}, 400);

// 跳转逻辑
const goCreate = () => router.push({ name: 'ProductCreate' });
const handleEnter = (pid: string) => {
    // 跳转到产品详情页 (底层架构已定义好)
    router.push({ name: 'ProductOverview', params: { pid } });
};

onMounted(() => {
    loadData();
});
</script>