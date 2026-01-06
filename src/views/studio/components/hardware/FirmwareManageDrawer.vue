<template>
    <el-drawer v-model="visible" title="固件交付中心" direction="rtl" size="560px" class="studio-drawer black-gold-drawer"
        :before-close="handleClose">
        <template #header>
            <div class="custom-header">
                <div class="header-main">
                    <el-icon class="gold-icon">
                        <Cpu />
                    </el-icon>
                    <span class="title-text">固件交付 <span class="gold-text">中心</span></span>
                </div>
                <div class="header-sub">FIRMWARE DELIVERY CENTER</div>
            </div>
        </template>

        <div class="drawer-content">
            <div class="resource-dashboard">
                <div class="res-card dark-card">
                    <div class="card-header">
                        <span class="label">RAM 内存占用</span>
                        <span class="val-text">{{ store.resourceAnalysis.ramUsageKB }} <span
                                class="unit">KB</span></span>
                    </div>
                    <el-progress :percentage="store.resourceAnalysis.ramPercentage" :stroke-width="8" :show-text="false"
                        color="#d4a72c" class="gold-progress" />
                    <div class="res-footer">
                        <span>负载风险:</span>
                        <span :class="['risk-tag', store.resourceAnalysis.riskLevel]">
                            {{ getRiskLabel(store.resourceAnalysis.riskLevel) }}
                        </span>
                    </div>
                </div>
                <div class="res-card dark-card">
                    <div class="card-header">
                        <span class="label">Flash 存储占用</span>
                        <span class="val-text">{{ (store.resourceAnalysis.flashUsageKB / 1024).toFixed(1) }} <span
                                class="unit">MB</span></span>
                    </div>
                    <el-progress :percentage="store.resourceAnalysis.flashPercentage" :stroke-width="8"
                        :show-text="false" color="#d4a72c" class="gold-progress" />
                    <div class="res-footer">
                        <span class="mono-font">已用空间 {{ store.resourceAnalysis.flashPercentage }}%</span>
                    </div>
                </div>
            </div>

            <div class="operation-tabs">
                <el-tabs v-model="activeTab" class="gold-tabs">
                    <el-tab-pane name="link">
                        <template #label>
                            <span class="tab-label"><el-icon>
                                    <Link />
                                </el-icon> 关联固件库 (Link)</span>
                        </template>
                        <div class="tab-content">
                            <div class="link-wrapper">
                                <div class="hint-text">从企业固件库中选择已发布的成熟固件，关联到当前产品。</div>
                                <div class="input-group full">
                                    <div class="input-label">选择固件版本 <span class="required">*</span></div>
                                    <el-select v-model="selectedLibraryFirmwareId" class="geek-select"
                                        popper-class="geek-select-popper" placeholder="请选择标准固件..."
                                        @change="handleLibFirmwareChange">
                                        <el-option v-for="fw in libraryFirmwares" :key="fw.id" :label="fw.name"
                                            :value="fw.id">
                                            <div class="fw-option-item">
                                                <span class="fw-name">{{ fw.name }}</span>
                                                <span class="fw-ver">v{{ fw.version }}</span>
                                            </div>
                                        </el-option>
                                    </el-select>
                                </div>
                                <transition name="el-zoom-in-top">
                                    <div v-if="currentLibFirmware" class="firmware-detail-card">
                                        <div class="detail-row"><span class="label">固件版本:</span><span
                                                class="value mono">v{{
                                                    currentLibFirmware.version }}</span></div>
                                        <div class="detail-row"><span class="label">适用芯片:</span><span class="value">{{
                                            currentLibFirmware.chip }}</span></div>
                                        <div class="detail-row"><span class="label">内核 SDK:</span><span class="value">{{
                                            currentLibFirmware.sdk }}</span></div>
                                        <div class="detail-desc">{{ currentLibFirmware.description }}</div>
                                        <button class="cyber-btn small mt-4" @click="confirmLinkFirmware">
                                            <el-icon>
                                                <Connection />
                                            </el-icon> 确认关联此固件
                                        </button>
                                    </div>
                                </transition>
                                <div v-if="!currentLibFirmware" class="empty-select-state">
                                    <el-icon class="empty-icon">
                                        <Box />
                                    </el-icon><span>请先选择一个固件</span>
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane name="upload">
                        <template #label>
                            <span class="tab-label"><el-icon>
                                    <Upload />
                                </el-icon> 本地上传 (Upload)</span>
                        </template>
                        <div class="upload-wrapper">
                            <el-upload v-if="!uploadedFile" class="geek-uploader" drag action="#" :auto-upload="false"
                                :on-change="handleFileChange" :show-file-list="false">
                                <div class="upload-placeholder">
                                    <el-icon class="up-icon">
                                        <UploadFilled />
                                    </el-icon>
                                    <div class="up-text">拖拽 .bin 固件到此处</div>
                                </div>
                            </el-upload>
                            <div v-else class="upload-form-card">
                                <div class="file-info-row">
                                    <el-icon class="f-icon">
                                        <Document />
                                    </el-icon>
                                    <div class="f-name">{{ uploadedFile.name }}</div>
                                    <div class="f-size">{{ (uploadedFile.size! / 1024).toFixed(1) }} KB</div>
                                    <el-icon class="close-btn" @click="resetUpload">
                                        <Close />
                                    </el-icon>
                                </div>
                                <el-divider class="form-divider" />
                                <div class="form-grid">
                                    <div class="input-group">
                                        <div class="input-label">固件版本号 <span class="required">*</span></div>
                                        <el-input v-model="uploadForm.version" class="geek-input"
                                            placeholder="例如: 1.0.1"><template #prefix>v</template></el-input>
                                    </div>
                                    <div class="input-group">
                                        <div class="input-label">备注说明</div>
                                        <el-input v-model="uploadForm.note" class="geek-input" placeholder="备注..." />
                                    </div>
                                </div>
                                <div class="action-row">
                                    <el-button class="cancel-btn" @click="resetUpload" text>取消</el-button>
                                    <button class="cyber-btn small" @click="confirmUpload"><el-icon>
                                            <Check />
                                        </el-icon> 确认入库</button>
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <div class="history-panel">
                <div class="panel-header">
                    <span class="ph-title">已关联/上传的固件 (HISTORY)</span>
                    <span class="ph-count">{{ store.firmwareArtifacts.length }} 个版本</span>
                </div>
                <el-scrollbar max-height="220px">
                    <div class="artifact-list">
                        <div v-for="item in store.firmwareArtifacts" :key="item.id" class="artifact-item">
                            <div class="status-bar" :class="item.source"></div>
                            <div class="info-col main">
                                <div class="ver-code">v{{ item.version }}</div>
                                <div class="ver-note text-ellipsis">{{ item.description || '无备注' }}</div>
                            </div>
                            <div class="info-col meta">
                                <div class="date-tag">{{ formatTime(item.createdAt) }}</div>
                                <div class="source-tag" :class="item.source">{{ getSourceLabel(item.source) }}</div>
                            </div>
                            <div class="action-col">
                                <button class="icon-btn" title="下载" @click="handleDownload(item)"><el-icon>
                                        <Download />
                                    </el-icon></button>
                                <el-popconfirm title="确定删除?" width="160" confirm-button-text="是" cancel-button-text="否"
                                    icon="InfoFilled" icon-color="#f56c6c" @confirm="handleDelete(item.id)">
                                    <template #reference>
                                        <button class="icon-btn delete" title="删除"><el-icon>
                                                <Delete />
                                            </el-icon></button>
                                    </template>
                                </el-popconfirm>
                            </div>
                        </div>
                        <div v-if="store.firmwareArtifacts.length === 0" class="empty-state">暂无记录</div>
                    </div>
                </el-scrollbar>
            </div>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useStudioStore } from '@/stores/studioStore';
