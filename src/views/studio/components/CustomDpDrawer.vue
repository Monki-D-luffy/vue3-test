<template>
    <el-drawer v-model="visible" :title="isEdit ? '编辑功能定义' : '新建功能定义'" size="520px" :destroy-on-close="true"
        @closed="handleClosed" class="studio-drawer">
        <div class="drawer-content">
            <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" class="tech-form"
                hide-required-asterisk>
                <div class="form-section">
                    <div class="section-header">
                        <span class="icon-dot"></span>
                        <span class="title">基础信息</span>
                    </div>

                    <el-row :gutter="16">
                        <el-col :span="14">
                            <el-form-item label="功能名称" prop="name">
                                <el-input v-model="formData.name" placeholder="如：环境温度" class="tech-input" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="10">
                            <el-form-item label="标识符 (Code)" prop="code">
                                <el-input v-model="formData.code" placeholder="temp_value" :disabled="isEdit"
                                    class="tech-input font-mono">
                                    <template #prefix v-if="!isEdit && !formData.code">
                                        <span class="input-hint">dp_</span>
                                    </template>
                                </el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row :gutter="16">
                        <el-col :span="12">
                            <el-form-item label="DP ID" prop="id">
                                <el-input-number v-model="formData.id" :min="1" :max="255" controls-position="right"
                                    :disabled="isEdit" class="tech-number-input full-width" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="传输模式" prop="mode">
                                <el-radio-group v-model="formData.mode" class="tech-radio-group">
                                    <el-radio-button value="rw">可下发</el-radio-button>
                                    <el-radio-button value="ro">只上报</el-radio-button>
                                </el-radio-group>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </div>

                <div class="form-section highlight">
                    <div class="section-header">
                        <span class="icon-dot blue"></span>
                        <span class="title">数据定义</span>
                    </div>

                    <el-form-item label="数据类型" prop="type">
                        <el-select v-model="formData.type" placeholder="请选择类型" @change="handleTypeChange"
                            class="tech-select full-width" popper-class="tech-select-popper">
                            <el-option label="布尔型 (Boolean)" value="Boolean">
                                <div class="option-item">
                                    <span>布尔型 (Boolean)</span>
                                    <span class="sub">开关 / 状态</span>
                                </div>
                            </el-option>
                            <el-option label="数值型 (Integer)" value="Integer">
                                <div class="option-item">
                                    <span>数值型 (Integer)</span>
                                    <span class="sub">温度 / 亮度 / 计数</span>
                                </div>
                            </el-option>
                            <el-option label="枚举型 (Enum)" value="Enum">
                                <div class="option-item">
                                    <span>枚举型 (Enum)</span>
                                    <span class="sub">工作模式 / 档位</span>
                                </div>
                            </el-option>
                            <el-option label="字符串 (String)" value="String">
                                <div class="option-item">
                                    <span>字符串 (String)</span>
                                    <span class="sub">文本透传</span>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>

                    <transition name="el-zoom-in-top">
                        <div class="dynamic-config">

                            <div v-if="formData.type === 'Integer'">
                                <el-row :gutter="12">
                                    <el-col :span="8">
                                        <el-form-item label="最小值">
                                            <el-input-number v-model="formData.property.min"
                                                class="tech-number-input full-width" controls-position="right" />
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="8">
                                        <el-form-item label="最大值">
                                            <el-input-number v-model="formData.property.max"
                                                class="tech-number-input full-width" controls-position="right" />
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="8">
                                        <el-form-item label="步长">
                                            <el-input-number v-model="formData.property.step" :min="1"
                                                class="tech-number-input full-width" controls-position="right" />
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                <el-form-item label="单位符号">
                                    <el-input v-model="formData.property.unit" placeholder="如：℃, %, lx"
                                        class="tech-input" />
                                </el-form-item>
                            </div>

                            <div v-else-if="formData.type === 'Enum'">
                                <el-form-item label="枚举值定义 (Code)">
                                    <div class="enum-list">
                                        <div v-for="(item, index) in formData.property.range" :key="index"
                                            class="enum-row">
                                            <span class="index-badge">{{ index }}</span>
                                            <el-input v-model="formData.property.range[index]" placeholder="e.g. smart"
                                                size="small" class="tech-input" />
                                            <el-button link class="btn-icon-danger" @click="removeEnumItem(index)"
                                                :disabled="formData.property.range.length <= 1">
                                                <el-icon>
                                                    <Delete />
                                                </el-icon>
                                            </el-button>
                                        </div>
                                        <el-button class="btn-add-enum" size="small" @click="addEnumItem">
                                            <el-icon>
                                                <Plus />
                                            </el-icon> 添加枚举值
                                        </el-button>
                                    </div>
                                </el-form-item>
                            </div>

                            <div v-else-if="formData.type === 'String'">
                                <el-form-item label="最大字节数">
                                    <el-input-number v-model="formData.property.maxlen" :min="1" :max="255"
                                        class="tech-number-input" />
                                    <span class="info-text ml-2">Bytes (Max 255)</span>
                                </el-form-item>
                            </div>

                            <div v-else class="bool-tip">
                                <el-icon class="icon">
                                    <InfoFilled />
                                </el-icon>
                                <span>布尔值默认为 True (1) / False (0)，无需额外配置。</span>
                            </div>
                        </div>
                    </transition>
                </div>

                <el-form-item label="备注说明" prop="desc">
                    <el-input v-model="formData.desc" type="textarea" :rows="3" placeholder="描述该功能点的用途..."
                        class="tech-textarea" />
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <div class="drawer-footer">
                <el-button @click="visible = false" class="btn-text">取消</el-button>
                <el-button type="primary" class="btn-tech" @click="submitForm" :loading="loading">
                    确认保存
                </el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { Delete, Plus, InfoFilled } from '@element-plus/icons-vue';
