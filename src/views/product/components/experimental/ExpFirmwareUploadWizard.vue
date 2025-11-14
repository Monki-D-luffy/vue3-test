<template>
    <el-dialog v-model="visible" :title="null" width="720px" :show-close="!uploading" :close-on-click-modal="false"
        class="exp-upload-dialog" destroy-on-close align-center>
        <div class="wizard-layout">
            <div class="wizard-sidebar">
                <div class="sidebar-title">上传固件</div>
                <div class="sidebar-steps">
                    <div v-for="(step, index) in steps" :key="index" class="step-item" :class="{
                        'active': activeStep === index,
                        'completed': activeStep > index
                    }">
                        <div class="step-indicator">
                            <span class="icon-box" v-if="activeStep > index">
                                <el-icon>
                                    <Check />
                                </el-icon>
                            </span>
                            <span v-else class="step-num">{{ index + 1 }}</span>
                        </div>
                        <span class="step-label">{{ step.title }}</span>
                        <div class="step-line" v-if="index < steps.length - 1"></div>
                    </div>
                </div>

                <div class="sidebar-footer">
                    <div class="product-badge">
                        <el-icon>
                            <Cpu />
                        </el-icon>
                        <span>{{ product?.name }}</span>
                    </div>
                </div>
            </div>

            <div class="wizard-content">

                <div v-if="activeStep === 0" class="content-pane fade-in">
                    <div class="pane-body">
                        <div class="pane-header">
                            <h3>上传固件文件</h3>
                            <p>支持 .bin, .hex 格式，最大 50MB</p>
                        </div>

                        <div class="upload-zone" :class="{ 'has-file': selectedFile }" @dragover.prevent
                            @drop.prevent="handleDrop">
                            <input type="file" ref="fileInput" class="hidden-input" accept=".bin,.hex"
                                @change="handleFileChange" />

                            <div class="zone-content" v-if="!selectedFile" @click="triggerSelect">
                                <div class="upload-icon-box">
                                    <el-icon class="upload-icon">
                                        <UploadFilled />
                                    </el-icon>
                                </div>
                                <div class="upload-text">
                                    <span class="highlight">点击选择</span> 或拖拽文件至此
                                </div>
                            </div>

                            <div class="file-preview" v-else>
                                <div class="file-icon-large">
                                    <el-icon>
                                        <Document />
                                    </el-icon>
                                </div>
                                <div class="file-info">
                                    <div class="file-name">{{ selectedFile.name }}</div>
                                    <div class="file-size">{{ formatSize(selectedFile.size) }}</div>
                                </div>
                                <el-button circle type="danger" plain size="small" @click="removeFile">
                                    <el-icon>
                                        <Close />
                                    </el-icon>
                                </el-button>
                            </div>
                        </div>
                    </div>

                    <div class="pane-footer">
                        <el-button class="cancel-btn" @click="closeDialog">取消</el-button>
                        <el-button type="primary" class="next-btn" :disabled="!selectedFile" @click="nextStep">
                            下一步 <el-icon class="el-icon--right">
                                <ArrowRight />
                            </el-icon>
                        </el-button>
                    </div>
                </div>

                <div v-if="activeStep === 1" class="content-pane fade-in">
                    <div class="pane-body">
                        <div class="pane-header">
                            <h3>版本详情</h3>
                            <p>请完善该固件版本的发布信息</p>
                        </div>

                        <el-form :model="form" label-position="top" class="custom-form">
                            <el-form-item label="版本号 (Version)">
                                <el-input v-model="form.version" placeholder="例如: v1.2.0" class="tech-input">
                                    <template #prefix>v</template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="发布说明 (Release Notes)">
                                <el-input v-model="form.note" type="textarea" :rows="5" placeholder="描述本次更新的主要内容..."
                                    class="tech-textarea" resize="none" />
                            </el-form-item>
                        </el-form>
                    </div>

                    <div class="pane-footer">
                        <el-button class="cancel-btn" @click="prevStep">上一步</el-button>
                        <el-button type="primary" class="next-btn upload-btn" :disabled="!form.version"
                            :loading="uploading" @click="startUpload">
                            {{ uploading ? '上传中...' : '开始上传' }}
                            <el-icon v-if="!uploading" class="el-icon--right">
                                <Upload />
                            </el-icon>
                        </el-button>
                    </div>
                </div>

                <div v-if="activeStep === 2" class="content-pane center-pane fade-in">
                    <div v-if="uploading" class="progress-view">
                        <div class="radar-spinner"></div>
                        <h3 class="status-title">正在上传固件...</h3>
                        <p class="status-desc">正在安全传输数据，请勿关闭窗口</p>
                        <div class="progress-bar-container">
                            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                        </div>
                        <div class="progress-text">{{ progress }}%</div>
                    </div>

                    <div v-else class="result-view">
                        <div class="success-icon-box">
                            <el-icon><Select /></el-icon>
                        </div>
                        <h3 class="status-title success">上传成功!</h3>
                        <p class="status-desc">版本 {{ form.version }} 已成功入库</p>
                        <el-button type="primary" class="finish-btn" @click="handleSuccess">
                            完成并关闭
                        </el-button>
                    </div>
                </div>

            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
    UploadFilled, Document, Close, ArrowRight, Check,
    Upload, Select, Cpu
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'
import { uploadFirmware } from '@/api' // 修复3：引入真实 API

