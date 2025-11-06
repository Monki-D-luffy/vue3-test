<template>
    <div class="common-layout">
        <el-container>
            <el-aside width="220px">
                <div class="sidebar-content">
                    <h3 class="sidebar-title">IoT 平台</h3>
                    <div class="menu-placeholder">
                        <el-button type="primary" link @click="goToDashboard">
                            &lt; 返回设备列表
                        </el-button>
                    </div>
                </div>
            </el-aside>

            <el-container>
                <el-header>
                    <div class="header-content">
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
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus';

const router = useRouter()
const authStore = useAuthStore()

const goToDashboard = () => {
    router.push('/dashboard')
}

const logout = () => {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已安全退出')
}
</script>

<style scoped>
.common-layout,
.el-container {
    height: 100vh;
    overflow: hidden;
    /* 防止页面滚动条 */
}

.el-header {
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, .08);
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.el-aside {
    background-color: #2d3a4b;
    color: #fff;
    border-right: 1px solid var(--el-border-color-lighter);
}

.sidebar-content {
    padding: 20px;
}

.sidebar-title {
    text-align: center;
    font-size: 20px;
    margin-bottom: 30px;
    letter-spacing: 1px;
}

.menu-placeholder {
    text-align: center;
}

.el-main {
    background-color: #f5f7fa;
    /* 让内容区自己滚动 */
    height: calc(100vh - 60px);
    /* 60px 是 header 的高度 */
    overflow-y: auto;
}
</style>