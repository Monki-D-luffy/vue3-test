<template>
    <div class="common-layout">
        <el-container>
            <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar-container">
                <div class="sidebar-logo" @click="toggleCollapse">
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
            <el-container>
                <AppHeader />
                <el-main>
                    <RouterView />
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<script setup>
import { ref, markRaw } from 'vue' // 引入 markRaw (修复警告用)
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus';
import AppHeader from '@/components/AppHeader.vue'
import {
    Fold,   // 恢复
    Expand, // 恢复
    HomeFilled,
    Collection,
    Box,
    Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 3. 恢复：默认不折叠
const isCollapsed = ref(true)

// 4. ▼▼▼ 核心修改：菜单数据和路由同步 ▼▼▼
const menuItems = ref([
    {
        // "概览" 是一个没有子集的 "el-menu-item"
        index: '/overview', // 父菜单的 index 仍然指向默认子页面
        title: '概览',
        icon: markRaw(HomeFilled),
        children: [
            // 2. ✨ 把“概览”自己作为唯一的子项
            { index: '/overview', title: '概览' }
        ]
    },
    {
        // "设备管理" 是一个 "el-sub-menu"
        // 关键：它的 index 和它的第一个子项 index 相同！
        // 这样 el-menu 的 router 模式在点击父菜单时
        // 就会自动跳转到 /devices
        index: '/devices', // 路由路径
        title: '设备管理',
        icon: markRaw(Collection),
        children: [
            { index: '/devices', title: '设备列表' },
            // (我们为未来预留一个 "设备分组" 页面)
            // { index: '/devices/groups', title: '设备分组' } 
        ]
    },
    {
        index: '/products',
        title: '产品管理',
        icon: markRaw(Box),
        children: [
            { index: '/products', title: '产品列表' }
        ]
    },
    {
        index: '/system',
        title: '系统管理',
        icon: markRaw(Setting),
        children: [
            { index: '/system', title: '系统设置' }
        ]
    }
])
// ▲▲▲ 修改结束 ▲▲▲

// 5. 恢复：伸缩功能
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
}

</script>

<style scoped>
/* --- 整体布局 --- */
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

/* --- 侧边栏 --- */
.sidebar-container {
    background-color: #f7f8fa;
    /* 非常浅的背景 */
    color: #303133;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border-right: none;
    overflow-x: hidden;
    overflow-y: auto;
    /* ✨ 修复点：添加这一行来启用垂直滚动条 */
}

.sidebar-logo {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #303133;
    border-bottom: 1px solid #f0f0f0;
}

/* --- el-menu 核心样式 (现代感关键) --- */
.el-menu-vertical {
    border-right: none;
    background-color: transparent;
    padding-top: 8px;
    /* 菜单顶部留出空隙 */
}

/* 现在只针对 el-sub-menu__title 设置样式 */
/* 我们在前面加了 .sidebar-container，这样它就只会影响侧边栏内部了 */
.sidebar-container :deep(.el-sub-menu__title) {
    color: #606266 !important;
    background-color: transparent !important;

    /* 增大字体和高度 */
    height: 60px;
    /* 进一步增大高度 */
    line-height: 60px;
    font-size: 16px;
    /* 进一步增大字体 */
    font-weight: 500;

    padding-left: 24px !important;
    border-radius: 10px;

    /* 增大垂直间距 */
    margin: 8px 10px;
    width: calc(100% - 20px) !important;
}

/* 增大展开时图标尺寸 */
.sidebar-container :deep(.el-icon) {
    font-size: 24px;
    /* 从 20px 增大到 24px */
    margin-right: 14px;
    /* 调整图标和文字的间距 */
    width: 24px;
    /* 确保图标占位 */
}

/* 统一处理悬浮状态 (非激活时) */
.sidebar-container :deep(.el-sub-menu__title:not(.is-active):hover) {
    background-color: #eef0f3 !important;
    color: #303133 !important;
}

/* 当子菜单被激活时，父菜单标题也高亮 */
.sidebar-container :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: #ff6a00 !important;
    font-weight: 600;
}

.sidebar-container :deep(.el-sub-menu.is-active > .el-sub-menu__title .el-icon) {
    color: #ff6a00 !important;
}

/*
 * 处理折叠后的样式
 */
.sidebar-container :deep(.el-menu--collapse) {

    /* 折叠时，让所有标题都居中 */
    .el-sub-menu__title {
        padding: 0 !important;
        justify-content: center;
    }

    /* 折叠时，图标没有右边距 */
    .el-icon {
        margin-right: 0;
        /* 增大折叠时图标尺寸 */
        font-size: 26px;
        /* 从 22px 增大到 26px */
    }

    /* 隐藏文字和子菜单的箭头 */
    .el-sub-menu__icon-arrow,
    span {
        display: none;
    }
}



