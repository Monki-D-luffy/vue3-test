<template>
    <div class="resizable-layout">
        <div class="layout-left" :style="{ width: sidebarWidth + 'px' }">
            <slot name="sidebar"></slot>
        </div>

        <div class="layout-resizer" :class="{ active: isResizing }" @mousedown="startResize">
        </div>

        <div class="layout-right">
            <slot name="content"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// 定义 Props，允许外部自定义宽度限制
const props = defineProps({
    initialWidth: { type: Number, default: 180 },
    minWidth: { type: Number, default: 180 },
    maxWidth: { type: Number, default: 600 }
})

const sidebarWidth = ref(props.initialWidth)
const isResizing = ref(false)

// 拖拽逻辑
const startResize = (e: MouseEvent) => {
    isResizing.value = true
    const startX = e.clientX
    const startWidth = sidebarWidth.value

    const onMouseMove = (moveEvent: MouseEvent) => {
        const currentX = moveEvent.clientX
        const diff = currentX - startX
        let newWidth = startWidth + diff

        // 限制范围
        if (newWidth < props.minWidth) newWidth = props.minWidth
        if (newWidth > props.maxWidth) newWidth = props.maxWidth

        sidebarWidth.value = newWidth
    }

    const onMouseUp = () => {
        isResizing.value = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
}

// 组件销毁时确保清除事件（防止内存泄漏）
onUnmounted(() => {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
})
</script>

<style scoped>
.resizable-layout {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: #fff;
    /* 可选：加上圆角和阴影，或者由外部容器控制 */
    /* border-radius: 8px; */
    /* box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); */
}

.layout-left {
    flex-shrink: 0;
    height: 100%;
    overflow: hidden;
    /* 防止内容溢出撑开 */
}

.layout-right {
    flex: 1;
    height: 100%;
    overflow: hidden;
    /* 重要：触发BFC，防止子元素溢出 */
    position: relative;
    min-width: 0;
    /* Flex 布局下的溢出保护 */
}

/* 拖拽条样式 */
.layout-resizer {
    width: 1px;
    background-color: var(--el-border-color-lighter);
    cursor: col-resize;
    position: relative;
    z-index: 10;
    padding: 0 4px;
    margin: 0 -4px;
    background-clip: content-box;
    transition: background-color 0.2s;
    flex-shrink: 0;
}

.layout-resizer:hover,
.layout-resizer.active {
    background-color: var(--el-color-primary);
    width: 2px;
}
</style>