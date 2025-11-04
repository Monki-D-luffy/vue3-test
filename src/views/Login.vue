<template>
    <div class="login-container">
        <el-card class="login-card">
            <template #header>
                <div class="card-header">
                    <span>物联网平台登录</span>
                </div>
            </template>

            <el-form @submit.prevent="handleLogin">
                <el-form-item label="邮箱">
                    <el-input v-model="email" placeholder="请输入邮箱" clearable />
                </el-form-item>
                <el-form-item label="密码">
                    <el-input v-model="password" type="password" placeholder="请输入密码" show-password />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleLogin" class="login-button">
                        登 录
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore' // 1. 导入我们刚创建的 store

// 2. 获取 store 实例
const authStore = useAuthStore()

// 3. 创建 ref 来绑定表单的 v-model
const email = ref('1067360038@qq.com') // 默认填入您的测试账号
const password = ref('123456') // 默认填入一个假密码

// 4. 定义登录按钮的点击事件
const handleLogin = () => {
    // 5. 调用 store 中的 login 动作
    authStore.login(email.value, password.value)
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f7fa;
}

.login-card {
    width: 400px;
}

.card-header {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
}

.login-button {
    width: 100%;
}
</style>