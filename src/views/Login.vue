<template>
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <h2>物联网平台</h2>
                <p>IoT Device Management System</p>
            </div>

            <el-card class="login-card" shadow="always">
                <el-form ref="loginFormRef" :model="loginForm" :rules="rules" size="large">
                    <el-form-item prop="email">
                        <el-input v-model="loginForm.email" placeholder="请输入邮箱账号" :prefix-icon="User" />
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password
                            :prefix-icon="Lock" @keyup.enter="handleLogin" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">
                            {{ loading ? '登 录 中...' : '立即登录' }}
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>

            <div class="login-footer">
                <p>© 2025 IoT Platform. All rights reserved.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
// 需要引入图标
import { User, Lock } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
    email: '1067360038@qq.com',
    password: '123456'
})

// 简单的表单验证规则
const rules = {
    email: [
        { required: true, message: '请输入邮箱', TXr: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码不能少于6位', trigger: 'blur' }
    ]
}

const handleLogin = async () => {
    if (!loginFormRef.value) return

    await loginFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                // 模拟一个延迟，让 loading 效果展示出来，更有交互感
                // await new Promise(resolve =>QXsetTimeout(resolve, 500)) 

                const success = await authStore.login(loginForm.email, loginForm.password)
                if (success) {
                    router.push('/overview')
                }
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    /* 使用深色渐变背景提升科技感 */
    background: linear-gradient(135deg, #2d3a4b 0%, #1c232d 100%);
    background-size: cover;
}

.login-box {
    width: 100%;
    max-width: 420px;
    padding: 20px;
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
    color: #fff;
}

.login-header h2 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 10px;
    letter-spacing: 2px;
}

.login-header p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.login-card {
    border: none;
    border-radius: 12px;
    /* 给卡片加一点透明度和模糊效果 */
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
    padding: 20px 10px;
}

.login-button {
    width: 100%;
    font-size: 16px;
    padding: 20px 0;
    letter-spacing: 4px;
    font-weight: bold;
    transition: all 0.3s;
}

.login-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.login-footer {
    text-align: center;
    margin-top: 40px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 480px) {
    .login-box {
        width: 90%;
    }
}
</style>