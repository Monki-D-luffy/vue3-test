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
    background-color: #fff;
    overflow: hidden;
}

.content-canvas {
    height: 100%;
    overflow-y: auto;
    background-color: #f5f7fa;
    padding: 20px;
    /* 底部留白 */
    padding-bottom: 40px;
    display: block;
    /* 优化滚动性能，防止卡顿 */
    scroll-behavior: smooth;
    /* 强制启用硬件加速，减少重绘 */
    will-change: transform;
}

.section-header {
    margin-bottom: 20px;
}

.section-body {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #ebeef5;
    min-height: 400px;
    /* 确保 overflow 为 visible，防止内部产生滚动陷阱 */
    overflow: visible !important;
}

/* Tabs 样式优化 
   1. 移除了 sticky 吸顶
   2. 强制 overflow: visible 防止滚动条卡顿
*/
:deep(.modern-card-tabs .el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    border-bottom: 1px solid #f0f2f5;
    background-color: #fff;
    /* ✨ 已移除 position: sticky 及相关属性 */
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
}

:deep(.modern-card-tabs .el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: #f0f2f5;
}

:deep(.modern-card-tabs .el-tabs__item) {
    height: 56px;
    line-height: 56px;
    font-size: 15px;
    font-weight: 500;
    color: #606266;
}

:deep(.modern-card-tabs .el-tabs__item.is-active) {
    color: #409eff;
    font-weight: 600;
}

:deep(.modern-card-tabs .el-tabs__content) {
    padding: 0;
    /* ✨ 关键修复：确保 Tab 内容区不会拦截滚动事件 */
    overflow: visible !important;
}

/* ✨ 额外修复：防止 el-table 内部产生不必要的滚动容器 */
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__footer-wrapper) {
    overflow: visible !important;
}

/* ✨ 终极修复：如果 el-table 撑开后，鼠标悬停在表格上滚轮失效，
   通常是因为表格试图处理横向滚动。
   加上 touch-action 可以优化某些浏览器的行为。
*/
:deep(.el-table) {
    touch-action: auto;
}

.empty-canvas {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f7fa;
}

.empty-tip {
    color: #909399;
    font-size: 14px;
    margin-top: 8px;
}
</style>