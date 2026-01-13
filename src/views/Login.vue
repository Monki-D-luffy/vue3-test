<template>
    <div class="login-container">
        <div class="background-mesh"></div>

        <div class="auth-card glass-effect hover-lift">

            <div class="card-header">
                <div class="logo-wrapper">
                    <img src="@/assets/logo.svg" alt="Logo" class="logo-icon" />
                </div>
                <h1 class="app-title">IoT Manager</h1>
                <p class="app-subtitle">新一代物联网设备管理平台</p>
            </div>

            <Transition name="fade-slide" mode="out-in">

                <div v-if="isLoginMode" key="login" class="form-section">
                    <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="auth-form"
                        @keyup.enter="handleLogin">
                        <el-form-item prop="account">
                            <el-input v-model="loginForm.account" placeholder="请输入邮箱或账号" :prefix-icon="User"
                                size="large" class="modern-input" />
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码"
                                :prefix-icon="Lock" show-password size="large" class="modern-input" />
                        </el-form-item>

                        <div class="form-options">
                            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                            <el-link type="primary" class="no-underline">忘记密码?</el-link>
                        </div>

                        <el-button type="primary" size="large" class="submit-btn" :loading="loading"
                            @click="handleLogin">
                            登 录
                        </el-button>
                    </el-form>

                    <div class="switch-mode">
                        还没有账号？
                        <el-link type="primary" @click="toggleMode" class="no-underline">立即注册</el-link>
                    </div>
                </div>

                <div v-else key="register" class="form-section">
                    <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="auth-form"
                        @keyup.enter="handleRegister">
                        <el-form-item prop="email">
                            <el-input v-model="registerForm.email" placeholder="电子邮箱 (作为登录账号)" :prefix-icon="Message"
                                size="large" class="modern-input" />
                        </el-form-item>
                        <el-form-item prop="nickname">
                            <el-input v-model="registerForm.nickname" placeholder="您的昵称" :prefix-icon="User"
                                size="large" class="modern-input" />
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input v-model="registerForm.password" type="password" placeholder="设置密码 (至少6位)"
                                :prefix-icon="Lock" show-password size="large" class="modern-input" />
                        </el-form-item>
                        <el-form-item prop="confirmPassword">
                            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码"
                                :prefix-icon="Check" show-password size="large" class="modern-input" />
                        </el-form-item>

                        <el-button type="primary" size="large" class="submit-btn" :loading="loading"
                            @click="handleRegister">
                            注 册
                        </el-button>
                    </el-form>

                    <div class="switch-mode">
                        已有账号？
                        <el-link type="primary" @click="toggleMode" class="no-underline">返回登录</el-link>
                    </div>
                </div>

            </Transition>
        </div>
        <DebugMockSwitch />
        <div class="footer-copyright">
            © 2025 IoT Manager. All Rights Reserved.
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { User, Lock, Message, Check } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import DebugMockSwitch from '@/components/DebugMockSwitch.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoginMode = ref(true)
const loading = ref(false)
const rememberMe = ref(false)

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

// ✨ 已添加默认值，方便开发
const loginForm = reactive({
    account: 'admin',
    password: '123456'
})

const registerForm = reactive({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: ''
})

const loginRules = reactive<FormRules>({
    account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const validatePass2 = (rule: any, value: any, callback: any) => {
    if (value !== registerForm.password) {
        callback(new Error('两次输入密码不一致!'))
    } else {
        callback()
    }
}

const registerRules = reactive<FormRules>({
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validatePass2, trigger: 'blur' }
    ]
})

const toggleMode = () => {
    isLoginMode.value = !isLoginMode.value
    // 重置表单
    if (isLoginMode.value) {
        // 切回登录
        setTimeout(() => registerFormRef.value?.resetFields(), 300)
    } else {
        // 切到注册
        setTimeout(() => loginFormRef.value?.resetFields(), 300)
    }
}

const handleLogin = async () => {
    if (!loginFormRef.value) return

    await loginFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            // Store 内部已经处理了 try-catch 和 ElMessage
            const success = await authStore.login(loginForm.account, loginForm.password)
            loading.value = false

            if (success) {
                router.push('/')
            }
        }
    })
}

const handleRegister = async () => {
    if (!registerFormRef.value) return

    await registerFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            const success = await authStore.register({
                email: registerForm.email,
                password: registerForm.password,
                nickname: registerForm.nickname
            })
            loading.value = false

            if (success) {
                router.push('/')
            }
        }
    })
}
</script>

<style scoped>
/* 布局容器 */
.login-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: var(--app-bg-canvas);
}

/* 动态背景 */
.background-mesh {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 50% 50%,
            rgba(79, 70, 229, 0.15),
            rgba(59, 130, 246, 0.1),
            rgba(245, 247, 250, 0) 50%);
    animation: mesh-move 20s infinite linear;
    z-index: 0;
}

@keyframes mesh-move {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 玻璃拟态卡片 */
.auth-card {
    position: relative;
    z-index: 1;
    width: 420px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 24px;
    box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

:global(.dark) .auth-card {
    background: rgba(30, 41, 59, 0.7);
    /* Slate-800 semi-transparent */
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-header {
    text-align: center;
    margin-bottom: 32px;
}

.logo-wrapper {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: var(--color-primary-light);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-sm);
}

.logo-icon {
    width: 32px;
    height: 32px;
}

.app-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--app-text-main);
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.app-subtitle {
    font-size: 14px;
    color: var(--app-text-sub);
}

.modern-input :deep(.el-input__wrapper) {
    box-shadow: none;
    background-color: var(--el-fill-color);
    border-radius: var(--radius-md);
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

.modern-input :deep(.el-input__wrapper:hover),
.modern-input :deep(.el-input__wrapper.is-focus) {
    background-color: --app-bg-card;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

/* 去除链接下划线的类 */
.no-underline :deep(.el-link__inner) {
    text-decoration: none !important;
}

.no-underline:hover :deep(.el-link__inner) {
    text-decoration: none !important;
}

.submit-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, var(--el-color-primary) 0%, #6366f1 100%);
    border: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
}

.submit-btn:active {
    transform: translateY(0);
}

.switch-mode {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: var(--app-text-sub);
}

.footer-copyright {
    position: absolute;
    bottom: 24px;
    font-size: 12px;
    color: var(--app-text-placeholder);
    z-index: 1;
}

@media (max-width: 480px) {
    .auth-card {
        width: 90%;
        padding: 24px;
    }
}
</style>