<template>
    <el-header>
        <el-icon class="collapse-icon" @click="$emit('toggle-collapse')">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
        </el-icon>

        <div class="header-right">
            <el-icon class="header-icon">
                <Bell />
            </el-icon>
            <el-icon class="header-icon">
                <Grid />
            </el-icon>
            <el-button circle :icon="isDark ? Sunny : Moon" @click="toggleTheme" class="theme-btn" plain />

            <el-divider direction="vertical" />

            <el-dropdown trigger="hover" @command="handleCommand" popper-class="user-dropdown-popper">
                <span class="user-profile">
                    <el-avatar :icon="User" :size="32" />
                    <span class="username">{{ userDisplayName }}</span>
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>

                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item class="user-info-header" disabled>
                            <div class="user-info-details">
                                <strong>{{ userDisplayName }}</strong>
                                <small>{{ userEmail }}</small>
                            </div>
                        </el-dropdown-item>

                        <el-dropdown-item command="profile" divided>
                            <el-icon>
                                <User />
                            </el-icon>
                            个人中心
                        </el-dropdown-item>
                        <el-dropdown-item command="settings">
                            <el-icon>
                                <Setting />
                            </el-icon>
                            账户设置
                        </el-dropdown-item>
                        <el-dropdown-item command="logout" divided>
                            <el-icon>
                                <SwitchButton />
                            </el-icon>
                            退出登录
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </el-header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus';
import { useTheme } from '@/composables/useTheme'
import {
    Fold,
    Expand,
    ShoppingCart,
    Bell,
    Grid,
    ArrowDown,
    User,
    Setting,
    SwitchButton,
    Moon,
    Sunny
} from '@element-plus/icons-vue'


// 1. 定义从父组件 AppLayout 接收的 props
defineProps({
    isCollapsed: {
        type: Boolean,
        default: false
    }
})

// 2. 定义要 $emit 给父组件的事件
defineEmits(['toggle-collapse'])

// 3. 内部逻辑 (和之前一样，完全自洽)
const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const userDisplayName = computed(() => authStore.userInfo?.nickname || '用户')
const userEmail = computed(() => authStore.userInfo?.email || '...')

const logout = () => {
    authStore.logout()
    router.push('/login')
    ElMessage.success('已安全退出')
}

const handleCommand = (command) => {
    if (command === 'logout') {
        logout()
    } else if (command === 'profile') {
        ElMessage.info('跳转到个人中心 (功能待开发)')
    } else if (command === 'settings') {
        ElMessage.info('跳转到账户设置 (功能待开发)')
    }
}
</script>

<style scoped>
/* --- 顶栏 (Header) --- */

.el-header {
    height: 60px;
    /* ✨ 背景色改为变量，适配黑夜模式 */
    background-color: var(--bg-card);
    border-bottom: 1px solid var(--border-color-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    /* 增加过渡效果 */
    transition: background-color 0.3s, border-color 0.3s;
}

.collapse-icon {
    font-size: 22px;
    cursor: pointer;
    color: #303133;
}

.header-right {
    display: flex;
    align-items: center;

    gap: 18px;
    /* 使用 gap 制造间距 */
}

.header-icon {
    font-size: 20px;
    color: #606266;
    cursor: pointer;
    transition: color 0.2s;
}

.header-icon:hover {
    color: #ff6a00;
    /* 你的主题色 */
}

.el-divider--vertical {
    height: 24px;
    margin: 0 5px;
    /* 调整分割线左右边距 */
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 头像和名字的间距 */
    cursor: pointer;
    outline: none;
    /* 移除 el-dropdown 带来的蓝色焦点框 */
}

.username {
    font-size: 15px;
    color: #303133;
}

/* --- 用户下拉菜单 (Popper) 样式 --- */
:global(.user-dropdown-popper) {
    border-radius: 8px !important;
    border: none !important;
    box-shadow: var(--el-box-shadow-light) !important;
}

:global(.user-dropdown-popper .el-dropdown-menu__item) {
    height: 40px;
    line-height: 40px;
    font-size: 14px;
}

:global(.user-dropdown-popper .user-info-header) {
    cursor: default !important;
    color: #303133 !important;
}

:global(.user-dropdown-popper .user-info-header:hover) {
    background-color: #fff !important;
}

:global(.user-dropdown-popper .user-info-details) {
    display: flex;
    flex-direction: column;
    line-height: 1.4;
    padding: 5px 0;
}

:global(.user-dropdown-popper .user-info-details small) {
    font-size: 12px;
    color: #909399;
}

:global(.user-dropdown-popper .el-dropdown-menu__item .el-icon) {
    font-size: 16px;
    margin-right: 8px;
}
</style>