<template>
    <el-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        :title="isEdit ? '编辑场景' : '创建场景'" size="680px" class="modern-drawer" destroy-on-close append-to-body>
        <div class="drawer-canvas">
            <div class="canvas-section">
                <div class="section-card basic-card">
                    <div class="card-row">
                        <div class="icon-placeholder">
                            <el-icon>
                                <Operation />
                            </el-icon>
                        </div>
                        <div class="form-area">
                            <el-form ref="formRef" :model="formData" :rules="rules" hide-required-asterisk>
                                <el-form-item prop="name" class="mb-2">
                                    <el-input v-model="formData.name" placeholder="未命名场景" class="title-input" />
                                </el-form-item>
                                <el-form-item prop="description" class="mb-0">
                                    <el-input v-model="formData.description" placeholder="添加描述..." class="desc-input" />
                                </el-form-item>
                            </el-form>
                        </div>
                        <div class="status-area">
                            <el-switch v-model="formData.enabled" active-text="启用" inline-prompt
                                style="--el-switch-on-color: #10b981;" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="timeline-container">
                <div class="timeline-line"></div>

                <div class="timeline-node if-node">
                    <div class="node-badge">IF</div>
                    <div class="node-content">
                        <div class="node-header">
                            <span class="label">触发条件</span>
                        </div>
                        <TriggerBuilder v-model="formData.triggers" v-model:logic="formData.matchType" />
                    </div>
                </div>

                <div class="timeline-connector">
                    <el-icon>
                        <ArrowDown />
                    </el-icon>
                </div>

                <div class="timeline-node then-node">
                    <div class="node-badge">THEN</div>
                    <div class="node-content">
                        <div class="node-header">
                            <span class="label">执行动作</span>
                            <span class="sub-label">将会执行...</span>
                        </div>
                        <ActionBuilder v-model="formData.actions" />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="modern-footer">
                <el-button class="cancel-btn" @click="$emit('update:modelValue', false)">取消</el-button>
                <el-button type="primary" class="save-btn" @click="handleSubmit">
                    保存配置
                </el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { ArrowDown, Operation } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { SceneRule } from '@/types/automation';

import TriggerBuilder from '@/components/studio/trigger/TriggerBuilder.vue';
import ActionBuilder from '@/components/studio/action/ActionBuilder.vue';

const props = defineProps<{
    modelValue: boolean;
    sceneData?: SceneRule;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'save', scene: SceneRule): void;
}>();

const formRef = ref<FormInstance>();
const isEdit = ref(false);

const defaultScene: SceneRule = {
    id: '',
    name: '',
    description: '',
    enabled: true,
    matchType: 'AND',
    triggers: [],
    actions: []
};

const formData = ref<SceneRule>({ ...defaultScene });

const rules = reactive<FormRules>({
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
});

watch(() => props.modelValue, (val) => {
    if (val) {
        if (props.sceneData) {
            isEdit.value = true;
            formData.value = JSON.parse(JSON.stringify(props.sceneData));
        } else {
            isEdit.value = false;
            formData.value = { ...defaultScene, id: Date.now().toString() };
        }
    }
});

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate((valid) => {
        if (valid) emit('save', formData.value);
    });
};
</script>

<style scoped lang="scss">
/* 全局变量覆盖 */
.modern-drawer {
    :deep(.el-drawer__header) {
        margin-bottom: 0;
        padding: 20px 24px;
        border-bottom: 1px solid #f0f0f0;
        font-weight: 600;
    }

    :deep(.el-drawer__body) {
        padding: 0;
        background-color: #F5F7FA;
        /* 浅灰背景 */
    }
}

.drawer-canvas {
    padding: 24px;
    min-height: 100%;
}

/* 通用卡片样式 */
.section-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 基础信息卡片 */
.basic-card {
    margin-bottom: 32px;

    .card-row {
        display: flex;
        gap: 16px;
        align-items: flex-start;
    }

    .icon-placeholder {
        width: 48px;
        height: 48px;
        background: #eff6ff;
        color: #3b82f6;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }

    .form-area {
        flex: 1;
    }

    /* 标题输入框样式定制 */
    :deep(.title-input .el-input__wrapper) {
        box-shadow: none !important;
        padding-left: 0;
        font-size: 18px;
        font-weight: 600;
    }

    :deep(.desc-input .el-input__wrapper) {
        box-shadow: none !important;
        padding-left: 0;
        font-size: 14px;
    }
}

/* 时间轴布局系统 */
.timeline-container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* 贯穿线 */
.timeline-line {
    position: absolute;
    top: 20px;
    bottom: 20px;
    left: 24px;
    /* 这里对应 Badge 的中心 */
    width: 2px;
    background: #e5e7eb;
    z-index: 0;
}

.timeline-node {
    position: relative;
    display: flex;
    gap: 24px;
    z-index: 1;
    margin-bottom: 12px;
}

.node-badge {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12px;
    background: #fff;
    border: 4px solid #F5F7FA;
    /* 模拟间距 */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}

.if-node .node-badge {
    color: #3b82f6;
    /* 蓝色 */
}

.then-node .node-badge {
    color: #10b981;
    /* 绿色 */
}

.node-content {
    flex: 1;
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    border: 1px solid #f3f4f6;
}

.node-header {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;

    .label {
        font-size: 16px;
        font-weight: 700;
        color: #1f2937;
    }

    .sub-label {
        font-size: 13px;
        color: #9ca3af;
        margin-top: 4px;
    }
}

/* 连接器 */
.timeline-connector {
    margin-left: 12px;
    /* 调整对齐 */
    width: 24px;
    height: 24px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
    border: 2px solid #fff;
}

/* 底部按钮 */
.modern-footer {
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .cancel-btn {
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        border-radius: 8px;

        &:hover {
            background: #e5e7eb;
        }
    }

    .save-btn {
        border-radius: 8px;
        padding: 8px 24px;
        font-weight: 600;
        background: #1f2937;
        /* 深色主按钮 */
        border: none;

        &:hover {
            background: #000;
        }
    }
}
</style>