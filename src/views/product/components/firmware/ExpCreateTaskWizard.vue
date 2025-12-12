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
                        <div class="mini-card" v-if="form.targetScope">
                            <label>覆盖范围</label>
                            <div class="value">{{ scopeText }}</div>
                            <div class="sub-value" v-if="estimatedCount !== null">
                                预计影响 <span class="count">{{ estimatedCount }}</span> 台设备
                            </div>
                        </div>
                    </transition>
                </div>

                <div class="summary-footer">
                    <div class="step-dots">
                        <span v-for="i in 3" :key="i" class="dot" :class="{ active: activeStep >= i - 1 }"></span>
                    </div>
                </div>
            </div>

            <div class="wizard-main">
                <div class="close-btn" @click="close">
                    <el-icon>
                        <Close />
                    </el-icon>
                </div>

                <div v-if="activeStep === 0" class="step-content fade-in">
                    <h2 class="step-title">1. 选择要推送的固件</h2>
                    <p class="step-desc">仅显示已通过验证的版本。</p>

                    <div class="firmware-selector">
                        <div v-for="fw in verifiedFirmwares" :key="fw.id" class="fw-item"
                            :class="{ selected: form.firmwareId === fw.id }" @click="selectFirmware(fw)">
                            <div class="fw-icon">
                                <el-icon>
                                    <Files />
                                </el-icon>
                            </div>
                            <div class="fw-info">
                                <div class="fw-ver">{{ fw.version }}</div>
                                <div class="fw-time">{{ formatDateTime(fw.uploadedAt) }}</div>
                            </div>
                            <div class="fw-check" v-if="form.firmwareId === fw.id">
                                <el-icon>
                                    <Check />
                                </el-icon>
                            </div>
                        </div>
                        <el-empty v-if="verifiedFirmwares.length === 0" description="暂无已验证固件，请先去版本库上传并验证" />
                    </div>
                </div>

                <div v-if="activeStep === 1" class="step-content fade-in">
                    <h2 class="step-title">2. 设定升级范围</h2>

                    <el-radio-group v-model="form.targetScope" class="scope-selector">
                        <el-radio-button value="all">全量推送 (All)</el-radio-button>
                        <el-radio-button value="filter">定向筛选 (Filter)</el-radio-button>
                    </el-radio-group>

                    <div v-if="form.targetScope === 'filter'" class="filter-panel">
                        <el-form label-position="top">
                            <el-form-item label="所属数据中心">
                                <el-select v-model="form.filters.dataCenter" placeholder="选择数据中心" clearable>
                                    <el-option label="华东节点 (CN-East)" value="cn-east" />
                                    <el-option label="北美节点 (US-West)" value="us-west" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="在线状态">
                                <el-select v-model="form.filters.status" placeholder="全部" clearable>
                                    <el-option label="仅在线设备" value="online" />
                                </el-select>
                            </el-form-item>
                        </el-form>
                    </div>

                    <div class="impact-preview">
                        <el-button type="info" link :loading="estimating" @click="estimateImpact">
                            <el-icon>
                                <Refresh />
                            </el-icon> 点击重新预估影响范围
                        </el-button>
                    </div>
                </div>

                <div v-if="activeStep === 2" class="step-content fade-in center-align">
                    <div class="confirm-icon">
                        <el-icon>
                            <Lightning />
                        </el-icon>
                    </div>
                    <h2 class="step-title">准备就绪</h2>
                    <p class="step-desc">
                        即将向 <strong>{{ estimatedCount || '若干' }}</strong> 台设备推送
                        <span class="highlight-ver">{{ form.firmwareVersion }}</span>
                    </p>

                    <el-form label-position="top" class="task-name-form">
                        <el-form-item label="任务名称 (可选)">
                            <el-input v-model="form.name" placeholder="默认为：升级 vX.X.X" />
                        </el-form-item>
                    </el-form>

                    <div class="warning-box">
                        <el-icon>
                            <WarningFilled />
                        </el-icon>
                        <span>请确保目标设备处于稳定网络环境，升级过程不可中断。</span>
                    </div>
                </div>

                <div class="wizard-footer">
                    <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>

                    <el-button v-if="activeStep < 2" type="primary" class="next-btn" :disabled="!canProceed"
                        @click="nextStep">
                        下一步
                    </el-button>

                    <el-button v-if="activeStep === 2" type="primary" class="next-btn launch-btn" :loading="submitting"
                        @click="handleSubmit">
                        {{ submitting ? '创建中...' : '立即启动任务' }}
                    </el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import {
    Promotion, Close, Files, Check, Refresh, Lightning, WarningFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/formatters'
import type { Product, Firmware } from '@/types'
// 引入 API (请确保 index.ts 里有这些 Mock 函数，或者自己 mock)
import { fetchFirmwares, estimateUpgradeImpact, createUpgradeCampaign } from '@/api'

const props = defineProps<{
    modelValue: boolean
    product?: Product
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// 状态
const activeStep = ref(0)
const submitting = ref(false)
const estimating = ref(false)
const estimatedCount = ref<number | null>(null)

// 数据源
const verifiedFirmwares = ref<Firmware[]>([])

// 表单数据
const form = reactive({
    name: '',
    firmwareId: '',
    firmwareVersion: '',
    targetScope: 'all' as 'all' | 'filter',
    filters: {
        dataCenter: '',
        status: ''
    }
})

// --- 逻辑控制 ---

// 1. 初始化：获取已验证固件列表
const loadVerifiedFirmwares = async () => {
    if (!props.product) return
    try {
        // 使用 verified: true 直接让后端过滤（如果后端支持），这里为了保险还是保留前端过滤逻辑
        const res = await fetchFirmwares({
            productId: props.product.id,
            _page: 1,      // 修正：通常是 page 而不是 _page
            _limit: 100    // 修正：通常是 limit 而不是 _limit
        })

        let list: Firmware[] = []

        // 兼容性处理：判断 res 是数组还是对象
        if (Array.isArray(res)) {
            list = res
        } else if (res && Array.isArray(res.items)) {
            list = res.items
        } else if (res && Array.isArray(res.list)) {
            // 某些后端习惯用 list
            list = res.list
        }

        // 过滤出已验证的固件
        verifiedFirmwares.value = list.filter((f: any) => f.verified)

    } catch (e) {
        console.error('加载固件列表失败:', e)
        verifiedFirmwares.value = [] // 出错时置空，防止 UI 崩壞
    }
}

watch(() => props.modelValue, (val) => {
    if (val) {
        resetForm()
        loadVerifiedFirmwares()
    }
})

// 2. 选择固件
const selectFirmware = (fw: Firmware) => {
    form.firmwareId = fw.id
    form.firmwareVersion = fw.version
}

// 3. 预估影响
const estimateImpact = async () => {
    if (!props.product) return
    estimating.value = true
    try {
        const res = await estimateUpgradeImpact(
            props.product.id,
            form.firmwareId,
            form.targetScope === 'all' ? {} : form.filters
        )
        estimatedCount.value = res.total
    } catch (e) {
        estimatedCount.value = 0
    } finally {
        estimating.value = false
    }
}

// 监听范围变化，自动触发预估
watch(() => [form.targetScope, form.filters], () => {
    if (activeStep.value === 1) {
        estimateImpact() // 简单防抖可以加在这里
    }
}, { deep: true })

// 4. 提交任务
const handleSubmit = async () => {
    if (!props.product) return
    submitting.value = true
    try {
        const payload = {
            name: form.name || `升级 ${form.firmwareVersion}`,
            productId: props.product.id,
            firmwareId: form.firmwareId,
            firmwareVersion: form.firmwareVersion,
            targetScope: form.targetScope,
            filters: form.filters
        }

        await createUpgradeCampaign(payload)

        ElMessage.success('批量升级任务创建成功！')
        emit('success')
        close()
    } catch (e) {
        ElMessage.error('任务创建失败')
    } finally {
        submitting.value = false
    }
}

// 辅助计算
const scopeText = computed(() => {
    return form.targetScope === 'all' ? '全量推送' : '定向筛选'
})

const canProceed = computed(() => {
    if (activeStep.value === 0) return !!form.firmwareId
    if (activeStep.value === 1) return true // 筛选条件允许为空
    return true
})

const nextStep = () => {
    if (activeStep.value < 2) {
        activeStep.value++
        if (activeStep.value === 1) estimateImpact() // 进入筛选页自动预估
    }
}
const prevStep = () => {
    if (activeStep.value > 0) activeStep.value--
}

const resetForm = () => {
    activeStep.value = 0
    form.firmwareId = ''
    form.firmwareVersion = ''
    form.name = ''
    form.targetScope = 'all'
    form.filters = { dataCenter: '', status: '' }
    estimatedCount.value = null
}

const close = () => visible.value = false
</script>

<style scoped>
:deep(.exp-task-wizard) {
    border-radius: 16px;
    overflow: hidden;
    background: transparent;
    /* 让内部容器决定背景 */
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    padding: 0;
}

:deep(.exp-task-wizard .el-dialog__header) {
    display: none;
}

:deep(.exp-task-wizard .el-dialog__body) {
    padding: 0;
    height: 550px;
}

.wizard-container {
    display: flex;
    height: 100%;
    background: #fff;
}

/* --- 左侧 Summary (Dark Theme) --- */
.wizard-summary {
    width: 280px;
    background: linear-gradient(160deg, #1e293b 0%, #0f172a 100%);
    color: #fff;
    padding: 40px 30px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

/* 装饰背景纹理 */
.wizard-summary::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
    border-radius: 50%;
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

.summary-header h3 {
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 600;
}

.summary-header p {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
}

.summary-cards {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    z-index: 1;
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

.mini-card.highlight {
    border-color: rgba(96, 165, 250, 0.3);
    background: rgba(96, 165, 250, 0.1);
}

.sub-value {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
}

.count {
    color: #34d399;
    font-weight: 600;
}

.summary-footer {
    margin-top: auto;
    display: flex;
    justify-content: center;
}

.step-dots {
    display: flex;
    gap: 8px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all 0.3s;
}

.dot.active {
    background: #60a5fa;
    width: 24px;
    border-radius: 4px;
}

/* --- 右侧 Main --- */
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
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.2s;
    z-index: 10;
}

.close-btn:hover {
    background: #f1f5f9;
    color: #64748b;
}

.step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
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

/* Firmware Selector */
.firmware-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 320px;
    padding-right: 4px;
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

.fw-item:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.fw-item.selected {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
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
    font-size: 15px;
}

.fw-time {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
}

.fw-check {
    color: #3b82f6;
    font-size: 20px;
}

/* Scope Selector */
.scope-selector {
    margin-bottom: 24px;
}

.filter-panel {
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
}

.impact-preview {
    margin-top: 20px;
}

/* Confirm Step */
.center-align {
    align-items: center;
    justify-content: center;
    text-align: center;
}

.confirm-icon {
    width: 72px;
    height: 72px;
    background: #dbeafe;
    color: #2563eb;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    margin-bottom: 24px;
    box-shadow: 0 0 0 8px #eff6ff;
}

.highlight-ver {
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-weight: 600;
    color: #0f172a;
}

.task-name-form {
    width: 100%;
    max-width: 400px;
    margin: 20px 0;
    text-align: left;
}

.warning-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff7ed;
    color: #c2410c;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
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
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.launch-btn:hover {
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
    transform: translateY(-1px);
}

/* Transitions */
.fade-in {
    animation: fadeIn 0.3s ease-out;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateY(10px);
    opacity: 0;
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