const props = defineProps<{
    modelValue: boolean
    product?: Product
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// 状态管理
const activeStep = ref(0)
const steps = [
    { title: '选择文件' },
    { title: '版本信息' },
    { title: '上传确认' }
]

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const form = reactive({
    version: '',
    note: ''
})

const uploading = ref(false)
const progress = ref(0)

// 辅助函数
const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const triggerSelect = () => fileInput.value?.click()

const handleFileChange = (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files[0]) processFile(files[0])
}

const handleDrop = (e: DragEvent) => {
    const files = e.dataTransfer?.files
    if (files && files[0]) processFile(files[0])
}

const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['bin', 'hex'].includes(ext || '')) {
        ElMessage.warning('仅支持 .bin 或 .hex 格式文件')
        return
    }
    if (file.size > 50 * 1024 * 1024) {
        ElMessage.warning('文件大小不能超过 50MB')
        return
    }
    selectedFile.value = file
}

const removeFile = () => {
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
}

const nextStep = () => {
    if (activeStep.value < 2) activeStep.value++
}

const prevStep = () => {
    if (activeStep.value > 0) activeStep.value--
}

// 修复3：真实上传逻辑
const startUpload = async () => {
    if (!selectedFile.value || !props.product) return

    activeStep.value = 2
    uploading.value = true
    progress.value = 0

    // 模拟进度条动画 (为了视觉体验)
    const timer = setInterval(() => {
        if (progress.value < 90) {
            progress.value += Math.floor(Math.random() * 15)
        }
    }, 200)

    try {
        // 构造真实数据
        // 注意：如果是真实文件上传，通常用 FormData，这里假设 mock-server 接受 JSON 或我们模拟延迟
        // 为了适配你的 mock-server，我们构建一个对象
        const payload = {
            productId: props.product.id,
            productName: props.product.name,
            version: form.version.startsWith('v') ? form.version : `v${form.version}`,
            releaseNotes: form.note,
            fileUrl: `http://oss.iot.com/firmware/${selectedFile.value.name}`, // 模拟回传地址
            uploadedAt: new Date().toISOString(),
            verified: false // 默认未验证
        }

        // 调用 API
        await uploadFirmware(payload)

        // 完成进度条
        clearInterval(timer)
        progress.value = 100
        setTimeout(() => {
            uploading.value = false
            // 此时不关闭，等待用户点击“完成”
        }, 500)

    } catch (error) {
        clearInterval(timer)
        uploading.value = false
        activeStep.value = 1 // 回退到上一步
        ElMessage.error('上传失败，请重试')
    }
}

const handleSuccess = () => {
    // 触发 success 事件，让父组件刷新列表
    emit('success')
    closeDialog()
}

const closeDialog = () => {
    visible.value = false
    setTimeout(() => {
        activeStep.value = 0
        selectedFile.value = null
        form.version = ''
        form.note = ''
        uploading.value = false
        progress.value = 0
    }, 300)
}
</script>

<style scoped>
/* --- 弹窗整体布局 --- */
:deep(.exp-upload-dialog) {
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 0;
}

