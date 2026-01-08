<template>
    <el-dialog :model-value="modelValue" @update:model-value="handleClose"
        :title="isEditMode ? '编辑告警规则 (Edit Rule)' : '新建告警规则 (New Rule)'" width="640px" append-to-body
        class="noir-modal-editor" :close-on-click-modal="false" destroy-on-close>
        <div class="editor-body form-container">
            <el-form ref="formRef" :model="form" label-position="top" class="noir-form" :rules="rules">

                <div class="form-section basic-section">
                    <el-form-item label="规则名称 (Rule Name)" prop="name">
                        <el-input v-model="form.name" placeholder="例如: 电池电量低报警" class="noir-input-lg">
                            <template #prefix>
                                <el-icon class="input-icon"><edit-pen /></el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                </div>

                <div class="logic-builder-container">
                    <div class="builder-header main-header">
                        <div class="header-left">
                            <el-icon>
                                <cpu />
                            </el-icon>
                            <span class="builder-title">触发条件 (IF)</span>
                        </div>
                        <span class="tech-tag">Cloud Logic Engine</span>
                    </div>

                    <div class="builder-content">
                        <el-row :gutter="12">
                            <el-col :span="11">
                                <el-form-item label="监控功能点 (Sensor DP)" prop="dpId" class="noir-form-item-label">
                                    <el-select v-model="form.dpId" class="noir-select" placeholder="选择监控对象"
                                        @change="handleDpChange" popper-class="noir-select-popper">
                                        <el-option v-for="dp in availableDps" :key="dp.id" :label="dp.name"
                                            :value="dp.id">
                                            <div class="option-row">
                                                <span>{{ dp.name }}</span>
                                                <span class="option-sub">DP{{ dp.id }} · {{ dp.type }}</span>
                                            </div>
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>

                            <el-col :span="5">
                                <el-form-item label="判断 (Logic)" prop="operator" class="noir-form-item-label">
                                    <el-select v-model="form.operator" class="noir-select"
                                        popper-class="noir-select-popper">
                                        <el-option v-for="op in currentOperators" :key="op.value" :label="op.label"
                                            :value="op.value" />
                                    </el-select>
                                </el-form-item>
                            </el-col>

                            <el-col :span="8">
                                <el-form-item label="触发阈值 (Threshold)" prop="threshold" class="noir-form-item-label">
                                    <el-input-number v-if="isNumericDp" v-model="form.threshold"
                                        controls-position="right" class="noir-input-number" style="width: 100%"
                                        placeholder="数值" />
                                    <el-select v-else-if="currentDpType === 'Boolean'" v-model="form.threshold"
                                        class="noir-select" popper-class="noir-select-popper">
                                        <el-option label="开启 / ON" :value="true" /><el-option label="关闭 / OFF"
                                            :value="false" />
                                    </el-select>
                                    <el-select v-else-if="currentDpType === 'Enum'" v-model="form.threshold"
                                        class="noir-select" popper-class="noir-select-popper">
                                        <el-option v-for="opt in currentDpEnumRange" :key="opt" :label="opt"
                                            :value="opt" />
                                    </el-select>
                                    <el-input v-else v-model="form.threshold" class="noir-input" placeholder="输入值" />
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <transition name="el-zoom-in-top">
                            <div class="device-sync-panel" v-if="isNumericDp">
                                <div class="sync-header-row">
                                    <el-checkbox v-model="enableSync" class="noir-checkbox">
                                        <span class="sync-title">同步下发至设备参数 (Device Sync)</span>
                                    </el-checkbox>
                                    <el-tooltip content="开启后，保存时会将阈值写入设备端指定的可写 DP，实现本地快速响应。" placement="top">
                                        <el-icon class="info-icon">
                                            <InfoFilled />
                                        </el-icon>
                                    </el-tooltip>
                                </div>

                                <div v-if="enableSync" class="sync-config-box">
                                    <div class="sync-arrow">
                                        <el-icon>
                                            <bottom />
                                        </el-icon>
                                    </div>
                                    <el-form-item label="目标写入 DP (Target Writable DP)" class="mb-0"
                                        prop="bindTargetDpId">
                                        <el-select v-model="form.bindTargetDpId" placeholder="选择设备端定义的参数点..."
                                            class="noir-select sync-select" popper-class="noir-select-popper">
                                            <el-option v-for="dp in writableDps" :key="dp.id" :label="dp.name"
                                                :value="dp.id">
                                                <div class="option-row">
                                                    <span>{{ dp.name }}</span>
                                                    <span class="option-sub">DP{{ dp.id }} (RW)</span>
                                                </div>
                                            </el-option>
                                        </el-select>
                                    </el-form-item>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <div class="builder-header action-header">
                        <div class="header-left">
                            <el-icon><message-box /></el-icon>
                            <span class="builder-title">执行动作 (THEN)</span>
                        </div>
                    </div>
                    <div class="builder-content action-content">
                        <el-form-item label="通知文案 (Notification Message)" prop="message">
                            <el-input v-model="form.message" type="textarea" :rows="3" placeholder="请输入推送给用户的消息内容..."
                                class="noir-textarea" resize="none" />
                        </el-form-item>
                    </div>
                </div>

            </el-form>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose" class="noir-btn-cancel">取消</el-button>
                <el-button type="primary" class="gold-btn-solid" @click="handleSave" :loading="saving">
                    {{ saveButtonText }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { EditPen, Cpu, MessageBox, InfoFilled, Bottom } from '@element-plus/icons-vue';
import type { AlertRule } from '@/types/product-config';
import { ElMessage, type FormInstance } from 'element-plus';

const props = defineProps<{
    modelValue: boolean;
    ruleData: AlertRule | null;
    availableDps: any[];
    writableDps: any[];
}>();

const emit = defineEmits(['update:modelValue', 'save']);
const formRef = ref<FormInstance>();
const saving = ref(false);
const enableSync = ref(false);

const defaultForm = {
    name: '', dpId: null, dpName: '', dpType: '', operator: '==', threshold: null,
    bindTargetDpId: null, message: '', notifyType: 'app_push', cooldown: 60
};
const form = ref<any>({ ...defaultForm });

const rules = {
    name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
    dpId: [{ required: true, message: '请选择监控功能点', trigger: 'change' }],
    operator: [{ required: true, trigger: 'change' }],
    threshold: [{ required: true, message: '请输入或选择阈值', trigger: 'change' }],
    message: [{ required: true, message: '请输入通知文案', trigger: 'blur' }],
    bindTargetDpId: [{
        validator: (rule: any, value: any, callback: any) => {
            if (enableSync.value && !value) callback(new Error('请选择同步目标 DP'));
            else callback();
        },
        trigger: 'change'
    }]
};

const isEditMode = computed(() => !!props.ruleData?.id);
const currentDp = computed(() => props.availableDps.find(d => d.id === form.value.dpId));
const currentDpType = computed(() => currentDp.value?.type || '');
const isNumericDp = computed(() => ['Value', 'Integer'].includes(currentDpType.value));
const currentDpEnumRange = computed(() => currentDp.value?.property?.range || []);
const saveButtonText = computed(() => saving.value ? '正在保存...' : (enableSync.value && form.value.bindTargetDpId ? '保存并下发指令' : '保存配置'));

const currentOperators = computed(() => {
    if (isNumericDp.value) return [{ label: '大于 (>)', value: '>' }, { label: '小于 (<)', value: '<' }, { label: '等于 (==)', value: '==' }];
    return [{ label: '等于 (==)', value: '==' }];
});

watch(() => props.modelValue, (val) => {
    if (val) {
        nextTick(() => {
            formRef.value?.resetFields();
            if (props.ruleData) {
                form.value = JSON.parse(JSON.stringify(props.ruleData));
                enableSync.value = !!form.value.bindTargetDpId;
            } else {
                form.value = { ...defaultForm };
                enableSync.value = false;
            }
        });
    }
});

const handleClose = () => emit('update:modelValue', false);
const handleDpChange = (val: number) => {
    const dp = props.availableDps.find(d => d.id === val);
    if (dp) {
        form.value.dpName = dp.name;
        form.value.dpType = dp.type;
        form.value.threshold = null;
        form.value.operator = isNumericDp.value ? '>' : '==';
        form.value.message = `检测到 ${dp.name} 状态异常，请及时查看。`;
        form.value.bindTargetDpId = null;
        enableSync.value = false;
        formRef.value?.clearValidate(['threshold', 'bindTargetDpId']);
    }
};
const handleSave = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid) => {
        if (valid) {
            saving.value = true;
            if (!enableSync.value) form.value.bindTargetDpId = null;
            const finalRule: AlertRule = {
                ...form.value,
                id: props.ruleData?.id || `alert_${Date.now()}`,
                enabled: props.ruleData?.enabled ?? true,
            };
            try {
                await emit('save', finalRule, enableSync.value);
                handleClose();
            } catch (e) { } finally { saving.value = false; }
        } else {
            ElMessage.warning('请检查表单填写是否完整');
        }
    });
};
</script>