import { Cpu, Link, Check, Upload, UploadFilled, Document, Close, Download, Box, Connection, Delete, InfoFilled } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const handleClose = (done: () => void) => { done(); };
const activeTab = ref('link');

// 关联库逻辑
const selectedLibraryFirmwareId = ref('');
const currentLibFirmware = ref<any>(null);
const libraryFirmwares = [
    { id: 'fw_001', name: 'TuyaOS Standard 3.8.2', version: '3.8.2', chip: 'RTL8720CF', sdk: 'TuyaOS 3.8.2', date: '2023-10-15', description: '官方推荐标准固件' },
    { id: 'fw_002', name: 'FreeRTOS Generic v2.1', version: '2.1.0', chip: 'ESP32-C3', sdk: 'FreeRTOS LTS', date: '2023-09-01', description: '轻量级通用固件' },
    { id: 'fw_003', name: 'Matter Protocol v1.1', version: '1.1.0', chip: 'BK7231N', sdk: 'Matter SDK v1.1', date: '2023-11-20', description: 'Matter 协议专用' }
];

const handleLibFirmwareChange = (val: string) => {
    currentLibFirmware.value = libraryFirmwares.find(f => f.id === val) || null;
};

const confirmLinkFirmware = async () => {
    if (!currentLibFirmware.value) return;
    await store.generateFirmware({
        version: currentLibFirmware.value.version,
        description: `[关联] ${currentLibFirmware.value.description}`
    });
    const latest = store.latestFirmware;
    if (latest) {
        latest.source = 'linked';
        latest.name = currentLibFirmware.value.name;
    }
    ElMessage.success(`成功关联固件 v${currentLibFirmware.value.version}`);
    selectedLibraryFirmwareId.value = '';
    currentLibFirmware.value = null;
};

