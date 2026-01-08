<template>
    <el-dialog v-model="visible" :title="title || '发布新固件'" width="640px" append-to-body class="noir-modal"
        :close-on-click-modal="false" destroy-on-close>
        <div class="modal-content">

            <div class="upload-section">
                <el-upload class="noir-uploader" drag action="#" :auto-upload="false" :show-file-list="false"
                    :on-change="handleFileChange">
                    <div class="upload-trigger-content" v-if="!file">
                        <el-icon class="upload-icon">
                            <Cloudy />
                        </el-icon>
                        <div class="upload-text">
                            拖拽 .bin 文件至此，或 <span class="highlight">点击选择</span>
                        </div>
                        <div class="upload-tip">支持 bin, hex 格式，最大 10MB</div>
                    </div>

                    <div class="file-preview" v-else>
                        <div class="file-icon-box">
                            <el-icon>
                                <Document />
                            </el-icon>
                        </div>
                        <div class="file-info">
                            <div class="file-name">{{ file.name }}</div>
                            <div class="file-size">{{ formatSize(file.size) }}</div>
                        </div>
                        <el-button type="danger" link icon="Delete" class="remove-btn" @click.stop="removeFile" />
                    </div>
                </el-upload>
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="noir-form">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="版本号 (Version)" prop="version">
                            <el-input v-model="form.version" placeholder="例如: 1.0.1" class="noir-input">
                                <template #prefix>v</template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="发布环境 (Environment)" prop="type">
                            <el-select v-model="form.type" class="noir-select" placeholder="请选择">
                                <el-option label="🟢 开发测试 (Dev)" value="dev" />
                                <el-option label="🟠 灰度发布 (Gray)" value="gray" />
                                <el-option label="🔵 正式上线 (Prod)" value="prod" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <transition name="el-zoom-in-top">
                    <el-form-item label="灰度比例 (Gray Scale)" v-if="form.type === 'gray'">
                        <div class="slider-row">
                            <el-slider v-model="form.grayScale" :step="5" show-stops class="noir-slider"
                                style="flex: 1" />
                            <span class="slider-val">{{ form.grayScale }}%</span>
                        </div>
                        <div class="slider-desc">系统将随机选中 {{ form.grayScale }}% 的在线设备进行推送。</div>
                    </el-form-item>
                </transition>

                <el-form-item label="更新文案 (Change Log)" prop="description">
                    <el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述本次更新的特性与修复..."
                        class="noir-textarea" />
                </el-form-item>
            </el-form>

            <div class="progress-overlay" v-if="uploading">
                <el-progress type="circle" :percentage="progress" :color="customColors" :width="120">
                    <template #default="{ percentage }">
                        <span class="progress-text">{{ percentage }}%</span>
                        <span class="progress-status">Uploading...</span>
                    </template>
                </el-progress>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="visible = false" class="cancel-btn">取消</el-button>
                <el-button type="primary" class="gold-btn-solid" @click="handleSubmit" :loading="uploading">
                    {{ uploading ? '上传中...' : '确认发布' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Cloudy, Document, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FirmwareRelease } from '@/types/product-config';

const props = defineProps<{
    modelValue: boolean;
    title?: string;
    nextVersion?: string; // 自动填充建议版本号
}>();

const emit = defineEmits(['update:modelValue', 'publish']);

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// 表单数据
const file = ref<any>(null);
const form = ref({
    version: props.nextVersion || '',
    type: 'dev',
    grayScale: 10,
    description: ''
});

const rules = {
    version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
    type: [{ required: true, message: '请选择环境', trigger: 'change' }],
    description: [{ required: true, message: '请输入更新文案', trigger: 'blur' }]
};

// 进度条逻辑
const uploading = ref(false);
const progress = ref(0);
const customColors = [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#d4af37', percentage: 80 }, // 金色
    { color: '#10b981', percentage: 100 },
];

// 文件处理
const handleFileChange = (uploadFile: any) => {
    const isBin = uploadFile.name.endsWith('.bin') || uploadFile.name.endsWith('.hex');
    if (!isBin) {
        ElMessage.error('仅支持 .bin 或 .hex 固件文件');
        return;
    }
    file.value = uploadFile;

    // 智能猜测版本号 (如果是 firmware_v1.2.0.bin)
    const match = uploadFile.name.match(/v(\d+\.\d+\.\d+)/);
    if (match) {
        form.value.version = match[1];
    }
};

const removeFile = () => {
    file.value = null;
};

const formatSize = (size: number) => {
    return (size / 1024 / 1024).toFixed(2) + ' MB';
};

// 提交逻辑
const formRef = ref();
const handleSubmit = async () => {
    if (!file.value) {
        ElMessage.warning('请先上传固件文件');
        return;
    }

    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            // 开始模拟上传
            uploading.value = true;
            progress.value = 0;

            const timer = setInterval(() => {
                progress.value += Math.floor(Math.random() * 10) + 5;
                if (progress.value >= 100) {
                    progress.value = 100;
                    clearInterval(timer);
                    finishPublish();
                }
            }, 200);
        }
    });
};

