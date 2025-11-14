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
const activeTab = ref('tasks') // 默认切到任务页方便查看效果

const handleProductSelect = (product: Product) => {
    currentProduct.value = product
    activeTab.value = 'tasks'
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

/* 核心修改 1：画布区域 
   - 改为 overflow-y: auto (允许整个右侧滚动)
   - 保持 height: 100% (填满 ResizableLayout 的右侧槽位)
*/
.content-canvas {
    height: 100%;
    overflow-y: auto;
    /* 关键：让它是滚动容器 */
    background-color: #f5f7fa;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* 移除 overflow: hidden */
}

.section-header {
    flex-shrink: 0;
}

/* 核心修改 2：主体区域
   - 移除 flex: 1 和 overflow: hidden
   - 让高度随内容自动撑开 (min-height 可选)
*/
.section-body {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #ebeef5;
    display: flex;
    flex-direction: column;
    min-height: 600px;
    /* 给个最小高度，防止没数据时太扁 */
}

/* Tabs 样式定制 */
:deep(.modern-card-tabs) {
    /* 移除 height: 100% */
    display: flex;
    flex-direction: column;
}

:deep(.modern-card-tabs .el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    border-bottom: 1px solid #f0f2f5;
    background-color: #fff;
    /* 粘性头部可选：如果你希望往下滚时，Tab 栏吸顶，可以加 sticky */
    /* position: sticky; top: 0; z-index: 10; */
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
    /* 移除 flex: 1 和 overflow: hidden，允许内容撑开 */
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