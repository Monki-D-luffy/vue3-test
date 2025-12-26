<template>
    <div class="common-layout">
        <el-container>
            <AppSidebar :is-collapsed="isCollapsed" @toggle-collapse="toggleCollapse" />

            <el-container class="content-container">
                <el-header class="app-header">
                    <AppHeader :is-collapsed="isCollapsed" @toggle-collapse="toggleCollapse" />
                </el-header>

                <el-main class="app-main">
                    <RouterView v-slot="{ Component }">
                        <transition name="fade-slide" mode="out-in">
                            <component :is="Component" />
                        </transition>
                    </RouterView>
                </el-main>
                <ExpAiFloatingButton />
            </el-container>
        </el-container>

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import ExpAiFloatingButton from '@/components/ExpAiFloatingButton.vue'

const isCollapsed = ref(false)

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
/* 确保整个应用撑满屏幕，无多余滚动条 */
.common-layout {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: var(--app-bg-canvas);
    /* ✅ 使用变量 */
}

.el-container {
    height: 100%;
}

/* 头部样式：玻璃拟态或纯白卡片 */
.app-header {
    height: 60px;
    padding: 0;
    background-color: var(--app-bg-card);
    /* ✅ 使用变量 */
    border-bottom: 1px solid var(--border-color-light, #e2e8f0);
    /* 兼容性写法 */
    /* display: flex; */
    /* margin-left: auto; */
    align-items: center;
    z-index: 10;
    /* 确保头部阴影在内容之上 */
    box-shadow: var(--app-shadow-sm);

}

/* 主内容区域：独立滚动 */
.app-main {
    height: calc(100vh - 60px);
    background-color: var(--app-bg-canvas);
    /* ✅ 使用变量：浅灰背景 */
    padding: 24px;
    /* ✅ 统一内边距，子页面无需自己写 margin */
    overflow-y: auto;
    /* 纵向滚动 */
    overflow-x: hidden;
    position: relative;
    box-sizing: border-box;
}

/* 滚动条美化 (Webkit) */
.app-main::-webkit-scrollbar {
    width: 6px;
}

.app-main::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.app-main::-webkit-scrollbar-track {
    background: transparent;
}
</style>