const finishPublish = () => {
    setTimeout(() => {
        const newRelease: FirmwareRelease = {
            id: `rel_${Date.now()}`,
            version: form.value.version,
            type: form.value.type as any,
            description: form.value.description,
            size: file.value.size,
            createdAt: Date.now(),
            status: 'active',
            grayScale: form.value.type === 'gray' ? form.value.grayScale : undefined
        };

        emit('publish', newRelease);
        emit('update:modelValue', false);
        uploading.value = false;
        ElMessage.success('发布成功');

        // 重置
        file.value = null;
        form.value.description = '';
    }, 500);
};
</script>

<style scoped lang="scss">
/* Tech-Noir Modal 样式覆盖 */
.noir-modal {
    :deep(.el-dialog__header) {
        margin: 0;
        padding: 20px 24px;
        border-bottom: 1px solid #f0f2f5;
    }

    :deep(.el-dialog__title) {
        font-weight: 700;
        color: #1a1a1a;
    }

    :deep(.el-dialog__body) {
        padding: 0;
    }

    :deep(.el-dialog__footer) {
        padding: 16px 24px;
        border-top: 1px solid #f0f2f5;
        background: #fbfbfb;
    }
}

.modal-content {
    padding: 24px;
    position: relative;
}

/* 1. 上传区样式 */
.upload-section {
    margin-bottom: 24px;
}

.noir-uploader {
    :deep(.el-upload-dragger) {
        width: 100%;
        height: 140px;
        background: #fcfcfc;
        border: 1px dashed #dcdfe6;
        border-radius: 8px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            border-color: #d4af37;
            background: #fffdf5; // 淡淡的金色背景

            .upload-icon {
                color: #d4af37;
                transform: translateY(-2px);
            }
        }

        &.is-dragover {
            background: #fffdf5;
            border-color: #d4af37;
        }
    }
}

.upload-trigger-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .upload-icon {
        font-size: 32px;
        color: #909399;
        transition: all 0.3s;
    }

    .upload-text {
        font-size: 14px;
        color: #606266;
    }

    .highlight {
        color: #d4af37;
        font-weight: 600;
        cursor: pointer;
    }

    .upload-tip {
        font-size: 12px;
        color: #c0c4cc;
    }
}

.file-preview {
    display: flex;
    align-items: center;
    padding: 0 20px;
    width: 100%;

    .file-icon-box {
        width: 40px;
        height: 40px;
        background: #1f1f1f;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #d4af37;
        margin-right: 12px;
    }

    .file-info {
        flex: 1;
        text-align: left;

        .file-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 14px;
        }

        .file-size {
            font-size: 12px;
            color: #909399;
        }
    }

    .remove-btn {
        color: #f56c6c;

        &:hover {
            background: #fef0f0;
        }
    }
}

/* 2. 表单样式微调 */
.noir-input,
.noir-select,
.noir-textarea {
    width: 100%;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
        box-shadow: 0 0 0 1px #e4e7ed inset;
        padding: 8px 11px;

        &.is-focus {
            box-shadow: 0 0 0 1px #d4af37 inset;
        }
    }
}

.slider-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .slider-val {
        font-family: monospace;
        font-weight: 700;
        width: 40px;
        text-align: right;
    }
}

.slider-desc {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
    margin-top: -4px;
}

:deep(.el-slider__bar) {
    background-color: #d4af37;
}

:deep(.el-slider__button) {
    border-color: #d4af37;
}

/* 3. 进度遮罩 */
.progress-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 4px;
}

.progress-text {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    display: block;
}

.progress-status {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    display: block;
}

/* Footer */
.gold-btn-solid {
    background: #1f1f1f !important;
    border: none;
    color: #d4af37;
    font-weight: 600;

    &:hover {
        background: #000 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
}
</style>