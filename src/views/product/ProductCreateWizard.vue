<template>
    <div class="wizard-container">
        <div class="wizard-header">
            <el-button link @click="goBack" class="back-btn">
                <el-icon>
                    <ArrowLeft />
                </el-icon> 退出向导
            </el-button>
            <div class="steps-wrapper">
                <el-steps :active="activeStep" finish-status="success" align-center class="custom-steps">
                    <el-step title="选品类" />
                    <el-step title="定方案" />
                    <el-step title="填信息" />
                    <el-step title="初始化" />
                </el-steps>
            </div>
            <div class="header-placeholder"></div>
        </div>

        <div class="wizard-content">
            <transition name="el-fade-in-linear" mode="out-in">

                <div v-if="activeStep === 0" key="step1" class="step-panel">
                    <h2 class="step-title">选择产品品类</h2>
                    <p class="step-subtitle">决定产品的基本基因与功能模版</p>

                    <el-row :gutter="20" class="category-grid">
                        <el-col :xs="12" :sm="8" :md="6" v-for="cat in categories" :key="cat.value">
                            <div class="category-card card-base hover-lift"
                                :class="{ active: form.category === cat.value }" @click="selectCategory(cat.value)">
                                <div class="cat-icon" :class="cat.colorClass">
                                    <el-icon>
                                        <component :is="cat.icon" />
                                    </el-icon>
                                </div>
                                <span class="cat-name">{{ cat.label }}</span>
                            </div>
                        </el-col>
                    </el-row>
                </div>

                <div v-else-if="activeStep === 1" key="step2" class="step-panel">
                    <h2 class="step-title">选择通讯与硬件方案</h2>
                    <p class="step-subtitle">为 {{ getCategoryLabel(form.category) }} 选择最合适的连接方式</p>

                    <el-row :gutter="20" class="solution-grid">
                        <el-col :xs="24" :sm="12" v-for="proto in protocols" :key="proto.value">
                            <div class="solution-card card-base hover-lift"
                                :class="{ active: form.protocol === proto.value }" @click="selectProtocol(proto.value)">
                                <div class="sol-header">
                                    <el-icon class="sol-icon">
                                        <Connection />
                                    </el-icon>
                                    <span class="sol-title">{{ proto.label }}</span>
                                    <el-tag v-if="proto.recommend" type="success" size="small" effect="dark" round
                                        class="ml-auto">推荐</el-tag>
                                </div>
                                <p class="sol-desc">{{ proto.desc }}</p>
                                <div class="sol-footer">
                                    <span class="sol-chip">低功耗</span>
                                    <span class="sol-chip">OTA支持</span>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </div>

                <div v-else-if="activeStep === 2" key="step3" class="step-panel form-panel">
                    <h2 class="step-title">定义产品元数据</h2>
                    <p class="step-subtitle">完善产品的身份信息，AI 可协助生成</p>

                    <el-form :model="form" label-position="top" class="product-form">
                        <el-form-item label="产品名称 (Name)">
                            <div class="ai-input-group">
                                <el-input v-model="form.name" placeholder="例如：智能宠物喂食器" size="large" />
                                <el-button type="primary" plain class="ai-btn" :loading="aiLoading"
                                    @click="handleAiGenerate">
                                    <el-icon class="mr-1">
                                        <MagicStick />
                                    </el-icon> AI 生成
                                </el-button>
                            </div>
                        </el-form-item>

                        <el-form-item label="产品型号 (Model ID)">
                            <el-input v-model="form.model" placeholder="例如：PF-001-WIFI" font-family="monospace" />
                        </el-form-item>

                        <el-form-item label="产品描述">
                            <el-input v-model="form.desc" type="textarea" :rows="4" placeholder="描述产品的主要功能与卖点..." />
                        </el-form-item>
                    </el-form>
                </div>

                <div v-else-if="activeStep === 3" key="step4" class="step-panel success-panel">
                    <div class="success-icon-wrapper">
                        <el-icon class="success-icon">
                            <CircleCheckFilled />
                        </el-icon>
                    </div>
                    <h2 class="success-title">产品创建成功!</h2>
                    <p class="success-desc">PID: <span class="pid-text">{{ newPid }}</span></p>

                    <div class="action-buttons">
                        <el-button type="primary" size="large" class="go-btn" @click="goToDevelop">
                            前往功能定义 (Develop)
                        </el-button>
                        <el-button size="large" @click="goBack">返回列表</el-button>
                    </div>
                </div>

            </transition>
        </div>

        <div class="wizard-footer" v-if="activeStep < 3">
            <el-button @click="prevStep" :disabled="activeStep === 0">上一步</el-button>
            <el-button type="primary" @click="nextStep" :loading="creating" :disabled="!canProceed">
                {{ activeStep === 2 ? '立即创建' : '下一步' }}
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
    ArrowLeft, MagicStick, Connection, CircleCheckFilled,
    Sunny, Odometer, Cpu, Box, Lock, Switch
} from '@element-plus/icons-vue';