/* --- 浮动子菜单 (在收起时) --- */
/* --- 第1层：“真·外壳” (The REAL Container) --- */
/* 我们选定最外层的容器作为唯一的外壳，赋予它白底、圆角和阴影 */
:global(.sidebar-popper .el-menu--popup),
:global(.el-popper.is-light) {
    /* .el-popper.is-light 不能加.sidebar-popper 否则会出现黑色聚焦轮廓 */
    background-color: #ffffff !important;
    /* 确立白色背景 */
    border: none !important;
    /* 去掉默认黑边 */
    border-radius: 12px !important;
    /* 确立大圆角 */
    /* 用一个柔和的阴影来代替边框，更显高级 */
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1) !important;

    /* 关键：给外壳加一点内边距，让里面的内容不会贴边 */
    padding: 6px !important;

    /* 核心修复：同时去掉 border 和 outline */
    border: none !important;
    outline: none !important;
    /* 去掉浏览器默认的黑色聚焦轮廓  */
}

/* 额外保险：确保鼠标放上去或者聚焦时也不会出现 */
:global(.sidebar-popper .el-menu--popup:hover),
:global(.sidebar-popper .el-menu--popup:focus),
:global(.sidebar-popper .el-menu--popup:focus-visible) {
    outline: none !important;
    border: none !important;
}

/* --- 中间层：“隐身术” (Make Middle Layers Invisible) --- */
/* 这就是你提到的“设置成相同颜色”策略的极致——直接透明 */
/* 我们把中间可能出现边框、背景色的元素全部找出来，强制透明 */
:global(.sidebar-popper .el-menu--popup .el-menu),
:global(.sidebar-popper .el-menu--popup .el-scrollbar__wrap),
:global(.sidebar-popper .el-popper .el-scrollbar__wrap) {
    background-color: transparent !important;
    /* 背景透明，透出最外层的白色 */
    border: none !important;
    /* 去掉任何可能的边框 */
    padding: 0 !important;
    /* 去掉内边距，避免空间浪费 */
    margin: 0 !important;
    /* 去掉外边距 */
    box-shadow: none !important;
    /* 去掉阴影 */
    border-radius: 0 !important;
}

/* 顺手把那个碍事的小箭头隐藏掉 */
:global(.sidebar-popper .el-popper__arrow) {
    display: none !important;
}

/* --- 第2层：“真·内容” (The REAL Content) --- */
/* 具体的菜单项，它们是真正需要用户交互的地方 */
:global(.sidebar-popper .el-menu--popup .el-menu-item) {
    /* 平时是透明的，看起来就和外壳融为一体了 */
    background-color: transparent !important;
    color: #606266 !important;

    /* 给每个选项也加个小圆角，呼应外壳 */
    border-radius: 8px;
    /* 选项之间留点空隙，更有呼吸感 */
    margin: 4px 0;
    height: 40px;
    line-height: 40px;
    border: none !important;
}

/* 鼠标放上去时的颜色 (浅灰) */
:global(.sidebar-popper .el-menu--popup .el-menu-item:not(.is-active):hover) {
    background-color: #5de6f52b !important;
}

/* 选中时的颜色 (你的主题橙) */
:global(.sidebar-popper .el-menu--popup .el-menu-item.is-active) {
    background-color: #fff7f0 !important;
    color: #ff6a00 !important;
    font-weight: 600;
}
</style>
<style>
/* --- 侧边栏滚动条美化 (全局但限定范围) --- */

/*
  ✨ 修复点：
  删除了 .sidebar-top-content
  现在样式直接作用于 .sidebar-container 自身
*/

/* 1. 滚动条轨道 (背景) */
.sidebar-container::-webkit-scrollbar-track {
    background: transparent;
    /* 轨道背景透明 */
    border-radius: 10px;
}

/* 2. 滚动条整体宽度 (变细) */
.sidebar-container::-webkit-scrollbar {
    width: 5px;
}

/* 3. 滚动条滑块 (thumb) */
.sidebar-container::-webkit-scrollbar-thumb {
    background: #dcdcdc;
    /* 滑块颜色变浅 */
    border-radius: 10px;
    /* 圆角拉满 */
    /* 关键：添加一个和侧边栏背景同色的边框，产生 "悬浮" 效果 */
    border: 1px solid #f7f8fa;
}

/* 4. 鼠标悬浮在滑块上 */
.sidebar-container::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
    /* 悬浮时颜色加深 */
}
</style>