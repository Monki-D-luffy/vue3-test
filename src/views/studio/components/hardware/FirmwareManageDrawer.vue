<template>
    <el-drawer v-model="visible" title="固件管理与交付" direction="rtl" size="500px" class="studio-drawer">
        <div class="drawer-content">
            <div class="resource-section">
                <h4 class="section-title">资源评估 (Resource Est.)</h4>
                <div class="resource-grid">
                    <div class="res-card">
                        <div class="label">RAM 占用</div>
                        <el-progress type="dashboard" :percentage="store.resourceAnalysis.ramPercentage" :width="80"
                            :color="colors">
                            <template #default="{ percentage }">
                                <span class="res-val">{{ percentage }}%</span>
                            </template>
                        </el-progress>
                        <div class="detail">已用 {{ store.resourceAnalysis.ramUsageKB }}KB</div>
                    </div>
                    <div class="res-card">
                        <div class="label">Flash 占用</div>
                        <el-progress type="dashboard" :percentage="store.resourceAnalysis.flashPercentage" :width="80"
                            :color="colors">
                            <template #default="{ percentage }">
                                <span class="res-val">{{ percentage }}%</span>
                            </template>
                        </el-progress>
                        <div class="detail">已用 {{ (store.resourceAnalysis.flashUsageKB / 1024).toFixed(1) }}MB</div>
                    </div>
                </div>
            </div>

            <el-divider />

            <el-tabs v-model="activeTab" class="fw-tabs">
                <el-tab-pane label="生成固件" name="generate">
                    <div class="tab-pane-content">
                        <p class="hint-text">基于当前产品配置 (Product Config) 和引脚映射 (Pin Map) 编译标准固件包。</p>

                        <el-form label-position="top">
                            <el-form-item label="目标 SDK 版本">
                                <el-select v-model="sdkVersion" style="width: 100%">
                                    <el-option label="TuyaOS 3.8.2 (推荐)" value="3.8.2" />
                                    <el-option label="FreeRTOS Generic (通用版)" value="generic" />
                                </el-select>
                            </el-form-item>
                        </el-form>

                        <el-button type="primary" class="black-gold-btn full-width" :loading="store.isGenerating"
                            @click="handleGenerate">
                            {{ store.isGenerating ? '编译中...' : '开始编译固件' }}
                        </el-button>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="上传自定义" name="upload">
                    <div class="upload-area">
                        <el-upload class="drag-uploader" drag action="#" :auto-upload="false"
                            :on-change="handleFileChange" :show-file-list="false">
                            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            <div class="el-upload__text">
                                拖拽 .bin 文件到此处 或 <em>点击上传</em>
                            </div>
                        </el-upload>
                        <div v-if="uploadedFile" class="file-preview">
                            <el-icon>
                                <Document />
                            </el-icon> {{ uploadedFile.name }}
                            <el-button size="small" type="primary" link @click="confirmUpload">立即上传</el-button>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <div class="history-section">
                <h4 class="section-title">构建历史</h4>
                <div class="artifact-list">
                    <div v-for="item in store.firmwareArtifacts" :key="item.id" class="artifact-item">
                        <div class="icon-wrap">
                            <el-icon v-if="item.source === 'uploaded'">
                                <Upload />
                            </el-icon>
                            <el-icon v-else>
                                <Box />
                            </el-icon>
                        </div>
                        <div class="info">
                            <div class="ver">{{ item.version }}</div>
                            <div class="meta">{{ new Date(item.createdAt).toLocaleTimeString() }} • {{
                                (item.size/1024).toFixed(0)
                                }}KB</div>
                        </div>
                        <el-button size="small" icon="Download" circle />
                    </div>
                    <div v-if="store.firmwareArtifacts.length === 0" class="empty-history">
                        暂无构建记录
                    </div>
                </div>
            </div>

        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStudioStore } from '@/stores/studioStore';
import { UploadFilled, Document, Upload, Box, Download } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const activeTab = ref('generate');
const sdkVersion = ref('3.8.2');
const uploadedFile = ref<UploadFile | null>(null);

const colors = [
    { color: '#10b981', percentage: 70 },
    { color: '#e6a23c', percentage: 90 },
    { color: '#f56c6c', percentage: 100 },
];

const handleGenerate = async () => {
    await store.generateFirmware();
    ElMessage.success('固件生成成功');
};

const handleFileChange = (file: UploadFile) => {
    uploadedFile.value = file;
};

const confirmUpload = async () => {
    if (uploadedFile.value?.raw) {
        await store.uploadFirmware(uploadedFile.value.raw);
        uploadedFile.value = null;
        ElMessage.success('固件上传成功');
    }
};
</script>

<style scoped lang="scss">
/* 保持原有样式 */
.drawer-content {
    padding: 0 10px;
}

.section-title {
    font-size: 13px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 12px;
    border-left: 3px solid #d4a72c;
    padding-left: 8px;
}

.resource-grid {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;

    .res-card {
        text-align: center;

        .label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 8px;
        }

        .res-val {
            font-size: 14px;
            font-weight: bold;
            color: #303133;
        }

        .detail {
            font-size: 11px;
            color: #909399;
            margin-top: 4px;
            font-family: 'JetBrains Mono';
        }
    }
}

.hint-text {
    font-size: 13px;
    color: #606266;
    margin-bottom: 16px;
    line-height: 1.5;
}

.black-gold-btn {
    background: #1a1a1a;
    border-color: #1a1a1a;
    color: #d4a72c;
    font-weight: 600;

    &:hover {
        opacity: 0.9;
    }
}

.full-width {
    width: 100%;
}

.upload-area {
    padding: 10px 0;

    .file-preview {
        margin-top: 10px;
        background: #f5f7fa;
        padding: 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
    }
}

.history-section {
    margin-top: 24px;
}

.artifact-list {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 8px;
}

.artifact-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;

    &:last-child {
        border-bottom: none;
    }

    .icon-wrap {
        width: 32px;
        height: 32px;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #d4a72c;
        margin-right: 12px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    }

    .info {
        flex: 1;

        .ver {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
        }

        .meta {
            font-size: 11px;
            color: #909399;
            margin-top: 2px;
        }
    }
}

.empty-history {
    text-align: center;
    color: #999;
    padding: 10px;
    font-size: 12px;
}
</style>