const router = useRouter();
const activeStep = ref(0);
const creating = ref(false);
const aiLoading = ref(false);
const newPid = ref('');

// 表单数据
const form = reactive({
    category: '',
    protocol: '',
    name: '',
    model: '',
    desc: ''
});

// 配置数据
const categories = [
    { label: '照明 (Light)', value: 'LIGHT', icon: Sunny, colorClass: 'text-orange-500 bg-orange-50' },
    { label: '开关 (Switch)', value: 'SWITCH', icon: Switch, colorClass: 'text-blue-500 bg-blue-50' },
    { label: '传感器 (Sensor)', value: 'SENSOR', icon: Odometer, colorClass: 'text-green-500 bg-green-50' },
    { label: '网关 (Gateway)', value: 'GATEWAY', icon: Cpu, colorClass: 'text-purple-500 bg-purple-50' },
    { label: '门锁 (Lock)', value: 'LOCK', icon: Lock, colorClass: 'text-teal-500 bg-teal-50' },
    { label: '其他 (Other)', value: 'OTHER', icon: Box, colorClass: 'text-gray-500 bg-gray-50' },
];

const protocols = [
    { label: 'Wi-Fi + BLE', value: 'WIFI_BLE', desc: '适合长供电设备，支持蓝牙配网，覆盖面广。', recommend: true },
    { label: 'Wi-Fi', value: 'WIFI', desc: '成本较低，适合不需要蓝牙辅助配网的设备。', recommend: false },
    { label: 'BLE Mesh', value: 'BLE', desc: '适合大规模组网照明设备，低功耗，响应快。', recommend: false },
    { label: 'Zigbee 3.0', value: 'ZIGBEE', desc: '工业级稳定性，需要搭配网关使用。', recommend: false },
];

// 逻辑控制
const canProceed = computed(() => {
    if (activeStep.value === 0) return !!form.category;
    if (activeStep.value === 1) return !!form.protocol;
    if (activeStep.value === 2) return !!form.name;
    return true;
});

const getCategoryLabel = (val: string) => categories.find(c => c.value === val)?.label || '产品';

// 交互动作
const selectCategory = (val: string) => form.category = val;
const selectProtocol = (val: string) => form.protocol = val;

const handleAiGenerate = () => {
    if (!form.name && !form.category) return;
    aiLoading.value = true;
    // Mock AI Delay
    setTimeout(() => {
        form.name = form.name || `智能${getCategoryLabel(form.category).split(' ')[0]} Pro`;
        form.model = `IOT-${form.category.substring(0, 3)}-${Math.floor(Math.random() * 1000)}`;
        form.desc = `这是一款基于 ${form.protocol} 协议的高性能${getCategoryLabel(form.category).split(' ')[0]}，集成最新的低功耗芯片，支持远程控制与智能场景联动。`;
        aiLoading.value = false;
    }, 1200);
};

const nextStep = () => {
    if (activeStep.value < 2) {
        activeStep.value++;
    } else {
        // Submit
        creating.value = true;
        setTimeout(() => {
            newPid.value = `PID-${Date.now().toString().slice(-6)}`;
            creating.value = false;
            activeStep.value = 3; // Success state
        }, 1000);
    }
};

const prevStep = () => {
    if (activeStep.value > 0) activeStep.value--;
};

