<template>
    <el-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        :title="isEdit ? '编辑场景' : '创建场景'" size="680px" class="modern-drawer" destroy-on-close append-to-body>
        <div class="drawer-canvas">
            <div class="canvas-section">
                <div class="section-card basic-card">
                    <div class="card-row">
                        <div class="icon-placeholder"><el-icon>
                                <Operation />
                            </el-icon></div>
                        <div class="form-area">
                            <el-form ref="formRef" :model="formData" :rules="rules" hide-required-asterisk>
                                <el-form-item prop="name" class="mb-2">
                                    <el-input v-model="formData.name" placeholder="为场景起个名字..." class="title-input" />
                                </el-form-item>
                                <el-form-item prop="description" class="mb-0">
                                    <el-input v-model="formData.description" placeholder="添加描述 (可选)"
                                        class="desc-input" />
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

                <div class="timeline-connector"><el-icon>
                        <ArrowDown />
                    </el-icon></div>

                <div class="timeline-node then-node">
                    <div class="node-badge">THEN</div>
                    <div class="node-content">
                        <div class="node-header">
                            <span class="label">执行动作</span>
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

// 工厂函数：防止对象引用污染
const getDefaultScene = (): SceneRule => ({
    id: '',
    name: '',
    description: '',
    enabled: true,
    matchType: 'AND',
    triggers: [],
    actions: []
});

const formData = ref<SceneRule>(getDefaultScene());

const rules = reactive<FormRules>({
    name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }]
});

watch(() => props.modelValue, (val) => {
    if (val) {
        if (props.sceneData) {
            isEdit.value = true;
            // 深度拷贝
            formData.value = JSON.parse(JSON.stringify(props.sceneData));
        } else {
            isEdit.value = false;
            // 获取全新对象
            formData.value = { ...getDefaultScene(), id: Date.now().toString() };
        }
    }
});

// 🛠️ 修复后的摘要生成逻辑
const generateSummary = (scene: SceneRule) => {
    // 处理 Triggers
    scene.triggers.forEach(t => {
        // 根据 types/automation.ts 定义的 TriggerType
        switch (t.type) {
            case 'timer':
                // cron 在 params 中
                t.displayText = t.params.cron ? `定时: ${t.params.cron}` : '指定时间触发';
                break;
            case 'manual':
                t.displayText = '手动点击执行';
                break;
            case 'device_dp': // 修正类型字符串
                // 属性全部从 params 获取
                // 注意：meta 可能由前端组件注入到 params 中，如果 params 没有 meta，则使用默认值
                const meta = t.params['meta'] || {};
                const devName = meta.deviceName || '设备';
                const propName = meta.propName || t.params.dpId || '属性';
                const op = t.params.operator || '=';
                const val = t.params.value !== undefined ? t.params.value : '';

                t.displayText = `${devName} ${propName} ${op} ${val}`;
                break;
            default:
                if (!t.displayText || t.displayText === '新条件') {
                    t.displayText = '未知触发条件';
                }
        }
    });

    // 处理 Actions
    scene.actions.forEach(a => {
        // 根据 types/automation.ts 定义的 ActionType
        switch (a.type) {
            case 'device_write': // 修正类型字符串
                const meta = a.params['meta'] || {};
                const dev = meta.deviceName || '设备';
                a.displayText = `控制设备: ${dev}`;
                break;
            case 'notify':
                a.displayText = `发送通知: ${a.params.message || ''}`;
                break;
            case 'delay':
                a.displayText = `延时等待 ${a.params.delaySeconds || 0}秒`;
                break;
            case 'scene_trigger':
                a.displayText = '触发其他场景';
                break;
            default:
                if (!a.displayText || a.displayText === '新动作') {
                    a.displayText = '执行动作';
                }
        }
    });
};

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate((valid) => {
        if (valid) {
            // 生成摘要
            generateSummary(formData.value);
            // 深拷贝传出
            emit('save', JSON.parse(JSON.stringify(formData.value)));
        }
    });
};
</script>

<style scoped lang="scss">
/* --- 样式部分复用之前的代码，保持一致 --- */
.modern-drawer {
    :deep(.el-drawer__header) {
        margin-bottom: 0;
        padding: 10px 14px;
        border-bottom: 1px solid #f0f0f0;
        font-weight: 600;
    }

    :deep(.el-drawer__body) {
        padding: 0;
        background-color: #F5F7FA;
    }
}

.drawer-canvas {
    // padding: 24px;
    min-height: 100%;
}

.section-card {
    background: #fff;
    border-radius: 16px;
    padding: 10px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.04);
}

.basic-card {
    margin-bottom: 22px;

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

.timeline-container {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.timeline-line {
    position: absolute;
    top: 20px;
    bottom: 20px;
    left: 24px;
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
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}

.if-node .node-badge {
    color: #3b82f6;
}

.then-node .node-badge {
    color: #10b981;
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
}

.timeline-connector {
    margin-left: 12px;
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
        border: none;

        &:hover {
            background: #000;
        }
    }
}
</style>