import type { DataPoint, DpDataType } from '@/types/studio';
import { useStudioStore } from '@/stores/studioStore';

const props = defineProps<{
    modelValue: boolean;
    editData?: DataPoint | null;
}>();

const emit = defineEmits(['update:modelValue', 'success']);

const store = useStudioStore();
const visible = ref(false);
const isEdit = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

const initialForm = (): Partial<DataPoint> => ({
    id: store.dps.length > 0 ? Math.max(...store.dps.map(d => d.id)) + 1 : 101,
    name: '',
    code: '',
    type: 'Boolean',
    mode: 'rw',
    desc: '',
    isStandard: false,
    property: {
        min: 0, max: 100, step: 1, unit: '', range: ['mode_1'], maxlen: 255
    }
});

const formData = reactive<any>(initialForm());

const rules = reactive<FormRules>({
    name: [{ required: true, message: '名称必填', trigger: 'blur' }],
    code: [
        { required: true, message: '标识符必填', trigger: 'blur' },
        { pattern: /^[a-z_][a-z0-9_]*$/, message: '仅支持小写字母和下划线', trigger: 'blur' }
    ],
    type: [{ required: true, message: '类型必选', trigger: 'change' }]
});

watch(() => props.modelValue, (val) => {
    visible.value = val;
    if (val) {
        if (props.editData) {
            isEdit.value = true;
            Object.assign(formData, JSON.parse(JSON.stringify(props.editData)));
        } else {
            isEdit.value = false;
            Object.assign(formData, initialForm());
        }
    }
});

watch(visible, (val) => emit('update:modelValue', val));

const handleTypeChange = () => { };

const addEnumItem = () => {
    if (!formData.property.range) formData.property.range = [];
    formData.property.range.push(`mode_${formData.property.range.length + 1}`);
};

const removeEnumItem = (index: number) => {
    formData.property.range.splice(index, 1);
};

const handleClosed = () => {
    formRef.value?.resetFields();
};

const submitForm = async () => {
    if (!formRef.value) return;
    await formRef.value.validate((valid) => {
        if (valid) {
            loading.value = true;
            try {
                store.upsertDp(formData as DataPoint);
                ElMessage.success(isEdit.value ? '已保存' : '已创建');
                emit('success');
                visible.value = false;
            } catch (e) {
                ElMessage.error('保存失败');
            } finally {
                loading.value = false;
            }
        }
    });
};
</script>

<style scoped>
/* 使用 SCSS 变量，如果未配置 scss loader，请确保 :root 变量已定义在 main.css */

.drawer-content {
    padding: 0 20px;
}

.tech-form {
    --el-form-label-font-size: 13px;
    --el-text-color-regular: #64748b;
}

.form-section {
    background: #fff;
    border-radius: 8px;
    padding: 0;
    margin-bottom: 28px;
}

.form-section.highlight {
    background: #f8fafc;
    padding: 20px;
    border: 1px solid #f1f5f9;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.icon-dot {
    width: 4px;
    height: 14px;
    background: #cbd5e1;
    border-radius: 2px;
    margin-right: 8px;
}

.icon-dot.blue {
    background: var(--studio-primary, #1a1a1a);
    /* 对应主色 */
}

.title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

/* 输入框微调 */
.tech-input :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    background-color: #fff;
}

.tech-input :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--studio-primary, #1a1a1a) inset !important;
}

.font-mono :deep(.el-input__inner) {
    font-family: 'JetBrains Mono', monospace;
    color: #0f172a;
}

.input-hint {
    color: #94a3b8;
    font-size: 12px;
}

/* Radio Group */
.tech-radio-group :deep(.el-radio-button__inner) {
    border: none;
    background: #f1f5f9;
    color: #64748b;
    box-shadow: none !important;
    margin-right: 8px;
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: 500;
}

.tech-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: var(--studio-primary, #1a1a1a);
    color: #fff;
}

/* 动态区域样式 */
.dynamic-config {
    margin-top: 12px;
}

.enum-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.enum-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.index-badge {
    background: #e2e8f0;
    color: #64748b;
    font-size: 12px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-family: monospace;
}

.btn-add-enum {
    border-style: dashed;
    margin-top: 4px;
    width: 100%;
}

.btn-icon-danger:hover {
    color: #ef4444;
}

.bool-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    background: #fff;
    padding: 12px;
    border-radius: 6px;
    border: 1px dashed #cbd5e1;
}

.bool-tip .icon {
    color: #3b82f6;
}

/* 底部按钮 */
.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
}

.btn-text {
    border: none;
    background: transparent;
    color: #64748b;
}

.btn-text:hover {
    color: #1e293b;
    background: #f1f5f9;
}

/* 通用全宽 */
.full-width {
    width: 100%;
}

.option-item {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    padding: 4px 0;
}

.option-item .sub {
    font-size: 11px;
    color: #94a3b8;
}

.ml-2 {
    margin-left: 8px;
}

.info-text {
    font-size: 12px;
    color: #94a3b8;
}
</style>