<template>
    <div class="provisioning-container noir-skin">
        <div class="config-panel">
            <div class="panel-section">
                <h4 class="section-title">基础策略</h4>
                <el-form label-position="top" size="default">
                    <el-form-item label="配网协议 (Protocol)">
                        <el-radio-group v-model="modelValue.protocol" class="tech-radio-group">
                            <el-radio-button value="wifi_ble">Wi-Fi + BLE (推荐)</el-radio-button>
                            <el-radio-button value="wifi_ap">AP 热点模式</el-radio-button>
                        </el-radio-group>
                        <div class="form-tip">ESP32-C3/S3/C6 建议使用 BLE 辅助配网，体验更佳。</div>
                    </el-form-item>

                    <el-form-item label="状态指示灯 (LED Pin)">
                        <el-select v-model="modelValue.ledPin" placeholder="选择 GPIO" style="width: 100%"
                            class="tech-select">
                            <el-option label="GPIO 2 (板载蓝灯)" :value="2" />
                            <el-option label="GPIO 18" :value="18" />
                            <el-option label="无 (None)" :value="-1" />
                        </el-select>
                        <div class="form-tip">配网期间，该引脚将输出 2Hz 闪烁信号。</div>
                    </el-form-item>
                </el-form>
            </div>

            <div class="panel-section">
                <h4 class="section-title">引导步骤 (Steps)</h4>
                <div v-if="modelValue.steps && modelValue.steps.length > 0">
                    <div v-for="(step, index) in modelValue.steps" :key="index" class="step-item"
                        :class="{ active: activeStep === index }" @click="activeStep = index">
                        <div class="step-header">
                            <span class="step-num">Step {{ index + 1 }}</span>
                            <el-button v-if="modelValue.steps.length > 1" type="danger" link icon="Delete"
                                @click.stop="removeStep(index)" />
                        </div>
                        <el-input v-model="step.title" placeholder="步骤标题" class="mb-2 font-bold tech-input" />
                        <el-input v-model="step.desc" type="textarea" :rows="2" placeholder="详细操作说明..."
                            class="tech-input" />
                    </div>
                </div>
                <div v-else class="empty-steps">
                    暂无引导步骤，请添加
                </div>

                <el-button class="add-btn tech-dashed-btn" icon="Plus" @click="addStep">新增步骤</el-button>
            </div>
        </div>

        <div class="preview-panel">
            <div class="phone-frame">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                    <div class="app-nav">
                        <el-icon>
                            <ArrowLeft />
                        </el-icon>
                        <span>添加设备</span>
                        <div style="width:16px"></div>
                    </div>

                    <div class="app-content">
                        <div class="preview-img-placeholder">
                            <span>GIF / IMG</span>
                            <div class="led-indicator" v-if="modelValue.ledPin !== null && modelValue.ledPin !== -1">
                                <span class="blink-dot"></span> LED 闪烁中
                            </div>
                        </div>

                        <h3 class="preview-title">{{ currentStep?.title || '标题预览' }}</h3>
                        <p class="preview-desc">{{ currentStep?.desc || '说明文案预览...' }}</p>

                        <div class="step-dots" v-if="modelValue.steps && modelValue.steps.length > 0">
                            <span v-for="(_, i) in modelValue.steps" :key="i" class="dot"
                                :class="{ active: i === activeStep }"></span>
                        </div>

                        <div class="app-btn-area">
                            <div class="app-btn primary">下一步</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="preview-label">App 真实渲染预览</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowLeft, Delete, Plus } from '@element-plus/icons-vue';
import type { ProvisioningConfig } from '@/types/product-config';

const props = defineProps<{
    modelValue: ProvisioningConfig
}>();

const emit = defineEmits(['update:modelValue']);

const activeStep = ref(0);

// 核心修复：增强 currentStep 的鲁棒性，防止 undefined
const currentStep = computed(() => {
    const steps = props.modelValue.steps;

    // 1. 检查 steps 是否存在且非空
    if (!steps || steps.length === 0) {
        return {
            title: '暂无步骤',
            desc: '请在左侧点击“新增步骤”添加配网引导内容'
        };
    }

    // 2. 检查索引是否越界（例如删除了最后一个元素后）
    if (activeStep.value >= steps.length) {
        return steps[0];
    }

    return steps[activeStep.value];
});

