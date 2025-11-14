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
// 引入通用组件
import ResizableLayout from '@/components/ResizableLayout.vue'
// 引入新开发的实验性组件
import ExpFirmwareHeader from './components/experimental/ExpFirmwareHeader.vue'
import ExpProductSidebar from './components/experimental/ExpProductSidebar.vue'

// 下一步我们将创建这两个组件，届时取消注释
import ExpFirmwareVersionPanel from './components/experimental/ExpFirmwareVersionPanel.vue'
import ExpUpgradeTaskPanel from './components/experimental/ExpUpgradeTaskPanel.vue'

const currentProduct = ref<Product | null>(null)
const activeTab = ref('versions')

const handleProductSelect = (product: Product) => {
    currentProduct.value = product
    // 切换产品时重置 Tab
    activeTab.value = 'versions'
}
</script>

<style scoped>
/* 全屏容器 */
.exp-firmware-layout {
    height: 100%;
    width: 100%;
    background-color: #fff;
    overflow: hidden;
}

/* 画布区域：核心改动 -> 灰色背景，增加 padding */
.content-canvas {
    height: 100%;
    background-color: #f5f7fa;
    /* 现代 SaaS 常用的浅灰底色 */
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* 卡片之间的间距 */
    overflow: hidden;
}

/* 头部区域：防止被压缩 */
.section-header {
    flex-shrink: 0;
}

/* 主体区域：占据剩余空间，自适应 */
.section-body {
    flex: 1;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #ebeef5;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Tabs 样式深度定制 */
:deep(.modern-card-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.modern-card-tabs .el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    border-bottom: 1px solid #f0f2f5;
    background-color: #fff;
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
    flex: 1;
    overflow: hidden;
    padding: 0;
    /* 内容区无 Padding，交给子组件控制 */
    position: relative;
}

/* 临时占位符样式 */
.placeholder-box {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 空状态样式 */
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

/* 微调背景色，让它更暖一点点，不那么死灰 */
.content-canvas {
    background-color: #f2f4f7;
    /* 稍微调整了灰度 */
    /* ... */
}

/* 这里的 tabs 样式建议也加圆角 */
:deep(.modern-card-tabs .el-tabs__item.is-active) {
    color: #409eff;
    font-weight: 600;
    /* 可以加个底部的光标动画，如果想更高级的话 */
}
</style>