// 上传逻辑
const uploadedFile = ref<UploadFile | null>(null);
const uploadForm = reactive({ version: '', note: '' });

const handleFileChange = (file: UploadFile) => {
    uploadedFile.value = file;
    const match = file.name.match(/v?(\d+\.\d+\.\d+)/);
    if (match) uploadForm.version = match[1] ?? '';
};

const resetUpload = () => {
    uploadedFile.value = null;
    uploadForm.version = '';
    uploadForm.note = '';
};

const confirmUpload = async () => {
    if (!uploadForm.version) return ElMessage.warning('必须填写固件版本号');
    if (uploadedFile.value?.raw) {
        await store.uploadFirmware(uploadedFile.value.raw, {
            version: uploadForm.version,
            description: uploadForm.note || '本地上传固件'
        });
        const latest = store.latestFirmware;
        if (latest) {
            if (latest.version !== uploadForm.version) latest.version = uploadForm.version;
            latest.source = 'uploaded';
            if (uploadForm.note) latest.description = uploadForm.note;
        }
        ElMessage.success('固件已成功入库');
        resetUpload();
    }
};

const handleDownload = (item: any) => { ElMessage.success(`开始下载 ${item.name}`); };
const handleDelete = (id: string) => {
    store.deleteFirmware(id);
    ElMessage.success('固件记录已删除');
};

const formatTime = (ts: number) => new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const getRiskLabel = (level: string) => ({ safe: '安全', warning: '警告', critical: '严重' }[level] || level);
const getSourceLabel = (source: string) => ({ uploaded: '本地上传', linked: '官方库' }[source] || '在线构建');
</script>

<style scoped lang="scss">
/* 保持你原有的黑金样式，这里只列出变更的 */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
$gold: #d4a72c;
$card-bg: #262626;
$text-main: #e0e0e0;
$text-sub: #8c8c8c;

.drawer-content {
    padding: 20px 24px;
    color: $text-main;
    font-family: 'Inter', sans-serif;
}

.custom-header {
    .header-main {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        font-weight: 800;
        color: #1a1a1a;

        .gold-icon {
            color: $gold;
            font-size: 24px;
        }

        .gold-text {
            color: $gold;
        }
    }

    .header-sub {
        margin-left: 36px;
        font-size: 12px;
        color: #909399;
        font-weight: 600;
    }
}

.resource-dashboard {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;

    .res-card {
        flex: 1;
        background: $card-bg;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #333;

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 12px;

            .label {
                font-size: 12px;
                color: $text-sub;
            }

            .val-text {
                font-family: 'JetBrains Mono';
                font-size: 18px;
                font-weight: 700;
                color: #fff;

                .unit {
                    font-size: 12px;
                    color: $gold;
                }
            }
        }

        .res-footer {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: $text-sub;

            .risk-tag {
                font-weight: 700;

                &.safe {
                    color: #67c23a;
                }

                &.warning {
                    color: $gold;
                }

                &.critical {
                    color: #f56c6c;
                }
            }
        }
    }
}

.link-wrapper {
    padding: 8px 0;

    .hint-text {
        font-size: 12px;
        color: #606266;
        margin-bottom: 16px;
    }
}

.input-group {
    margin-bottom: 16px;

    &.full {
        width: 100%;
    }

    .input-label {
        font-size: 12px;
        font-weight: 700;
        color: #303133;
        margin-bottom: 8px;

        .required {
            color: #f56c6c;
        }
    }
}

.firmware-detail-card {
    background: #fdfdfd;
    border: 1px solid #e4e7ed;
    border-left: 3px solid $gold;
    border-radius: 4px;
    padding: 16px;
    margin-top: 20px;

    .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;

        .label {
            color: #909399;
        }

        .value {
            font-weight: 600;
            color: #303133;

            &.mono {
                font-family: 'JetBrains Mono';
                color: $gold;
            }
        }
    }

    .detail-desc {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #ebeef5;
        font-size: 11px;
        color: #606266;
    }

    .mt-4 {
        margin-top: 16px;
    }
}

.empty-select-state {
    margin-top: 30px;
    text-align: center;
    color: #ccc;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .empty-icon {
        font-size: 32px;
    }

    font-size: 12px;
}

