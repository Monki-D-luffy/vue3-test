<template>
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar-container">
        <div class="sidebar-logo" @click="$emit('toggle-collapse')">
            <span v-if="isCollapsed">🛰️</span>
            <span v-if="!isCollapsed">IoT 平台</span>
        </div>

        <el-menu :default-active="$route.path" class="el-menu-vertical" :collapse="isCollapsed"
            :collapse-transition="false" router>
            <template v-for="item in menuItems" :key="item.index">

                <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.index"
                    popper-class="sidebar-popper">
                    <template #title>
                        <el-icon>
                            <component :is="item.icon" />
                        </el-icon>
                        <span>{{ item.title }}</span>
                    </template>

                    <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
                        {{ child.title }}
                    </el-menu-item>
                </el-sub-menu>

                <el-menu-item v-else :index="item.index">
                    <el-icon>
                        <component :is="item.icon" />
                    </el-icon>
                    <template #title>
                        <span>{{ item.title }}</span>
                    </template>
                </el-menu-item>
            </template>
        </el-menu>
    </el-aside>
</template>

<script setup>
import { ref, markRaw, defineProps, defineEmits } from 'vue' // 引入 defineProps/defineEmits
import { useRoute } from 'vue-router'
import {
    HomeFilled,
    Collection,
    Box,
    Setting,
    MagicStick
} from '@element-plus/icons-vue'

// 3. 声明接收来自 AppLayout 的 prop
defineProps({
    isCollapsed: {
        type: Boolean,
        default: false
    }
})

// 4. 声明会发出的事件
defineEmits(['toggle-collapse'])

// 5. 内部状态（只保留菜单需要的）
const route = useRoute()

// 6. 菜单数据 (从 AppLayout 剪切过来)
const menuItems = ref([
    {
        index: '/overview',
        title: '概览',
        icon: markRaw(HomeFilled),
        children: [
            { index: '/overview', title: '概览' }
        ]
    },
    {
        index: '/devices',
        title: '设备管理',
        icon: markRaw(Collection),
        children: [
            { index: '/devices', title: '设备列表' },
            { index: '/devices/log', title: '设备日志' }
        ]
    },

    {
        index: '/products',
        title: '产品管理',
        icon: markRaw(Box),
        children: [
            { index: '/products', title: '产品列表' },
            { index: '/firmware', title: '固件管理' },
        ]
    },
    {
        index: '/system',
        title: '系统管理',
        icon: markRaw(Setting),
        children: [
            { index: '/system', title: '系统设置' }
        ]
    },
    {
        index: '/experiment',
        title: '实验功能',
        icon: markRaw(MagicStick),
        children: [
            { index: '/serial', title: '串口终端' }
        ]
    }
])
</script>

<style scoped>
/* 所有的侧边栏样式全部剪切到这里 */
/* --- 侧边栏 --- */
.sidebar-container {
    background-color: var(--app-bg-card);
    color: #303133;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border-right: none;
    overflow-x: hidden;
    overflow-y: auto;
}

.sidebar-logo {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--app-text-main);
    border-bottom: 1px solid var(--app-border-color);
}

/* --- el-menu 核心样式 --- */
.el-menu-vertical {
    border-right: none;
    background-color: transparent;
    padding-top: 8px;
    /* 让 Element 菜单透明，透出 sidebar 背景 */
    --el-menu-bg-color: transparent;
}

.sidebar-container :deep(.el-sub-menu__title) {
    color: var(--app-text-sub) !important;
    background-color: transparent !important;
    height: 60px;
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
    padding-left: 24px !important;
    border-radius: 10px;
    margin: 8px 10px;
    width: calc(100% - 20px) !important;
}

.sidebar-container :deep(.el-icon) {
    font-size: 24px;
    margin-right: 14px;
    width: 24px;
}

.sidebar-container :deep(.el-sub-menu__icon-arrow) {
    font-size: 18px;
    margin-left: 5px;
}

.sidebar-container :deep(.el-sub-menu__title:not(.is-active):hover) {
    background-color: #eef0f3 !important;
    color: #303133 !important;
}

.sidebar-container :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #ff6a00 !important;
    font-weight: 600;
}

.sidebar-container :deep(.el-sub-menu.is-active > .el-sub-menu__title .el-icon) {
    color: #ff6a00 !important;
}

.sidebar-container :deep(.el-menu--collapse) {
    .el-sub-menu__title {
        padding: 0 !important;
        justify-content: center;
    }

    .el-icon {
        margin-right: 0;
        font-size: 26px;
    }

    .el-sub-menu__icon-arrow,
    span {
        display: none;
    }
}


/* --- 浮动子菜单 (在收起时) --- */
:global(.sidebar-popper .el-menu--popup),
:global(.el-popper.is-light) {
    background-color: #ffffff !important;
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1) !important;
    padding: 6px !important;
    border: none !important;
    outline: none !important;
}

:global(.sidebar-popper .el-menu--popup:hover),
:global(.sidebar-popper .el-menu--popup:focus),
:global(.sidebar-popper .el-menu--popup:focus-visible) {
    outline: none !important;
    border: none !important;
}

:global(.sidebar-popper .el-menu--popup .el-menu),
:global(.sidebar-popper .el-menu--popup .el-scrollbar__wrap),
:global(.sidebar-popper .el-popper .el-scrollbar__wrap) {
    background-color: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
}

:global(.sidebar-popper .el-popper__arrow) {
    display: none !important;
}

:global(.sidebar-popper .el-menu--popup .el-menu-item) {
    background-color: transparent !important;
    color: #606266 !important;
    border-radius: 8px;
    margin: 4px 0;
    height: 40px;
    line-height: 40px;
    border: none !important;
}

:global(.sidebar-popper .el-menu--popup .el-menu-item:not(.is-active):hover) {
    background-color: #5de6f52b !important;
}

:global(.sidebar-popper .el-menu--popup .el-menu-item.is-active) {
    background-color: var(--el-color-primary-light-9) !important;
    color: #ff6a00 !important;
    font-weight: 600;
}
</style>

<style>
/* 全局滚动条样式也剪切过来 */
.sidebar-container::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
}

.sidebar-container::-webkit-scrollbar {
    width: 5px;
}

.sidebar-container::-webkit-scrollbar-thumb {
    background: var(--app-border-color);
    border-radius: 10px;
    border: 1px solid var(--app-bg-card);
}

.sidebar-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>