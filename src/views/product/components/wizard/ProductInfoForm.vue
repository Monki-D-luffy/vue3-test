<template>
    <div class="info-step-layout">
        <el-row :gutter="48" class="h-full">

            <el-col :xs="24" :md="14" class="form-column">
                <div class="header-text">
                    <h2 class="title">定义产品身份</h2>
                    <p class="subtitle">为您的新设备赋予独一无二的标识与描述。</p>
                </div>

                <el-form label-position="top" class="stylish-form" size="large">
                    <el-form-item label="产品名称 (Name)">
                        <div class="input-group">
                            <el-input :model-value="name" @update:model-value="$emit('update:name', $event)"
                                placeholder="例如：极光智能氛围灯 Pro" class="modern-input">
                                <template #prefix>
                                    <el-icon class="icon-gradient">
                                        <Edit />
                                    </el-icon>
                                </template>
                            </el-input>

                            <button class="ai-gradient-btn" @click="handleAiGenerate" :class="{ 'is-loading': loading }"
                                :disabled="loading">
                                <el-icon v-if="!loading" class="mr-1">
                                    <MagicStick />
                                </el-icon>
                                <el-icon v-else class="is-loading mr-1">
                                    <Loading />
                                </el-icon>
                                <span>AI 一键生成</span>
                                <div class="shine"></div>
                            </button>
                        </div>
                    </el-form-item>

                    <el-form-item label="产品型号 (Model ID)">
                        <el-input :model-value="model" @update:model-value="$emit('update:model', $event)"
                            placeholder="例如：IOT-LGT-2024-V1" class="modern-input font-mono">
                            <template #prefix>
                                <el-icon class="text-gray-400">
                                    <Ticket />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <el-form-item label="功能描述 (Description)">
                        <el-input :model-value="desc" @update:model-value="$emit('update:desc', $event)" type="textarea"
                            :rows="5" placeholder="简要描述产品的主要功能与应用场景..." class="modern-textarea" />
                    </el-form-item>
                </el-form>
            </el-col>

            <el-col :xs="0" :md="10" class="preview-column">
                <div class="preview-container">
                    <div class="preview-label">
                        <el-icon>
                            <View />
                        </el-icon> 实时效果预览
                    </div>

                    <div class="glass-card" :class="{ 'pulse-anim': loading }">
                        <div class="glow-bg"></div>

                        <div class="card-header">
                            <div class="icon-box" :style="getCategoryStyle(category)">
                                <el-icon :size="24">
                                    <component :is="getIcon(category)" />
                                </el-icon>
                            </div>
                            <div class="status-badge">
                                <div class="dot"></div> Draft
                            </div>
                        </div>

                        <div class="card-body">
                            <h3 class="preview-name" :class="{ 'placeholder': !name }">
                                {{ name || '产品名称...' }}
                            </h3>
                            <div class="preview-meta">
                                <span class="pid-tag">{{ model || 'MODEL-ID' }}</span>
                                <span class="divider">|</span>
                                <span class="category-text">{{ categoryName }}</span>
                            </div>
                            <p class="preview-desc" :class="{ 'placeholder': !desc }">
                                {{ desc || '暂无描述信息，请输入或使用 AI 生成...' }}
                            </p>
                        </div>

                        <div class="card-footer-line"></div>
                    </div>

                    <transition name="el-fade-in">
                        <div v-if="loading" class="ai-mask">
                            <div class="ai-thinking">
                                <el-icon class="is-loading">
                                    <MagicStick />
                                </el-icon>
                                <span>AI 正在构思创意...</span>
                            </div>
                        </div>
                    </transition>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    MagicStick, Edit, Ticket, View, Loading,
    Sunny, Odometer, Cpu, Box, Lock, Switch, Operation
} from '@element-plus/icons-vue';

const props = defineProps<{
    name: string;
    model: string;
    desc: string;
    category: string;
}>();

const emit = defineEmits(['update:name', 'update:model', 'update:desc']);
const loading = ref(false);

const categoryName = computed(() => {
    const map: Record<string, string> = {
        'LIGHT': '智能照明', 'SWITCH': '电工开关', 'SENSOR': '传感器',
        'GATEWAY': '网关中控', 'LOCK': '智能门锁', 'SOCKET': '智能插座'
    };
    return map[props.category] || '智能设备';
});

// 图标映射
const getIcon = (cat: string) => {
    const map: any = {
        'LIGHT': Sunny, 'SWITCH': Switch, 'SENSOR': Odometer,
        'GATEWAY': Cpu, 'LOCK': Lock, 'SOCKET': Operation
    };
    return map[cat] || Box;
};

