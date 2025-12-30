<template>
    <div class="page-container">

        <PageMainHeader title="产品管理" subtitle="定义与管理 IoT 设备的产品模型、通讯协议与生命周期">
            <template #actions>
                <el-button type="primary" size="large" icon="Plus" class="create-btn" @click="handleCreate">
                    创建产品
                </el-button>
            </template>
        </PageMainHeader>

        <ProductStats />

        <ProductToolbar @change="handleSearchChange" @update:view="viewMode = $event" />

        <div class="content-area" v-loading="loading">

            <transition name="el-fade-in-linear" mode="out-in">

                <div v-if="viewMode === 'grid'" key="grid">
                    <div v-if="products.length > 0">
                        <el-row :gutter="20">
                            <el-col v-for="item in products" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
                                <ProductCard :product="item" @manage="handleEnter" @develop="handleDevelop"
                                    class="mb-4" />
                            </el-col>
                        </el-row>
                    </div>
                    <el-empty v-else description="没有找到匹配的产品" />
                </div>

                <ProductTable v-else key="list" :products="products" @manage="handleEnter" @develop="handleDevelop" />
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';

// 引入组件
import PageMainHeader from '@/components/PageMainHeader.vue';
import ProductCard from './components/ProductCard.vue';
// 引入新拆分的子组件
import ProductStats from './components/ProductStats.vue';
import ProductToolbar from './components/ProductToolbar.vue';
import ProductTable from './components/ProductTable.vue';

import type { ProductListItem } from '@/types/product';

const router = useRouter();
const loading = ref(false);
const viewMode = ref('grid');
const products = ref<ProductListItem[]>([]);

// 模拟数据加载
const loadData = async (params = {}) => {
    loading.value = true;
    console.log('Loading with params:', params);

    setTimeout(() => {
        // Mock Data
        products.value = Array.from({ length: 12 }).map((_, i) => ({
            id: `PID-${1000 + i}`,
            name: i % 2 === 0 ? `智能 WiFi 插座 Gen${i}` : `Zigbee 温湿度传感器 Pro`,
            category: i % 2 === 0 ? 'SWITCH' : 'SENSOR',
            protocol: i % 2 === 0 ? 'WIFI' : 'ZIGBEE',
            status: i === 0 ? 'ALERT' : (i % 3 === 0 ? 'RELEASED' : 'DEVELOPMENT'),
            activeDeviceCount: Math.floor(Math.random() * 5000),
            alertCount: i === 0 ? 5 : 0,
            latestFirmware: 'v1.0.2',
            lastUpdateTime: Date.now()
        }));
        loading.value = false;
    }, 500);
};

// 事件处理
const handleCreate = () => router.push({ name: 'ProductCreate' });
const handleEnter = (pid: string) => router.push({ name: 'ProductOverview', params: { pid } });
const handleSearchChange = (params: any) => loadData(params);

const handleDevelop = (pid: string) => {
    router.push({
        name: 'ProductDevelop',
        params: { pid }
    });
};


onMounted(() => {
    loadData();
});
</script>

<style scoped>
.page-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;
    background-color: var(--bg-canvas);
    overflow: hidden;
}

.create-btn {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.content-area {
    flex: 1;
    overflow-y: auto;
    /* 防止 Grid 撑开宽度导致横向滚动条 */
    overflow-x: hidden;
    padding-right: 4px;
}

.mb-4 {
    margin-bottom: 20px;
}
</style>