.fw-option-item {
    display: flex;
    justify-content: space-between;
    width: 100%;

    .fw-name {
        font-weight: 500;
    }

    .fw-ver {
        color: #909399;
        font-family: 'JetBrains Mono';
        font-size: 12px;
    }
}

.cyber-btn {
    width: 100%;
    height: 48px;
    background: #000;
    border: 1px solid $gold;
    color: $gold;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;

    &:hover {
        background: $gold;
        color: #000;
        box-shadow: 0 0 15px rgba($gold, 0.4);
    }

    &.small {
        height: 36px;
        font-size: 12px;
    }
}

.geek-uploader :deep(.el-upload-dragger) {
    background: #fcfcfc;
    border: 2px dashed #dcdfe6;
    padding: 30px 0;

    &:hover {
        border-color: $gold;
        background: #fffbf0;
    }
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;

    .up-icon {
        font-size: 32px;
        color: #c0c4cc;
        margin-bottom: 8px;
    }

    .up-text {
        font-size: 12px;
        font-weight: 700;
        color: #606266;
    }
}

.upload-form-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-top: 3px solid $gold;
    border-radius: 4px;
    padding: 16px;

    .file-info-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .f-icon {
            color: $gold;
            font-size: 20px;
        }

        .f-name {
            flex: 1;
            font-weight: 700;
            font-size: 13px;
            color: #333;
            font-family: 'JetBrains Mono';
        }

        .f-size {
            font-size: 11px;
            color: #999;
        }

        .close-btn {
            cursor: pointer;
            color: #ccc;

            &:hover {
                color: #f56c6c;
            }
        }
    }

    .form-divider {
        margin: 12px 0;
    }

    .action-row {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
    }

    .cancel-btn {
        color: #909399;
        font-size: 12px;
    }
}

.history-panel {
    margin-top: 40px;
    border-top: 1px dashed #e0e0e0;
    padding-top: 20px;

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .ph-title {
            font-size: 12px;
            font-weight: 700;
            color: #303133;
        }

        .ph-count {
            font-size: 10px;
            color: #909399;
            background: #f0f2f5;
            padding: 2px 6px;
            border-radius: 4px;
        }
    }
}

.artifact-item {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid #ebeef5;
    padding: 10px 12px;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    margin-bottom: 8px;
    transition: all 0.2s;

    &:hover {
        border-color: rgba($gold, 0.5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .status-bar {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #dcdfe6;

        &.uploaded {
            background: #409eff;
        }

        &.linked {
            background: #67c23a;
        }
    }

    .info-col {
        display: flex;
        flex-direction: column;

        &.main {
            flex: 1;
            margin-left: 8px;

            .ver-code {
                font-family: 'JetBrains Mono';
                font-weight: 700;
                font-size: 13px;
                color: #1a1a1a;
            }

            .ver-note {
                font-size: 11px;
                color: #999;
                margin-top: 2px;
            }
        }

        &.meta {
            align-items: flex-end;
            margin-right: 16px;

            .date-tag {
                font-size: 10px;
                color: #909399;
            }

            .source-tag {
                font-size: 9px;
                padding: 1px 4px;
                border-radius: 2px;
                margin-top: 2px;

                &.uploaded {
                    background: #ecf5ff;
                    color: #409eff;
                }

                &.linked {
                    background: #f0f9eb;
                    color: #67c23a;
                }
            }
        }
    }

    .icon-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: #909399;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
            background: #f5f7fa;
            color: $gold;
        }

        &.delete:hover {
            background: #1a1a1a;
            color: #f56c6c;
            box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
        }
    }
}

.empty-state {
    text-align: center;
    font-size: 12px;
    color: #ccc;
    padding: 20px 0;
    border: 1px dashed #ebeef5;
    border-radius: 4px;
}

:deep(.geek-input .el-input__wrapper),
:deep(.geek-select .el-select__wrapper) {
    background-color: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 0;
    box-shadow: none;

    &.is-focus,
    &:hover {
        border-color: $gold !important;
        box-shadow: inset 3px 0 0 $gold !important;
    }
}

:deep(.geek-input .el-input__inner) {
    font-family: 'JetBrains Mono';
    font-weight: 600;
    color: #303133;
}

:deep(.gold-tabs) {
    .el-tabs__nav-wrap::after {
        background-color: transparent;
    }

    .el-tabs__active-bar {
        background-color: $gold;
        height: 3px;
    }

    .el-tabs__item {
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: #909399;

        &.is-active {
            color: #303133;
        }

        &:hover {
            color: $gold;
        }
    }
}
</style>