:deep(.exp-upload-dialog .el-dialog__header) {
    display: none;
}

:deep(.exp-upload-dialog .el-dialog__body) {
    padding: 0;
    height: 500px;
    /* 稍微增加高度 */
}

.wizard-layout {
    display: flex;
    height: 100%;
}

/* --- 左侧侧边栏 --- */
.wizard-sidebar {
    width: 220px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
}

.sidebar-title {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 40px;
}

.sidebar-steps {
    flex: 1;
}

.step-item {
    position: relative;
    padding-bottom: 32px;
    display: flex;
    align-items: center;
    /* 改为 center 确保整体垂直对齐 */
    color: #94a3b8;
    transition: all 0.3s;
}

/* 修复1：指示器样式修正 */
.step-indicator {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    z-index: 1;
    transition: all 0.3s;
    flex-shrink: 0;
    /* 防止被压缩 */
}

/* 图标容器：确保 flex 居中 */
.icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.step-num {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    /* 消除字体行高偏差 */
}

.step-line {
    position: absolute;
    left: 14px;
    top: 28px;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
}

.step-label {
    font-size: 14px;
    font-weight: 500;
}

.step-item.active {
    color: #3b82f6;
}

.step-item.active .step-indicator {
    border-color: #3b82f6;
    color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.step-item.completed .step-indicator {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
}

.step-item.completed .step-line {
    background: #3b82f6;
}

.product-badge {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.product-badge .el-icon {
    margin-right: 6px;
    color: #3b82f6;
}

/* --- 右侧内容区 (Flex Column) --- */
.wizard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* 关键：垂直布局 */
    position: relative;
}

.content-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 40px;
    height: 100%;
}

.pane-body {
    flex: 1;
    /* 占据中间剩余空间 */
    overflow-y: auto;
    /* 如果内容过多可滚动 */
}

.pane-header h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #1e293b;
}

.pane-header p {
    margin: 0 0 24px 0;
    color: #64748b;
    font-size: 14px;
}

/* 拖拽上传区 */
.upload-zone {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    height: 220px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
}

.upload-zone:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-zone.has-file {
    border-style: solid;
    background: #fff;
    border-color: #e2e8f0;
}

.hidden-input {
    display: none;
}

.upload-icon-box {
    width: 60px;
    height: 60px;
    background: #e0e7ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #4f46e5;
    font-size: 28px;
}

.upload-text {
    color: #64748b;
    font-size: 14px;
    text-align: center;
}

.highlight {
    color: #3b82f6;
    font-weight: 600;
}

/* 文件预览 */
.file-preview {
    display: flex;
    align-items: center;
    padding: 0 20px;
    width: 100%;
}

.file-icon-large {
    font-size: 40px;
    color: #3b82f6;
    margin-right: 16px;
}

.file-info {
    flex: 1;
}

.file-name {
    font-weight: 600;
    color: #1e293b;
}

.file-size {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
}

/* 修复2：底部按钮栏 (沉底布局) */
.pane-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    margin-top: auto;
    /* 关键：自动推到最底部 */
    border-top: 1px solid transparent;
    /* 可选：如果不想要分割线就 transparent */
}

.cancel-btn {
    border: none;
    background: transparent;
    color: #64748b;
}

.cancel-btn:hover {
    background: #f1f5f9;
}

.next-btn {
    background: #1e293b;
    border: none;
    padding: 10px 24px;
    font-weight: 500;
    border-radius: 8px;
}

.next-btn:disabled {
    background: #cbd5e1;
}

.upload-btn {
    background: #3b82f6;
}

.upload-btn:hover {
    background: #2563eb;
}

/* 结果页动画 */
.center-pane {
    align-items: center;
    justify-content: center;
    text-align: center;
}

.progress-view,
.result-view {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.progress-bar-container {
    width: 300px;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    margin: 24px 0;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease-out;
}

.progress-text {
    font-family: monospace;
    color: #3b82f6;
    font-weight: 600;
}

.success-icon-box {
    width: 80px;
    height: 80px;
    background: #dcfce7;
    border-radius: 50%;
    color: #16a34a;
    font-size: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
    0% {
        transform: scale(0);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.fade-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.finish-btn {
    margin-top: 20px;
    width: 160px;
}
</style>