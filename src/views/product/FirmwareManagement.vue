<template>
    <div class="exp-firmware-layout">
        <ResizableLayout :initial-width="240">

            <template #sidebar>
                <ExpProductSidebar @select="handleProductSelect" />
            </template>

            <template #content>
                <div v-if="currentProduct" class="content-canvas">

                    <div class="section-header">
                        <ExpFirmwareHeader :product="currentProduct" />
                    </div>

                    <div class="section-body">
                        <el-tabs v-model="activeTab" class="modern-card-tabs">

                            <el-tab-pane label="固件版本库" name="versions">
                                <ExpFirmwareVersionPanel :key="currentProduct.id" :product="currentProduct" />
                            </el-tab-pane>

                            <el-tab-pane label="升级任务记录" name="tasks">
                                <ExpUpgradeTaskPanel :key="currentProduct.id" :product="currentProduct" />
                            </el-tab-pane>

                        </el-tabs>
                    </div>
                </div>

                <div v-else class="empty-canvas">
                    <el-empty description="请从左侧列表选择一个产品" :image-size="200">
                        <template #description>
                            <p class="empty-tip">点击侧边栏的产品以管理其固件版本与升级任务</p>
                        </template>
                    </el-empty>
                </div>
            </template>

        </ResizableLayout>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Product } from '@/types'
import ResizableLayout from '@/components/ResizableLayout.vue'
import ExpFirmwareHeader from './components/firmware/ExpFirmwareHeader.vue'
import ExpProductSidebar from './components/firmware/ExpProductSidebar.vue'
import ExpFirmwareVersionPanel from './components/firmware/ExpFirmwareVersionPanel.vue'
import ExpUpgradeTaskPanel from './components/firmware/ExpUpgradeTaskPanel.vue'

const currentProduct = ref<Product | null>(null)
const activeTab = ref('tasks')

const handleProductSelect = (product: Product) => {
    currentProduct.value = product
    activeTab.value = 'versions'
}
</script>

<style scoped>
.exp-firmware-layout {
    height: 100%;
    width: 100%;
    /* ✨ [修复] 使用变量，适配黑夜模式 */
    background-color: var(--bg-card);
    overflow: hidden;
}

.content-canvas {
    height: 100%;
    overflow-y: auto;
    /* ✨ [修复] 画布背景色变量 */
    background-color: var(--bg-canvas);
    padding: 20px;
    padding-bottom: 40px;
    display: block;
    scroll-behavior: smooth;
    will-change: transform;
}

.section-header {
    margin-bottom: 20px;
}

.section-body {
    /* ✨ [修复] 卡片背景色变量 */
    background-color: var(--bg-card);
    border-radius: 12px;
    /* ✨ [修复] 阴影变量 */
    box-shadow: var(--shadow-card);
    /* ✨ [修复] 边框变量 */
    border: 1px solid var(--border-color-light);
    min-height: 400px;
    overflow: visible !important;
}

/* Tabs 样式优化 */
:deep(.modern-card-tabs .el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    /* ✨ [修复] */
    border-bottom: 1px solid var(--border-color-light);
    background-color: var(--bg-card);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}

:deep(.modern-card-tabs .el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: var(--border-color-light);
}

:deep(.modern-card-tabs .el-tabs__item) {
    height: 56px;
    line-height: 56px;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-secondary);
    /* ✨ [修复] */
}

:deep(.modern-card-tabs .el-tabs__item.is-active) {
    color: var(--color-primary);
    font-weight: 600;
}

:deep(.modern-card-tabs .el-tabs__content) {
    padding: 0;
    overflow: visible !important;
}

:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__footer-wrapper) {
    overflow: visible !important;
}

:deep(.el-table) {
    touch-action: auto;
    /* ✨ [修复] 强制表格背景透明或跟随卡片，防止表格变成白色方块 */
    --el-table-bg-color: var(--bg-card);
    --el-table-tr-bg-color: var(--bg-card);
    --el-table-header-bg-color: var(--bg-hover);
    --el-table-border-color: var(--border-color-light);
    color: var(--text-primary);
}

.empty-canvas {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-canvas);
    /* ✨ [修复] */
}

.empty-tip {
    color: var(--text-placeholder);
    /* ✨ [修复] */
    font-size: 14px;
    margin-top: 8px;
}
</style>