const goBack = () => router.push({ name: 'ProductManagement' });
const goToDevelop = () => router.push({ name: 'ProductDevelop', params: { pid: newPid.value } });
</script>

<style scoped>
/* 沉浸式容器 */
.wizard-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--app-bg-canvas);
    position: relative;
}

/* 顶部 */
.wizard-header {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    background: var(--app-bg-card);
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.back-btn {
    font-size: 14px;
    color: var(--app-text-sub);
}

.steps-wrapper {
    width: 600px;
}

.header-placeholder {
    width: 80px;
}

/* 占位平衡布局 */

/* 内容区 */
.wizard-content {
    flex: 1;
    display: flex;
    justify-content: center;
    overflow-y: auto;
    padding: 40px 20px;
}

.step-panel {
    width: 100%;
    max-width: 900px;
    text-align: center;
    animation: fadeIn Up 0.4s ease;
}

.step-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--app-text-main);
    margin-bottom: 8px;
}

.step-subtitle {
    font-size: 16px;
    color: var(--app-text-sub);
    margin-bottom: 40px;
}

/* Step 1: Category Grid */
.category-grid {
    justify-content: center;
}

.category-card {
    height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 2px solid transparent;
    margin-bottom: 20px;
}

.category-card.active {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
}

.cat-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-bottom: 16px;
    /* Tailwind-like colors fallback */
    background: #f5f7fa;
    color: #606266;
}

/* 定义具体的 icon 颜色类 (对应 script 中的 colorClass) */
.text-orange-500 {
    color: #e6a23c;
}

.bg-orange-50 {
    background: rgba(230, 162, 60, 0.1);
}

.text-blue-500 {
    color: #409eff;
}

.bg-blue-50 {
    background: rgba(64, 158, 255, 0.1);
}

.text-green-500 {
    color: #67c23a;
}

.bg-green-50 {
    background: rgba(103, 194, 58, 0.1);
}

.text-purple-500 {
    color: #9b59b6;
}

.bg-purple-50 {
    background: rgba(155, 89, 182, 0.1);
}

.text-teal-500 {
    color: #14b8a6;
}

.bg-teal-50 {
    background: rgba(20, 184, 166, 0.1);
}

.cat-name {
    font-weight: 600;
    color: var(--app-text-main);
}

/* Step 2: Solution Grid */
.solution-grid {
    justify-content: center;
}

.solution-card {
    text-align: left;
    padding: 24px;
    cursor: pointer;
    border: 2px solid transparent;
    margin-bottom: 20px;
}

.solution-card.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}

.sol-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.sol-icon {
    font-size: 20px;
    margin-right: 8px;
    color: var(--el-color-primary);
}

.sol-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--app-text-main);
}

.sol-desc {
    font-size: 14px;
    color: var(--app-text-sub);
    margin-bottom: 16px;
    height: 40px;
    line-height: 1.5;
}

.sol-footer {
    display: flex;
    gap: 8px;
}

.sol-chip {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--app-bg-canvas);
    color: var(--app-text-sub);
}

/* Step 3: Form */
.form-panel {
    max-width: 600px;
    margin: 0 auto;
    text-align: left;
}

.product-form {
    background: var(--app-bg-card);
    padding: 40px;
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
}

.ai-input-group {
    display: flex;
    gap: 12px;
}

.ai-btn {
    padding: 0 20px;
}

/* Step 4: Success */
.success-panel {
    padding-top: 40px;
}

.success-icon-wrapper {
    font-size: 80px;
    color: var(--el-color-success);
    margin-bottom: 24px;
}

.success-title {
    font-size: 32px;
    color: var(--app-text-main);
    margin-bottom: 16px;
}

.success-desc {
    font-size: 18px;
    color: var(--app-text-sub);
    margin-bottom: 48px;
}

.pid-text {
    font-family: monospace;
    font-weight: 700;
    color: var(--app-text-main);
    background: var(--app-bg-card);
    padding: 4px 12px;
    border-radius: 6px;
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
}

.go-btn {
    width: 240px;
}

/* 底部栏 */
.wizard-footer {
    height: 80px;
    background: var(--app-bg-card);
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

/* Utils */
.card-base {
    background-color: var(--app-bg-card);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
</style>