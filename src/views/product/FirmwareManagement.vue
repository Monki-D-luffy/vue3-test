<template>
    <div class="exp-firmware-card card-base">
        <ResizableLayout :initial-width="260">

            <template #sidebar>
                <ExpProductSidebar @select="handleProductSelect" class="firmware-sidebar" />
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
                    <el-empty description="请选择产品" :image-size="200">
                        <template #description>
                            <div class="empty-tip-box">
                                <h3>等待选择产品</h3>
                                <p>请从左侧列表选择一个产品以管理其固件版本与升级任务</p>
                            </div>
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
    // 切换产品时重置到版本库或保持当前 Tab，视业务需求而定
    // activeTab.value = 'versions' 
}
</script>

<style scoped>
/* ✅ 布局容器 
  利用 flex: 1 或 height: 100% 撑满 AppLayout 给出的空间
*/
.exp-firmware-card {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* 防止圆角溢出 */
    background-color: var(--app-bg-card);
    /* 修正变量 */
}

/* 侧边栏样式微调 (通常需要透传给子组件或在这里覆盖) */
.firmware-sidebar {
    height: 100%;
    background-color: var(--app-bg-canvas);
    /* 侧边栏稍微深一点，区分层级 */
    border-right: 1px solid var(--el-border-color-light);
}

.content-canvas {
    height: 100%;
    overflow-y: auto;
    /* ✅ 内容区域独立滚动 */
    padding: 24px;
    background-color: var(--app-bg-card);
}

.section-header {
    margin-bottom: 24px;
}

/* Tabs 区域 */
.section-body {
    /* 移除不必要的背景和边框，让 Tabs 融入大卡片 */
    background-color: transparent;
}

/* --- Element Plus Tabs 深度定制 --- */
:deep(.modern-card-tabs .el-tabs__header) {
    margin: 0 0 20px 0;
    border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.modern-card-tabs .el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: transparent;
    /* 移除默认灰线 */
}

:deep(.modern-card-tabs .el-tabs__item) {
    height: 48px;
    line-height: 48px;
    font-size: 15px;
    font-weight: 500;
    color: var(--app-text-sub);
    transition: all 0.3s;
}

:deep(.modern-card-tabs .el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 700;
    font-size: 16px;
}

:deep(.modern-card-tabs .el-tabs__active-bar) {
    height: 3px;
    border-radius: 3px;
    background-color: var(--el-color-primary);
}

:deep(.modern-card-tabs .el-tabs__content) {
    padding: 4px 0;
    /* 给一点 breathing room */
}

/* --- 空状态美化 --- */
.empty-canvas {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at center, var(--app-bg-canvas) 0%, var(--app-bg-card) 70%);
}

.empty-tip-box {
    text-align: center;
}

.empty-tip-box h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: var(--app-text-main);
}

.empty-tip-box p {
    margin: 0;
    color: var(--app-text-sub);
}
</style>