// 颜色样式映射
const getCategoryStyle = (cat: string) => {
    const styles: any = {
        'LIGHT': { background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', color: '#f59e0b' }, // Orange
        'SWITCH': { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', color: '#3b82f6' }, // Blue
        'SENSOR': { background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#10b981' }, // Green
        'GATEWAY': { background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', color: '#8b5cf6' }, // Purple
        'LOCK': { background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', color: '#14b8a6' }, // Teal
    };
    return styles[cat] || { background: '#f3f4f6', color: '#6b7280' };
};

const handleAiGenerate = () => {
    if (!props.category) return;
    loading.value = true;

    // 模拟 AI 打字机效果
    setTimeout(() => {
        const baseName = props.category === 'LIGHT' ? '极光幻彩氛围灯' : '智能互联设备';

        emit('update:name', `${baseName} Ultra`);

        setTimeout(() => {
            emit('update:model', `IOT-${props.category}-X${Math.floor(Math.random() * 900) + 100}`);
        }, 300);

        setTimeout(() => {
            emit('update:desc', `这是一款旗舰级${categoryName.value}，采用新一代低功耗芯片。支持 Matter 协议，具备毫秒级响应速度，完美融入您的全屋智能生态系统。`);
            loading.value = false;
        }, 800);

    }, 800);
};
</script>

<style scoped>
.info-step-layout {
    height: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: 10px 20px;
}

/* --- 左侧表单样式 --- */
.form-column {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.header-text {
    margin-bottom: 30px;
}

.title {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.subtitle {
    font-size: 14px;
    color: var(--text-secondary);
}

.stylish-form :deep(.el-form-item__label) {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
}

/* 输入框组合 */
.input-group {
    display: flex;
    gap: 12px;
    width: 100%;
}

/* 现代输入框覆盖 */
.modern-input :deep(.el-input__wrapper),
.modern-textarea :deep(.el-textarea__inner) {
    background-color: var(--bg-canvas);
    /* 浅灰底色 */
    box-shadow: none !important;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 12px 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 15px;
}

/* 聚焦状态 - 柔和阴影 */
.modern-input :deep(.el-input__wrapper.is-focus),
.modern-textarea :deep(.el-textarea__inner:focus) {
    background-color: var(--bg-card);
    box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.1), 0 0 0 1px var(--el-color-primary) !important;
}

.icon-gradient {
    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 18px;
}

.font-mono :deep(.el-input__inner) {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    letter-spacing: 0.5px;
}

/* ✨ AI 极光按钮 (核心亮点) */
.ai-gradient-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    transition: transform 0.2s;
    /* 渐变背景 */
    background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}

.ai-gradient-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
}

.ai-gradient-btn:active {
    transform: scale(0.96);
}

.ai-gradient-btn.is-loading {
    opacity: 0.8;
    cursor: not-allowed;
}

/* 按钮扫光动画 */
.shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
    transform: skewX(-25deg);
    animation: shine 3s infinite;
}

@keyframes shine {
    100% {
        left: 200%;
    }
}

/* --- 右侧预览区域 --- */
.preview-column {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-left: 1px dashed var(--border-base);
    position: relative;
}

.preview-container {
    position: relative;
    width: 340px;
}

.preview-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
    justify-content: center;
}

/* 玻璃拟态卡片 */
.glass-card {
    position: relative;
    background: rgba(255, 255, 255, 0.8);
    /* Light Mode */
    backdrop-filter: blur(12px);
    border-radius: 20px;
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s;
    z-index: 1;
}

/* 暗黑模式适配 */
html.dark .glass-card {
    background: rgba(30, 30, 30, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
}

/* 背景光晕装饰 */
.glow-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.05), transparent 60%);
    z-index: -1;
    pointer-events: none;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.icon-box {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-canvas);
    padding: 4px 10px;
    border-radius: 20px;
}

.dot {
    width: 6px;
    height: 6px;
    background: #fbbf24;
    border-radius: 50%;
}

.card-body {
    position: relative;
    z-index: 2;
}

.preview-name {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 10px;
    line-height: 1.3;
    min-height: 29px;
}

.preview-name.placeholder {
    opacity: 0.3;
    font-style: italic;
}

.preview-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 20px;
    font-family: monospace;
}

.pid-tag {
    background: rgba(0, 0, 0, 0.03);
    padding: 2px 6px;
    border-radius: 4px;
}

.divider {
    opacity: 0.3;
}

.preview-desc {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-regular);
    min-height: 66px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.preview-desc.placeholder {
    opacity: 0.4;
}

.card-footer-line {
    margin-top: 24px;
    height: 4px;
    width: 40%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--el-color-primary), transparent);
}

/* AI 遮罩层 */
.ai-mask {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    z-index: 10;
}

html.dark .ai-mask {
    background: rgba(0, 0, 0, 0.6);
}

.ai-thinking {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: #EC4899;
    font-weight: 600;
}

.ai-thinking .el-icon {
    font-size: 32px;
}

/* 呼吸动画 */
.pulse-anim {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.02);
    }

    100% {
        transform: scale(1);
    }
}
</style>