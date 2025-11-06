<template>
    <div class="common-layout">
        <el-container>
            <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar-container">
                <div class="sidebar-logo">
                    <span v-if="isCollapsed">🛰️</span>
                    <span v-if="!isCollapsed">IoT 平台</span>
                </div>

                <el-menu :default-active="$route.path" class="el-menu-vertical" :collapse="isCollapsed"
                    :collapse-transition="false" router>
                    <template v-for="item in menuItems" :key="item.index">

                        <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.index">
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
                <el-header>
                    <el-icon class="collapse-icon" @click="toggleCollapse">
                        <Fold v-if="!isCollapsed" />
                        <Expand v-else />
                    </el-icon>

                    <div class="header-right">
                        <span>(欢迎您, Admin)</span>
                        <el-button type="danger" link @click="logout">退出登录</el-button>
                    </div>
                </el-header>

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
const isCollapsed = ref(false)

// 4. ▼▼▼ 核心修改：菜单数据和路由同步 ▼▼▼
const menuItems = ref([
    {
        // "概览" 是一个没有子集的 "el-menu-item"
        index: '/overview', // 路由路径
        title: '概览',
        icon: markRaw(HomeFilled),
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

const logout = () => {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已安全退出')
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
    height: calc(100vh - 60px);
    overflow-y: auto;
    /* 恢复我们之前删除的 main padding */
    padding: 20px;
}

/* --- 侧边栏 --- */
.sidebar-container {
    background-color: #2d3a4b;
    color: #fff;
    transition: width 0.3s ease;
    /* 恢复动画 */
    border-right: none;
    overflow-x: hidden;
}

.sidebar-logo {
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 1px;
}

/* --- el-menu 样式 --- */
.el-menu-vertical {
    border-right: none;
}

.el-menu {
    background-color: transparent;
}

.el-menu-item {
    color: #bfcbd9;
}

.el-menu-item:hover {
    background-color: #001f3f;
}

.el-menu-item.is-active {
    color: #409EFF;
    background-color: #001f3f;
}

:deep(.el-sub-menu__title) {
    color: #bfcbd9 !important;
}

:deep(.el-sub-menu__title:hover) {
    background-color: #001f3f !important;
}

.el-menu--collapse .el-icon {
    height: 56px;
    width: 100%;
    justify-content: center;
}

/* --- 顶栏 (Header) --- */
.el-header {
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, .08);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* 6. 恢复：伸缩按钮的样式 */
.collapse-icon {
    font-size: 22px;
    cursor: pointer;
    color: #303133;
}

.header-right {
    display: flex;
    align-items: center;
}

.header-right span {
    margin-right: 15px;
}

/* 7. 悬浮子菜单的样式 (在收起时依然有效) */
:global(.el-menu--popup) {
    background-color: #2d3a4b !important;
}

:global(.el-menu--popup .el-menu-item) {
    color: #bfcbd9 !important;
}

:global(.el-menu--popup .el-menu-item:hover) {
    background-color: #001f3f !important;
}

:global(.el-menu--popup .el-menu-item.is-active) {
    color: #409EFF !important;
    background-color: #001f3f !important;
}
</style>