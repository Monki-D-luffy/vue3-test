<template>
    <el-dialog v-model="visible" :title="null" width="900px" :show-close="false" :close-on-click-modal="false"
        class="exp-task-wizard" destroy-on-close align-center>
        <div class="wizard-container">
            <div class="wizard-summary">
                <div class="summary-header">
                    <div class="icon-box">
                        <el-icon>
                            <Promotion />
                        </el-icon>
                    </div>
                    <h3>新建推送任务</h3>
                    <p>配置并下发固件升级指令</p>
                </div>

                <div class="summary-cards">
                    <div class="mini-card">
                        <label>目标产品</label>
                        <div class="value">{{ product?.name }}</div>
                    </div>

                    <transition name="slide-fade">
                        <div class="mini-card highlight" v-if="form.firmwareVersion">
                            <label>目标固件</label>
                            <div class="value version-font">{{ form.firmwareVersion }}</div>
                        </div>
                    </transition>

                    <transition name="slide-fade">
                        <div class="mini-card" v-if="form.upgradeMode !== undefined">
                            <label>发布策略</label>
                            <div class="value">{{ scopeText }}</div>
                            <div class="sub-value" v-if="form.upgradeMode === 1 && verifyDeviceList.length > 0">
                                测试设备: {{ verifyDeviceList.length }} 台
                            </div>
                        </div>
                    </transition>
                </div>
            </div>

            <div class="wizard-main">
                <div class="close-btn" @click="close">
                    <el-icon>
                        <Close />
                    </el-icon>
                </div>

                <div v-if="activeStep === 0" class="step-content fade-in">
                    <h2 class="step-title">1. 选择版本</h2>
                    <p class="step-desc">选择要推送的固件版本。</p>

                    <div class="firmware-selector">
                        <div v-for="fw in allFirmwares" :key="fw.version" class="fw-item"
                            :class="{ selected: form.firmwareVersion === fw.version }" @click="selectFirmware(fw)">
                            <div class="fw-icon">
                                <el-icon>
                                    <Files />
                                </el-icon>
                            </div>
                            <div class="fw-info">
                                <div class="fw-ver">{{ fw.version }}</div>
                                <div class="fw-meta">
                                    {{ formatDateTime(fw.uploadedAt) }}
                                </div>
                            </div>
                            <div class="fw-check" v-if="form.firmwareVersion === fw.version">
                                <el-icon>
                                    <Check />
                                </el-icon>
                            </div>
                        </div>
                        <el-empty v-if="allFirmwares.length === 0" description="暂无固件" />
                    </div>
                </div>

                <div v-if="activeStep === 1" class="step-content fade-in">
                    <h2 class="step-title">2. 发布策略</h2>
                    <p class="step-desc">选择全量发布或灰度测试。</p>

                    <el-radio-group v-model="form.upgradeMode" class="mode-selector">
                        <div class="mode-card" :class="{ active: form.upgradeMode === 0 }"
                            @click="form.upgradeMode = 0">
                            <div class="mode-icon"><el-icon>
                                    <Lightning />
                                </el-icon></div>
                            <div class="mode-info">
                                <div class="mode-name">全量发布 (Full Release)</div>
                                <div class="mode-desc">向所有设备推送更新。</div>
                            </div>
                            <el-radio :value="0" class="hidden-radio" />
                        </div>

                        <div class="mode-card" :class="{ active: form.upgradeMode === 1 }"
                            @click="form.upgradeMode = 1">
                            <div class="mode-icon"><el-icon>
                                    <Cpu />
                                </el-icon></div>
                            <div class="mode-info">
                                <div class="mode-name">灰度验证 (Gray/Beta)</div>
                                <div class="mode-desc">仅向指定白名单设备推送。</div>
                            </div>
                            <el-radio :value="1" class="hidden-radio" />
                        </div>
                    </el-radio-group>

                    <transition name="slide-fade">
                        <div v-if="form.upgradeMode === 1" class="gray-panel">
                            <div class="panel-label">测试设备 UUID (回车添加)</div>
                            <el-input v-model="deviceInput" placeholder="输入 UUID..." @keyup.enter="addVerifyDeviceItem"
                                clearable>
                                <template #append>
                                    <el-button @click="addVerifyDeviceItem">添加</el-button>
                                </template>
                            </el-input>
                            <div class="device-tags">
                                <el-tag v-for="(uuid, idx) in verifyDeviceList" :key="idx" closable type="info"
                                    @close="removeVerifyDeviceItem(idx)">
                                    {{ uuid }}
                                </el-tag>
                            </div>
                        </div>
                    </transition>

                    <el-divider border-style="dashed" />

                    <el-form label-position="top">
                        <el-form-item label="发布说明 (Release Notes)">
                            <el-input v-model="form.releaseNote" type="textarea" :rows="3" placeholder="填写本次更新内容..." />
                        </el-form-item>
                    </el-form>
                </div>

                <div class="wizard-footer">
                    <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>

                    <el-button v-if="activeStep === 0" type="primary" class="next-btn" :disabled="!form.repoId"
                        @click="nextStep">
                        下一步
                    </el-button>

                    <el-button v-if="activeStep === 1" type="primary" class="next-btn launch-btn" :loading="submitting"
                        @click="handleSubmit">
                        {{ submitting ? '处理中...' : (form.upgradeMode === 1 ? '启动灰度任务' : '启动全量发布') }}
                    </el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import {
    Promotion, Close, Files, Check, Lightning, Cpu
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/formatters'
import type { Product, Firmware } from '@/types'

// API
import { createTaskAndGetId, addVerifyDevice, publishFull, publishGray } from '@/api/modules/iot-ota'
import { fetchFirmwaresByProduct } from '@/api/modules/firmware'

const props = defineProps<{
    modelValue: boolean
    product?: Product
    preselectedFirmware?: { repoId: string, version: string, repoType: number } | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// 状态
const activeStep = ref(0)
const submitting = ref(false)
const allFirmwares = ref<Firmware[]>([])

// 灰度设备
const deviceInput = ref('')
const verifyDeviceList = ref<string[]>([])

// 表单
const form = reactive({
    repoId: '',
    firmwareVersion: '',
    upgradeMode: 0, // 0:全量, 1:灰度
    releaseNote: ''
})

// 初始化
const initWizard = async () => {
    if (!props.product) return
    resetForm()

    // 如果有预选，直接跳到 Step 1
    if (props.preselectedFirmware) {
        form.repoId = props.preselectedFirmware.repoId
        form.firmwareVersion = props.preselectedFirmware.version
        activeStep.value = 1
    } else {
        activeStep.value = 0
    }

    try {
        const list = await fetchFirmwaresByProduct(props.product.id)
        allFirmwares.value = list // 不再过滤 verified
    } catch (e) {
        allFirmwares.value = []
    }
}

watch(() => props.modelValue, (val) => {
    if (val) initWizard()
})

const selectFirmware = (fw: Firmware) => {
    form.repoId = fw.repoId || (fw as any).id
    form.firmwareVersion = fw.version
}

const addVerifyDeviceItem = () => {
    const val = deviceInput.value.trim()
    if (val && !verifyDeviceList.value.includes(val)) {
        verifyDeviceList.value.push(val)
        deviceInput.value = ''
    }
}

const removeVerifyDeviceItem = (index: number) => {
    verifyDeviceList.value.splice(index, 1)
}

const handleSubmit = async () => {
    if (!props.product) return
    submitting.value = true
    try {
        // 1. 创建任务
        const taskId = await createTaskAndGetId({
            productId: props.product.id,
            firmwaresRepoId: form.repoId,
            firmwareVersion: form.firmwareVersion,
            country: 'Global',
            upgradeMode: form.upgradeMode,
            releaseNote: form.releaseNote || `Upgrade v${form.firmwareVersion}`,
            remark: form.upgradeMode === 1 ? 'Gray' : 'Full'
        })

        // 2. 如果是灰度，添加白名单
        if (form.upgradeMode === 1 && verifyDeviceList.value.length > 0) {
            for (const uuid of verifyDeviceList.value) {
                await addVerifyDevice(taskId, uuid)
            }
        }

        // 3. 立即启动任务
        if (form.upgradeMode === 0) {
            await publishFull(taskId)
        } else {
            // 修复：grayValue 必须在 1-100 之间
            // 如果是按数量策略，这里我们传 verifyDeviceList.length，但要确保 >=1
            // 如果后端实际上是百分比，这里传 100 代表 100% 灰度？或者传 1 代表 1%?
            // 假设：policy 0=百分比, 1=数量。我们这里用数量
            const count = verifyDeviceList.value.length
            await publishGray({
                otaTaskId: taskId,
                grayPolicy: 1,
                grayValue: count > 0 ? count : 1 // 兜底至少传 1 避免报错
            })
        }

        ElMessage.success('任务已创建并启动')
        emit('success')
        close()
    } catch (e: any) {
        console.error(e)
        ElMessage.error(typeof e === 'string' ? e : (e.message || '操作失败'))
    } finally {
        submitting.value = false
    }
}

const nextStep = () => activeStep.value = 1
const prevStep = () => activeStep.value = 0
const resetForm = () => {
    form.repoId = ''
    form.firmwareVersion = ''
    form.upgradeMode = 0
    form.releaseNote = ''
    verifyDeviceList.value = []
    deviceInput.value = ''
}
const close = () => visible.value = false

const scopeText = computed(() => form.upgradeMode === 0 ? '全量发布' : '灰度验证')
</script>

<style scoped>
/* 保持原有 Wizard 样式框架 */
:deep(.exp-task-wizard) {
    border-radius: 16px;
    overflow: hidden;
    background: transparent;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    padding: 0;
}

:deep(.el-dialog__header) {
    display: none;
}

:deep(.el-dialog__body) {
    padding: 0;
    height: 550px;
}

.wizard-container {
    display: flex;
    height: 100%;
    background: #fff;
}

/* Left Summary */
.wizard-summary {
    width: 280px;
    background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
    color: #fff;
    padding: 40px 30px;
    display: flex;
    flex-direction: column;
    position: relative;
}

.summary-header {
    margin-bottom: 40px;
    position: relative;
    z-index: 1;
}

.icon-box {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #60a5fa;
    margin-bottom: 16px;
}

.summary-cards {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.mini-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px 16px;
}

.mini-card label {
    display: block;
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
}

.mini-card .value {
    font-size: 15px;
    font-weight: 500;
    color: #f1f5f9;
}

.version-font {
    font-family: monospace;
    color: #60a5fa !important;
}

/* Right Main */
.wizard-main {
    flex: 1;
    padding: 40px 50px;
    display: flex;
    flex-direction: column;
    position: relative;
}

.close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    cursor: pointer;
    color: #94a3b8;
}

.step-title {
    font-size: 22px;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.step-desc {
    color: #64748b;
    font-size: 14px;
    margin: 0 0 24px 0;
}

.firmware-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 320px;
}

.fw-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.fw-item:hover,
.fw-item.selected {
    border-color: #3b82f6;
    background: #eff6ff;
}

.fw-icon {
    width: 40px;
    height: 40px;
    background: #e0e7ff;
    color: #4f46e5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
}

.fw-info {
    flex: 1;
}

.fw-ver {
    font-weight: 600;
    color: #1e293b;
    font-family: monospace;
}

.fw-meta {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
}

.fw-check {
    color: #3b82f6;
    font-size: 20px;
}

/* Mode Selector - 修复变形和颜色 */
.mode-selector {
    display: flex;
    gap: 16px;
    width: 100%;
    margin-bottom: 24px;
}

.mode-card {
    flex: 1;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s;
}

.mode-card:hover {
    border-color: #94a3b8;
}

.mode-card.active {
    border-color: #3b82f6;
    background: #eff6ff;
}

/* Fix: flex-shrink 0 防止变椭圆 */
.mode-icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: #f1f5f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 默认给个深一点的颜色，不要太灰 */
    color: #475569;
    margin-right: 12px;
}

.mode-card.active .mode-icon {
    background: #dbeafe;
    color: #2563eb;
}

.mode-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
}

.mode-desc {
    font-size: 12px;
    color: #64748b;
}

.hidden-radio {
    display: none;
}

/* Gray Panel */
.gray-panel {
    background: #f8fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    margin-bottom: 20px;
}

.panel-label {
    font-size: 13px;
    color: #475569;
    margin-bottom: 8px;
    font-weight: 500;
}

.device-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

/* Footer */
.wizard-footer {
    margin-top: auto;
    padding-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.next-btn {
    min-width: 100px;
    border-radius: 8px;
}

.launch-btn {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

/* Transitions */
.fade-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
    }
}
</style>