<template>
    <div class="firmware-management">
        <ResizableLayout :initial-width="200">

            <template #sidebar>
                <ProductSidebar @select="handleProductSelect" />
            </template>

            <template #content>
                <div v-if="currentProduct" class="content-wrapper">
                    <div class="content-header">
                        <div class="header-info">
                            <h2 class="product-title">
                                {{ currentProduct.name }}
                                <el-tag size="small" effect="plain" class="ml-2">{{ currentProduct.type }}</el-tag>
                            </h2>
                            <p class="product-id">Product ID: {{ currentProduct.id }}</p>
                        </div>
                        <div class="header-stats"></div>
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
            </template>

        </ResizableLayout>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Product } from '@/types'
// 引入组件
import ResizableLayout from '@/components/ResizableLayout.vue'
import ProductSidebar from './components/ProductSidebar.vue'
import FirmwareVersionPanel from './components/FirmwareVersionPanel.vue'
import UpgradeTaskPanel from './components/UpgradeTaskPanel.vue'

const currentProduct = ref<Product | null>(null)
const activeTab = ref('versions')

const handleProductSelect = (product: Product) => {
    currentProduct.value = product
}
</script>

<style scoped>
.firmware-management {
    height: 100%;
    /* 如果外层没有圆角/背景，可以在这里加，也可以在 ResizableLayout 里加 */
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(35, 164, 193, 0.864);
    overflow: hidden;
}

/* 下面的样式只跟当前页面的具体内容有关 */
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
    display: flex;
    flex-direction: column;
}

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