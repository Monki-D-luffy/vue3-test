<template>
    <div class="common-layout">
        <el-container>
            <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar-container">
                <div class="sidebar-logo">
                    <span v-if="!isCollapsed">IoT 平台</span>
                </div>

                <el-menu :default-active="$route.path" class="el-menu-vertical" :collapse="isCollapsed"
                    :collapse-transition="false" router>
                    <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
                        <el-icon>
                            <component :is="item.icon" />
                        </el-icon>
                        <template #title>
                            <span>{{ item.title }}</span>
                        </template>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <el-container>
                <el-header>
                    <el-icon class="collapse-icon" @click="toggleCollapse">
                        <Fold v-if="!isCollapsed" />
                        <Expand v-else />
                    </el-icon>

                    <div class="header-right">
                        <span>欢迎您, Admin</span>
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
import { ref } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus';
// 1. 导入我们需要的图标
import {
    Fold,
    Expand,
    HomeFilled,
    Collection,
    Box,
    Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 2. 控制侧边栏伸缩的状态
const isCollapsed = ref(false)

// 3. 菜单项数据 (这就是“功能区”)
const menuItems = ref([
    { index: '/dashboard/overview', title: '概览', icon: HomeFilled },
    { index: '/dashboard/devices', title: '设备管理', icon: Collection },
    { index: '/dashboard/products', title: '产品管理', icon: Box },
    { index: '/dashboard/system', title: '系统管理', icon: Setting },
])

// 4. 伸缩/展开
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
    padding: 20px;
    /* 我们给 main 区加一个内边距 */
}

/* --- 侧边栏 --- */
.sidebar-container {
    background-color: #2d3a4b;
    /* 涂鸦风格的深色 */
    color: #fff;
    transition: width 0.3s ease;
    /* 伸缩动画 */
    border-right: none;
    overflow-x: hidden;
    /* 防止收起时文字溢出 */
}

.sidebar-logo {
    height: 60px;
    /* 和 header 一样高 */
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 1px;
}

/* el-menu 样式 */
.el-menu-vertical {
    border-right: none;
    /* 去掉 menu 的白边框 */
}

/* 覆盖 el-menu 的默认样式，
  使其适应我们的深色主题
*/
.el-menu {
    background-color: transparent;
}

.el-menu-item {
    color: #bfcbd9;
}

.el-menu-item:hover {
    background-color: #001f3f;
    /* 悬停颜色 */
}

.el-menu-item.is-active {
    color: #409EFF;
    /* 选中颜色 (Element Plus 蓝) */
    background-color: #001f3f;
}

/* 解决收起时图标不居中的问题 */
.el-menu--collapse .el-menu-item .el-icon {
    height: 56px;
    width: 100%;
    justify-content: center;
}

/* --- 顶栏 --- */
.el-header {
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, .08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* 左右分布 */
}

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
</style>