<style lang="scss">
.noir-select-popper {
    border: 1px solid #e4e7ed !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;

    .el-select-dropdown__item {
        padding: 8px 12px;

        &.selected {
            color: #d4af37;
            font-weight: 600;
        }

        &:hover {
            background-color: #fffdf5;
        }
    }

    .option-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .option-sub {
            font-size: 12px;
            color: #909399;
        }
    }
}
</style>

<style scoped lang="scss">
.noir-modal-editor {
    :deep(.el-dialog__header) {
        margin: 0;
        padding: 20px 24px;
        border-bottom: 1px solid #f0f2f5;
        background: #fff;

        .el-dialog__title {
            font-weight: 700;
            color: #1a1a1a;
            font-size: 16px;
        }
    }

    :deep(.el-dialog__body) {
        padding: 0;
        background: #f8f9fb;
    }

    :deep(.el-dialog__footer) {
        padding: 16px 24px;
        border-top: 1px solid #e4e7ed;
        background: #fff;
    }
}

.form-container {
    padding: 24px;
}

/* 强制标签不换行 */
.noir-form {
    :deep(.el-form-item__label) {
        font-size: 12px;
        color: #606266;
        font-weight: 600;
        padding-bottom: 6px;
        white-space: nowrap;
        /* ✅ 关键修复：禁止换行 */
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

/* 统一输入框高度为 36px (content 34 + border 2) */
$input-height: 36px;

.noir-input-lg,
.noir-input,
.noir-select,
.noir-textarea {
    width: 100%;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
        box-shadow: none !important;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        background: #fff;
        padding: 0 11px;
        /* 上下 padding 0，由 height 控制 */
        height: $input-height;
        line-height: $input-height;
        transition: all 0.3s;

        &.is-focus {
            border-color: #d4af37;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1) !important;
        }
    }

    .input-icon {
        color: #909399;
    }
}

.noir-input-lg :deep(.el-input__wrapper) {
    height: 42px;
    line-height: 42px;
    font-size: 15px;
    font-weight: 600;
}

.noir-textarea :deep(.el-textarea__inner) {
    height: auto;
    padding: 8px 11px;
    line-height: 1.5;
}

/* ✅ 关键修复：el-input-number 高度修正 */
.noir-input-number {
    width: 100%;

    :deep(.el-input__wrapper) {
        box-shadow: none !important;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        background: #fff;
        padding: 0;
        /* 必须清空 padding，防止内部撑高 */
        height: $input-height;
        line-height: $input-height;

        &.is-focus {
            border-color: #d4af37;
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1) !important;
        }
    }

    :deep(.el-input__inner) {
        height: $input-height;
        line-height: $input-height;
        text-align: left;
        padding-left: 11px;
        /* 内容缩进 */
    }
}

