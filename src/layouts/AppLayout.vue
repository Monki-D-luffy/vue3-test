<template>
    <div class="common-layout">
        <el-container>
            <AppSidebar :is-collapsed="isCollapsed" @toggle-collapse="toggleCollapse" />

            <el-container>
                <el-header style="padding: 0; height: 60px;">
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

// AppLayout 只保留它需要管理的核心状态
const isCollapsed = ref(true)

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
    /* 60px 是 AppHeader.vue 里的 .el-header 默认高度 */
    height: calc(100vh - 60px);
    overflow-y: auto;
    padding: 20px;
}
</style>
