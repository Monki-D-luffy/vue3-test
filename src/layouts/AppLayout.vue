<template>
    <div class="common-layout">
        <el-container>
            <AppSidebar :is-collapsed="isCollapsed" @toggle-collapse="toggleCollapse" />

            <el-container>
                <el-header class="app-header">
                    <AppHeader :is-collapsed="isCollapsed" @toggle-collapse="toggleCollapse" />
                </el-header>

                <el-main>
                    <RouterView />
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'

const isCollapsed = ref(false)

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.common-layout,
.el-container {
    height: 100vh;
    overflow: hidden;
}

.el-main {
    background-color: #f5f7fa;
    /* 60px 是 header 高度 */
    height: calc(100vh - 60px);
    /* 🔥🔥 核心修复：从 hidden 改为 auto 🔥🔥 */
    /* 允许主内容区域出现纵向滚动条 */
    overflow-y: auto;
    /* 防止横向意外溢出 */
    overflow-x: hidden;
    /* 核心修复：移除内边距，由子页面自己控制 */
    padding: 0;
}

.app-header {
    height: 60px !important;
    padding: 0 20px 0px 0px;
    background-color: #fff;
}
</style>