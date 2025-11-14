<template>
    <div class="exp-sidebar">
        <div class="sidebar-header">
            <el-input v-model="filterText" placeholder="搜索产品..." class="rounded-search" clearable>
                <template #prefix>
                    <el-icon class="search-icon">
                        <Search />
                    </el-icon>
                </template>
            </el-input>
        </div>

        <div class="product-list" v-loading="loading">
            <div v-for="(item, index) in filteredProducts" :key="item.id" class="product-card-item"
                :class="{ active: currentId === item.id }" @click="handleSelect(item)">
                <div class="icon-base" :class="`tech-bg-${index % 5}`">
                    <span class="product-initial">{{ item.name.charAt(0).toUpperCase() }}</span>
                </div>

                <div class="info-col">
                    <div class="p-name" :title="item.name">{{ item.name }}</div>
                    <div class="p-type">{{ item.type }}</div>
                </div>

                <div v-if="currentId === item.id" class="active-halo"></div>
            </div>

            <el-empty v-if="filteredProducts.length === 0 && !loading" description="无匹配产品" :image-size="60" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type { Product } from '@/types'

const emit = defineEmits<{
    (e: 'select', product: Product): void
}>()

// 模拟数据
const mockProducts: Product[] = [
    { id: 'P001', name: '智能温控器 Pro', type: '网关设备' },
    { id: 'P002', name: '工业传感器 X1', type: '传感器' },
    { id: 'P003', name: '家庭安防摄像头', type: '监控设备' },
    { id: 'P004', name: '水质监测仪', type: '监测仪' },
    { id: 'P005', name: '智能电表 2024', type: '计量设备' },
]

const loading = ref(false)
const products = ref<Product[]>([])
const filterText = ref('')
const currentId = ref('')

const loadProducts = async () => {
    loading.value = true
    try {
        await new Promise(r => setTimeout(r, 500))
        products.value = mockProducts
        const firstProduct = products.value[0]
        if (firstProduct) {
            handleSelect(firstProduct)
        }
    } finally {
        loading.value = false
    }
}

const filteredProducts = computed(() => {
    if (!filterText.value) return products.value
    return products.value.filter(p =>
        p.name.toLowerCase().includes(filterText.value.toLowerCase())
    )
})

const handleSelect = (item: Product) => {
    if (!item) return
    currentId.value = item.id
    emit('select', item)
}

onMounted(() => {
    loadProducts()
})
</script>

<style scoped>
.exp-sidebar {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    padding: 16px 12px;
}

.sidebar-header {
    margin-bottom: 20px;
    padding: 0 4px;
}

:deep(.rounded-search .el-input__wrapper) {
    border-radius: 12px;
    background-color: #f3f5f7;
    box-shadow: none !important;
    padding: 4px 12px;
    transition: background-color 0.2s;
    /* 只让背景色动画，避免抖动 */
}

:deep(.rounded-search .el-input__wrapper.is-focus) {
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

.product-list {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: none;
    padding: 0 4px;
}

.product-list::-webkit-scrollbar {
    display: none;
}

/* --- 卡片主样式 --- */
.product-card-item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 14px 12px;
    margin-bottom: 12px;
    border-radius: 16px;
    cursor: pointer;
    border: 1px solid transparent;
    background-color: transparent;

    /* ✨ 关键修复 1：去掉 all，只指定具体属性，消除模糊感 */
    transition: transform 0.2s ease-out, background-color 0.2s ease, box-shadow 0.2s ease;

    /* ✨ 关键修复 2：强制硬件加速抗锯齿 */
    -webkit-font-smoothing: antialiased;
    backface-visibility: hidden;
}

/* 悬停效果：保留上浮，但更克制 */
.product-card-item:hover {
    background-color: #f8f9fa;
    /* ✨ 关键修复 3：改用 translate3d 强制 GPU 渲染，通常比 translateY 更清晰 */
    transform: translate3d(0, -2px, 0);
}

/* 选中效果 */
.product-card-item.active {
    background-color: #ffffff;
    /* 稍微收敛一点阴影扩散半径，看起来更锐利 */
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: #edf2f7;
}

/* --- 图标底座 --- */
.icon-base {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 14px;
    font-weight: 700;
    font-size: 18px;
    flex-shrink: 0;
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);

    /* 给图标加一点微弱的内发光，更有质感 */
    background-image: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
}

/* 🎨 新配色方案：科技极客 (Tech Blue / Cool Tones)
   统一使用冷色调，看起来更专业、不杂乱。
*/
.tech-bg-0 {
    background-color: #2563eb;
    background-image: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

/* 经典蓝 */
.tech-bg-1 {
    background-color: #7c3aed;
    background-image: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
}

/* 极客紫 */
.tech-bg-2 {
    background-color: #0891b2;
    background-image: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%);
}

/* 海洋青 */
.tech-bg-3 {
    background-color: #4f46e5;
    background-image: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
}

/* 靛青色 */
.tech-bg-4 {
    background-color: #0d9488;
    background-image: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%);
}

/* 翡翠冷绿 */

.info-col {
    flex: 1;
    overflow: hidden;
}

.p-name {
    font-weight: 600;
    font-size: 15px;
    color: #1e293b;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* 增加文字渲染清晰度 */
    will-change: transform;
}

.p-type {
    font-size: 12px;
    color: #94a3b8;
}

.active-halo {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background-color: #3b82f6;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
</style>