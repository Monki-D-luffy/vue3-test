<template>
    <div class="product-sidebar">
        <div class="sidebar-header">
            <el-input v-model="searchKeyword" placeholder="搜索产品名称..." clearable prefix-icon="Search" />
        </div>

        <div class="product-list" v-loading="loading">
            <div v-for="item in filteredProducts" :key="item.id" class="product-item"
                :class="{ active: selectedId === item.id }" @click="handleSelect(item)">
                <div class="product-icon">
                    <el-icon>
                        <Box />
                    </el-icon>
                </div>
                <div class="product-info">
                    <span class="name">{{ item.name }}</span>
                    <span class="type">{{ item.type }}</span>
                </div>
                <el-icon v-if="selectedId === item.id" class="arrow">
                    <ArrowRight />
                </el-icon>
            </div>

            <el-empty v-if="filteredProducts.length === 0 && !loading" description="无此产品" :image-size="60" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Box, ArrowRight, Search } from '@element-plus/icons-vue'
import { fetchProducts, type Product } from '@/api'

// 定义事件
const emit = defineEmits(['select'])

const loading = ref(false)
const products = ref<Product[]>([])
const searchKeyword = ref('')
const selectedId = ref<string | null>(null)

// 过滤逻辑
const filteredProducts = computed(() => {
    if (!searchKeyword.value) return products.value
    const kw = searchKeyword.value.toLowerCase()
    return products.value.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.type.toLowerCase().includes(kw)
    )
})

// 加载数据
const loadProducts = async () => {
    loading.value = true
    try {
        // 调用 api/index.ts 中的 fetchProducts
        const data = await fetchProducts()
        products.value = data

        // 默认选中第一个
        if (products.value.length > 0) {
            handleSelect(products.value[0]!)
        }
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

// 选择处理
const handleSelect = (product: Product) => {
    selectedId.value = product.id
    emit('select', product)
}

onMounted(() => {
    loadProducts()
})
</script>

<style scoped>
.product-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #fff;
    border-right: 1px solid var(--el-border-color-light);
}

.sidebar-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.product-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.product-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
}

.product-item:hover {
    background-color: var(--el-fill-color-light);
}

.product-item.active {
    background-color: var(--el-color-primary-light-9);
    border-left-color: var(--el-color-primary);
}

.product-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background-color: var(--el-fill-color);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: var(--el-text-color-secondary);
}

.product-item.active .product-icon {
    background-color: #fff;
    color: var(--el-color-primary);
}

.product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.product-info .name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 2px;
}

.product-info .type {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.arrow {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
}
</style>