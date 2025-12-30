<template>
    <div class="wizard-layout">

        <header class="wizard-header">
            <div class="header-left">
                <div class="brand-mark">
                    <el-icon class="brand-icon">
                        <Cpu />
                    </el-icon>
                    <span class="brand-text">Product Creation</span>
                </div>
            </div>

            <div class="steps-box">
                <el-steps :active="activeStep" finish-status="success" align-center class="custom-steps">
                    <el-step title="选品类" />
                    <el-step title="定方案" />
                    <el-step title="填信息" />
                    <el-step title="完成" />
                </el-steps>
            </div>

            <div class="header-right">
                <el-tooltip content="放弃并返回列表" placement="bottom">
                    <button class="close-btn" @click="goBack">
                        <span class="btn-text">ESC</span>
                        <el-icon>
                            <Close />
                        </el-icon>
                    </button>
                </el-tooltip>
            </div>
        </header>

        <main class="wizard-main">
            <div class="wizard-content">
                <transition name="fade-slide" mode="out-in">

                    <CategorySelector v-if="activeStep === 0" v-model="form.category" />

                    <ProtocolSelector v-else-if="activeStep === 1" v-model="form.protocol" />

                    <ProductInfoForm v-else-if="activeStep === 2" v-model:name="form.name" v-model:model="form.model"
                        v-model:desc="form.desc" :category="form.category" />

                    <CreationSuccess v-else-if="activeStep === 3" :pid="newPid" @develop="goToDevelop" @back="goBack" />

                </transition>
            </div>
        </main>

        <footer v-if="activeStep < 3" class="wizard-footer">
            <div class="footer-inner">
                <el-button v-if="activeStep > 0" size="large" class="nav-btn prev-btn" @click="prevStep">
                    <el-icon class="mr-1">
                        <ArrowLeft />
                    </el-icon> 上一步
                </el-button>

                <el-button type="primary" size="large" :loading="creating" :disabled="!canProceed" @click="nextStep"
                    class="nav-btn next-btn">
                    {{ activeStep === 2 ? '立即创建' : '下一步' }}
                    <el-icon v-if="activeStep < 2" class="ml-2">
                        <ArrowRight />
                    </el-icon>
                </el-button>
            </div>
        </footer>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
    ArrowLeft, ArrowRight, Close, Cpu
} from '@element-plus/icons-vue';

import CategorySelector from './components/wizard/CategorySelector.vue';
import ProtocolSelector from './components/wizard/ProtocolSelector.vue';
import ProductInfoForm from './components/wizard/ProductInfoForm.vue';
import CreationSuccess from './components/wizard/CreationSuccess.vue';

const router = useRouter();
const activeStep = ref(0);
const creating = ref(false);
const newPid = ref('');

const form = reactive({
    category: '',
    protocol: '',
    name: '',
    model: '',
    desc: ''
});

const canProceed = computed(() => {
    if (activeStep.value === 0) return !!form.category;
    if (activeStep.value === 1) return !!form.protocol;
    if (activeStep.value === 2) return !!form.name;
    return true;
});

const nextStep = () => {
    if (activeStep.value < 2) {
        activeStep.value++;
    } else {
        creating.value = true;
        setTimeout(() => {
            newPid.value = `PID-${Date.now().toString().slice(-6)}`;
            creating.value = false;
            activeStep.value = 3;
        }, 800);
    }
};

const prevStep = () => {
    if (activeStep.value > 0) activeStep.value--;
};

const goBack = () => {
    router.push({ name: 'ProductManagement' });
};

const goToDevelop = () => {
    if (!newPid.value) return;
    router.push({
        name: 'ProductDevelop',
        params: { pid: newPid.value }
    });
};
</script>

<style scoped>
.wizard-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-canvas);
}

.wizard-header {
    height: 72px;
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-base);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    z-index: 20;
}

.header-left {
    width: 200px;
}

.brand-mark {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.brand-icon {
    font-size: 16px;
    color: var(--el-color-primary);
}

.steps-box {
    flex: 1;
    max-width: 600px;
}

.header-right {
    width: 200px;
    display: flex;
    justify-content: flex-end;
}

.close-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border-base);
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.2s;
}

.close-btn:hover {
    background-color: var(--el-color-danger-light-9);
    border-color: var(--el-color-danger-light-7);
    color: var(--el-color-danger);
}

.btn-text {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.6;
}

.wizard-main {
    flex: 1;
    overflow: hidden;
    padding: 32px 16px;
    display: flex;
    justify-content: center;
    mask-image: linear-gradient(to bottom, transparent, black 20px);
}

.wizard-content {
    width: 100%;
    max-width: 1100px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* --- 底部操作栏核心优化 --- */
.wizard-footer {
    height: 96px;
    /* 增加高度，提供更多呼吸空间 */
    background-color: var(--bg-card);
    border-top: 1px solid var(--border-base);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.03);
    padding-bottom: 90px;
    /* 视觉上向上提，避免贴底 */
}

.footer-inner {
    display: flex;
    justify-content: center;
    /* 核心：居中对齐 */
    align-items: center;
    gap: 32px;
    /* 核心：控制按钮间距 */
}

/* 统一样式 */
.nav-btn {
    padding-left: 32px;
    padding-right: 32px;
    height: 48px;
    /* 按钮加高 */
    border-radius: 10px;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.prev-btn {
    /* 强制实体边框样式 */
    background-color: var(--bg-card);
    border: 1px solid var(--border-base) !important;
    color: var(--text-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    /* 轻微阴影 */
}

.prev-btn:hover {
    background-color: var(--bg-canvas);
    border-color: var(--text-secondary) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.next-btn {
    box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.25);
    letter-spacing: 0.5px;
}

.next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(var(--el-color-primary-rgb), 0.35);
}

.next-btn:active {
    transform: scale(0.98);
}

/* 动画过渡 */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}
</style>