.logic-builder-container {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    overflow: hidden;
    margin-top: 20px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.builder-header {
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f0f2f5;
    background: #fcfcfc;

    &.main-header {
        background: linear-gradient(to right, #fcfcfc, #fff);
    }

    &.action-header {
        border-top: 1px solid #f0f2f5;
        margin-top: 0;
        background: #fffdf5;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1a1a1a;
    }

    .builder-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .tech-tag {
        font-size: 10px;
        background: #1f1f1f;
        color: #d4af37;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
}

.builder-content {
    padding: 20px 16px 4px;

    &.action-content {
        padding-bottom: 16px;
    }
}

.device-sync-panel {
    margin-top: 4px;
    background: #f8f9fb;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    padding: 12px 16px;
}

.sync-header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .sync-title {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .info-icon {
        color: #909399;
        cursor: pointer;

        &:hover {
            color: #d4af37;
        }
    }
}

.sync-config-box {
    position: relative;
    padding-left: 28px;

    .sync-arrow {
        position: absolute;
        left: 0;
        top: 10px;
        color: #d4af37;
        animation: floatArrow 1.5s infinite ease-in-out;
    }
}

@keyframes floatArrow {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(3px);
    }
}

.noir-btn-cancel {
    border: 1px solid #dcdfe6;
    color: #606266;

    &:hover {
        color: #1a1a1a;
        border-color: #c0c4cc;
        background: #f5f7fa;
    }
}

.gold-btn-solid {
    background: #1f1f1f;
    border: none;
    color: #d4af37;
    font-weight: 600;
    padding: 10px 24px;

    &:hover {
        background: #000;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    }
}

.noir-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #d4af37;
    border-color: #d4af37;
}

.noir-checkbox :deep(.el-checkbox__label) {
    color: #1a1a1a;
}
</style>