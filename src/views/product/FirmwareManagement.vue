<template>
    <div class="firmware-management">
        <div class="layout-container">
            <div class="left-panel">
                <ProductSidebar @select="handleProductSelect" />
            </div>

            <div class="right-panel">
                <div v-if="currentProduct" class="content-wrapper">
                    <div class="content-header">
                        <div class="header-info">
                            <h2 class="product-title">
                                {{ currentProduct.name }}
                                <el-tag size="small" effect="plain" class="ml-2">{{ currentProduct.type }}</el-tag>
                            </h2>
                            <p class="product-id">Product ID: {{ currentProduct.id }}</p>
                        </div>
                        <div class="header-stats">
                        </div>
                    </div>

                    <div class="content-body">
                        <el-tabs v-model="activeTab" class="main-tabs">
                            <el-tab-pane label="固件版本库" name="versions">
                                <FirmwareVersionPanel :product="currentProduct" />
                            </el-tab-pane>
                            <el-tab-pane label="升级任务记录" name="tasks">
                                <UpgradeTaskPanel :product="currentProduct" />
                            </el-tab-pane>
                        </el-tabs>
                    </div>
                </div>

                <div v-else class="empty-wrapper">
                    <el-empty description="请在左侧选择一个产品进行管理" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Product } from '@/api'

// 引入子组件
import ProductSidebar from './components/ProductSidebar.vue'
import FirmwareVersionPanel from './components/FirmwareVersionPanel.vue'
import UpgradeTaskPanel from './components/UpgradeTaskPanel.vue'

const currentProduct = ref<Product | null>(null)
const activeTab = ref('versions')

// 处理左侧选择
const handleProductSelect = (product: Product) => {
    currentProduct.value = product
    // 切换产品时，重置 Tab 或执行其他初始化
    console.log('Switched to product:', product.name)
}
</script>

<style scoped>
.firmware-management {
    /* 铺满父容器 (AppLayout 的 el-main) */
    height: 100%;
    display: flex;
    flex-direction: column;
}

.layout-container {
    display: flex;
    flex: 1;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    /* 确保容器高度撑满 */
    height: 100%;
}

/* 左侧定宽 */
.left-panel {
    width: 280px;
    flex-shrink: 0;
    height: 100%;
}

/* 右侧自适应 */
.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: #fff;
}

.content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.content-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fafafa;
}

.product-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
}

.ml-2 {
    margin-left: 8px;
}

.product-id {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-family: monospace;
}

.content-body {
    flex: 1;
    overflow: hidden;
    /* 让 tabs 内容自己滚动 */
    display: flex;
    flex-direction: column;
}

/* 深度调整 el-tabs 样式让它撑满 */
.main-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.el-tabs__header) {
    margin-bottom: 0;
    padding: 0 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.empty-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>