const addStep = () => {
    // 确保 steps 数组存在
    if (!props.modelValue.steps) {
        props.modelValue.steps = [];
    }

    props.modelValue.steps.push({ title: '新步骤', desc: '', imageUrl: '' });
    activeStep.value = props.modelValue.steps.length - 1;
};

const removeStep = (index: number) => {
    if (!props.modelValue.steps) return;

    props.modelValue.steps.splice(index, 1);

    // 删除后自动调整激活的步骤索引
    if (props.modelValue.steps.length === 0) {
        activeStep.value = 0;
    } else if (activeStep.value >= props.modelValue.steps.length) {
        activeStep.value = Math.max(0, props.modelValue.steps.length - 1);
    }
};
</script>

<style scoped lang="scss">
/* --- Tech-Noir 样式覆盖 (保持不变) --- */
.noir-skin {
    --el-color-primary: #000000;
    --el-color-primary-light-3: #333333;
    --el-color-primary-light-5: #666666;
    --el-color-primary-light-7: #999999;
    --el-color-primary-light-9: #f0f0f0;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background-color: #000000;
    border-color: #000000;
    color: #d4af37;
    box-shadow: -1px 0 0 0 #000000;
}

:deep(.el-radio-button__inner:hover) {
    color: #d4af37;
}

:deep(.el-input.is-focus .el-input__wrapper),
:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #d4af37 inset !important;
}

:deep(.el-select-dropdown__item.selected) {
    color: #d4af37;
    font-weight: 600;
}

.tech-dashed-btn {
    border: 1px dashed #dcdfe6;
    transition: all 0.3s;

    &:hover {
        color: #d4af37;
        border-color: #d4af37;
        background-color: rgba(212, 175, 55, 0.05);
    }
}

.provisioning-container {
    display: flex;
    height: 100%;
    gap: 32px;
}

/* 左侧配置 */
.config-panel {
    flex: 1;
    overflow-y: auto;
    padding-right: 16px;
}

.panel-section {
    margin-bottom: 32px;
}

.section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 16px;
    display: flex;
    align-items: center;

    &::before {
        content: '';
        width: 3px;
        height: 14px;
        background: #d4af37;
        margin-right: 8px;
        border-radius: 2px;
    }
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
}

.step-item {
    background: #f9f9f9;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #c0c4cc;
    }

    &.active {
        background: #fff;
        border-color: #d4af37;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
    }
}

.step-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    color: #909399;
}

.empty-steps {
    padding: 20px;
    text-align: center;
    color: #909399;
    font-size: 13px;
    border: 1px dashed #e4e7ed;
    border-radius: 8px;
    margin-bottom: 12px;
}

.add-btn {
    width: 100%;
}

/* 右侧手机预览 */
.preview-panel {
    width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
}

.phone-frame {
    width: 280px;
    height: 560px;
    background: #1f1f1f;
    border-radius: 36px;
    padding: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    position: relative;
}

.phone-screen {
    background: #fff;
    width: 100%;
    height: 100%;
    border-radius: 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
}

.app-nav {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    font-weight: 600;
    font-size: 15px;
    border-bottom: 1px solid #f0f0f0;
}

.app-content {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.preview-img-placeholder {
    width: 180px;
    height: 180px;
    background: #f5f7fa;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #c0c4cc;
    margin-top: 32px;
    margin-bottom: 32px;
    position: relative;
}

.led-indicator {
    position: absolute;
    bottom: -10px;
    background: #1f1f1f;
    color: #fff;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.blink-dot {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    animation: blink 1s infinite;
}

@keyframes blink {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0.3;
    }

    100% {
        opacity: 1;
    }
}

.preview-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    text-align: center;
}

.preview-desc {
    font-size: 14px;
    color: #606266;
    text-align: center;
    line-height: 1.5;
    margin-bottom: auto;
}

.step-dots {
    display: flex;
    gap: 6px;
    margin-bottom: 24px;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e4e7ed;

    &.active {
        background: #d4af37;
        width: 12px;
        border-radius: 3px;
    }
}

.app-btn {
    width: 100%;
    height: 44px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;

    &.primary {
        background: #d4af37;
        color: #fff;
    }
}

.preview-label {
    margin-top: 16px;
    font-size: 12px;
    color: #909399;
    font-family: monospace;
}
</style>