<template>
    <el-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        :title="isEdit ? '编辑场景' : '创建新场景'" size="640px" class="scene-drawer tech-noir-drawer" destroy-on-close
        append-to-body>
        <div class="drawer-content">
            <div class="panel-block">
                <h3 class="panel-title">基础信息</h3>
                <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
                    <el-row :gutter="16">
                        <el-col :span="16">
                            <el-form-item label="场景名称" prop="name">
                                <el-input v-model="formData.name" placeholder="例如：回家模式、高温报警" maxlength="20"
                                    show-word-limit />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="启用状态">
                                <el-switch v-model="formData.enabled" active-text="启用" inactive-text="禁用" inline-prompt
                                    style="--el-switch-on-color: var(--el-color-success);" />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item label="描述" prop="description">
                        <el-input v-model="formData.description" type="textarea" :rows="2"
                            placeholder="简要描述该场景的功能..." />
                    </el-form-item>
                </el-form>
            </div>

            <div class="logic-section if-section">
                <div class="section-badge">IF (触发)</div>
                <TriggerBuilder v-model="formData.triggers" v-model:logic="formData.matchType" />
            </div>

            <div class="flow-connector-vertical">
                <el-icon>
                    <ArrowDown />
                </el-icon>
            </div>

            <div class="logic-section then-section">
                <div class="section-badge">THEN (执行)</div>
                <ActionBuilder v-model="formData.actions" />
            </div>

        </div>

        <template #footer>
            <div class="drawer-footer">
                <el-button @click="$emit('update:modelValue', false)">取消</el-button>
                <el-button type="primary" class="gold-btn-solid" @click="handleSubmit">保存场景</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import type { SceneRule } from '@/types/automation';

// 引入 Phase 2 & 3 的组件
import TriggerBuilder from '@/components/studio/trigger/TriggerBuilder.vue';
import ActionBuilder from '@/components/studio/action/ActionBuilder.vue';

// --- Props & Emits ---
const props = defineProps<{
    modelValue: boolean;
    sceneData?: SceneRule;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'save', scene: SceneRule): void;
}>();

// --- State ---
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

// 使用 reactive 或 ref 均可，这里使用 ref 以方便整体重置
const formData = ref<SceneRule>({ ...defaultScene });

const rules = reactive<FormRules>({
    name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }]
});

// --- Watchers ---
watch(() => props.modelValue, (val) => {
    if (val) {
        if (props.sceneData) {
            isEdit.value = true;
            // 深拷贝防止直接修改 Props
            formData.value = JSON.parse(JSON.stringify(props.sceneData));
        } else {
            isEdit.value = false;
            // 初始化新数据，生成临时 ID
            formData.value = { ...defaultScene, id: Date.now().toString() };
        }
    }
});

// --- Handlers ---
const handleSubmit = async () => {
    if (!formRef.value) return;

    await formRef.value.validate((valid) => {
        if (valid) {
            // 简单校验：至少需要一个触发条件和动作 (可选)
            // if (formData.value.triggers.length === 0) {
            //   return ElMessage.warning('请至少添加一个触发条件');
            // }

            emit('save', formData.value);
        }
    });
};
</script>

<style scoped>
.scene-drawer :deep(.el-drawer__body) {
    padding: 0;
    background-color: var(--bg-canvas, #f5f7fa);
}

.drawer-content {
    padding: 24px;
    height: 100%;
    overflow-y: auto;
}

/* 面板样式 */
.panel-block {
    background: #fff;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.panel-title {
    margin: 0 0 20px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-left: 3px solid var(--el-color-primary);
    padding-left: 10px;
    line-height: 1.2;
}

/* 逻辑区块通用样式 */
.logic-section {
    position: relative;
    background: #fff;
    border-radius: 12px;
    padding: 32px 20px 24px 20px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    transition: all 0.3s;
}

.logic-section:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* IF 区块特异性 */
.if-section {
    border-left: 4px solid var(--el-color-primary);
}

/* THEN 区块特异性 */
.then-section {
    border-left: 4px solid var(--el-color-success);
}

/* 标签 Badge */
.section-badge {
    position: absolute;
    top: -12px;
    left: 20px;
    background: #fff;
    padding: 2px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.5px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    z-index: 1;
}

.if-section .section-badge {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-8);
}

.then-section .section-badge {
    color: var(--el-color-success);
    border-color: var(--el-color-success-light-8);
}

/* 垂直连接线 */
.flow-connector-vertical {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    position: relative;
}

.flow-connector-vertical::before {
    content: '';
    position: absolute;
    height: 100%;
    width: 2px;
    background: var(--el-border-color-lighter);
    z-index: 0;
}

.flow-connector-vertical .el-icon {
    background: var(--bg-canvas, #f5f7fa);
    z-index: 1;
    padding: 4px;
    border-radius: 50%;
    color: var(--el-text-color-secondary);
}

/* 底部 */
.drawer-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: #fff;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 按钮样式复用 */
.gold-btn-solid {
    background: #1f1f1f;
    color: #d4af37;
    border: 1px solid #1f1f1f;
}

.gold-btn-solid:hover {
    background: #000;
    color: #f0c752;
    border-color: #000;
}
</style>