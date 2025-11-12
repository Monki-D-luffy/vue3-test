<template>
    <el-dialog v-model="visible" title="新建批量升级任务" width="680px" :close-on-click-modal="false"
        :before-close="handleClose">
        <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px;">
            <el-step title="选择固件" />
            <el-step title="升级范围" />
            <el-step title="确认启动" />
        </el-steps>

        <div v-if="activeStep === 0" class="step-content">
            <div class="section-title">目标产品：{{ product.name }}</div>

            <el-table :data="availableFirmwares" highlight-current-row @current-change="handleFirmwareSelect"
                style="width: 100%" height="300px">
                <el-table-column width="50">
                    <template #default="{ row }">
                        <el-radio :model-value="selectedFirmware?.id" :label="row.id">{{ '' }}</el-radio>
                    </template>
                </el-table-column>
                <el-table-column prop="version" label="版本号" width="120">
                    <template #default="{ row }">
                        <span class="font-bold">{{ row.version }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="uploadedAt" label="上传时间" width="180" />
                <el-table-column prop="releaseNotes" label="说明" show-overflow-tooltip />
            </el-table>
        </div>

        <div v-if="activeStep === 1" class="step-content">
            <el-form label-width="100px">
                <el-form-item label="目标版本">
                    <el-tag type="success" effect="dark">{{ selectedFirmware?.version }}</el-tag>
                </el-form-item>

                <el-form-item label="推送策略">
                    <el-radio-group v-model="upgradeScope">
                        <el-radio-button label="all">全量推送</el-radio-button>
                        <el-radio-button label="filter">按条件筛选</el-radio-button>
                    </el-radio-group>
                </el-form-item>

                <div v-if="upgradeScope === 'filter'" class="filter-box">
                    <el-form-item label="数据中心">
                        <el-select v-model="filterForm.dataCenter" placeholder="选择区域">
                            <el-option label="中国 (CN)" value="CN" />
                            <el-option label="美西 (US-WEST)" value="US-WEST" />
                        </el-select>
                    </el-form-item>
                </div>

                <div class="impact-card" v-loading="estimating">
                    <div class="impact-item">
                        <div class="label">预计升级设备</div>
                        <div class="value">{{ estimatedImpact.total }} <span class="unit">台</span></div>
                    </div>
                    <div class="impact-item">
                        <div class="label">其中在线</div>
                        <div class="value online">{{ estimatedImpact.online }} <span class="unit">台</span></div>
                    </div>
                </div>
            </el-form>
        </div>

        <div v-if="activeStep === 2" class="step-content confirm-step">
            <el-result icon="info" title="准备就绪" sub-title="请确认以下升级任务信息，启动后将无法撤回。">
                <template #extra>
                    <el-descriptions border :column="1" style="width: 400px; margin: 0 auto;">
                        <el-descriptions-item label="任务名称">{{ taskName }}</el-descriptions-item>
                        <el-descriptions-item label="目标产品">{{ product.name }}</el-descriptions-item>
                        <el-descriptions-item label="目标固件">
                            <el-tag>{{ selectedFirmware?.version }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="覆盖设备">
                            预计 {{ estimatedImpact.total }} 台
                        </el-descriptions-item>
                    </el-descriptions>
                </template>
            </el-result>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button v-if="activeStep > 0" @click="activeStep--">上一步</el-button>

                <el-button v-if="activeStep < 2" type="primary" @click="handleNext"
                    :disabled="activeStep === 0 && !selectedFirmware">
                    下一步
                </el-button>

                <el-button v-if="activeStep === 2" type="primary" :loading="submitting" @click="handleSubmit">
                    🚀 启动升级任务
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Product, Firmware } from '@/types'
import { fetchFirmwares, estimateUpgradeImpact, createUpgradeCampaign } from '@/api'

const props = defineProps<{
    modelValue: boolean
    product: Product
}>()

const emit = defineEmits(['update:modelValue', 'success'])

// --- 状态 ---
const activeStep = ref(0)
const submitting = ref(false)
const availableFirmwares = ref<Firmware[]>([])
const selectedFirmware = ref<Firmware | null>(null)

const upgradeScope = ref('all')
const filterForm = reactive({
    dataCenter: ''
})

const estimating = ref(false)
const estimatedImpact = reactive({ total: 0, online: 0 })

// 自动生成任务名
const taskName = computed(() => {
    const date = new Date().toISOString().slice(0, 10)
    return `${props.product.name}_${selectedFirmware.value?.version}_${date}_推广`
})

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// --- 逻辑 ---

// 加载可用固件
const loadFirmwares = async () => {
    // 这里只加载 "verified=true" 的固件
    // 实际 API 可能需要支持 verified=true 筛选参数
    const res = await fetchFirmwares({
        _page: 1, _limit: 50,
        productId: props.product.id,
        _sort: 'uploadedAt', _order: 'desc'
    })
    // 前端过滤一下 verified (如果后端不支持)
    availableFirmwares.value = res.items.filter(f => f.verified)
}

const handleFirmwareSelect = (row: Firmware) => {
    selectedFirmware.value = row
}

const handleNext = async () => {
    if (activeStep.value === 0) {
        if (!selectedFirmware.value) return ElMessage.warning('请先选择一个固件')
        // 进入步骤2时，触发一次预估
        await updateImpactEstimation()
    }
    activeStep.value++
}

// 更新预估
const updateImpactEstimation = async () => {
    if (!selectedFirmware.value) return
    estimating.value = true
    try {
        const res = await estimateUpgradeImpact(
            props.product.id,
            selectedFirmware.value.id,
            upgradeScope.value === 'all' ? {} : filterForm
        )
        estimatedImpact.total = res.total
        estimatedImpact.online = res.online
    } finally {
        estimating.value = false
    }
}

// 监听筛选变化，重新预估
watch([upgradeScope, () => filterForm.dataCenter], () => {
    if (activeStep.value === 1) updateImpactEstimation()
})

const handleSubmit = async () => {
    if (!selectedFirmware.value) return

    submitting.value = true
    try {
        await createUpgradeCampaign({
            name: taskName.value,
            productId: props.product.id,
            firmwareId: selectedFirmware.value.id,
            firmwareVersion: selectedFirmware.value.version,
            targetScope: upgradeScope.value as any,
            filters: filterForm
        })

        ElMessage.success('升级任务已成功创建！')
        emit('success')
        handleClose()
    } catch (e) {
        console.error(e)
    } finally {
        submitting.value = false
    }
}

const handleClose = () => {
    visible.value = false
    // 重置状态
    setTimeout(() => {
        activeStep.value = 0
        selectedFirmware.value = null
        upgradeScope.value = 'all'
    }, 300)
}

// 打开弹窗时加载数据
watch(visible, (val) => {
    if (val) loadFirmwares()
})
</script>

<style scoped>
.step-content {
    padding: 20px 10px;
    min-height: 300px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 15px;
    color: var(--el-text-color-primary);
}

.filter-box {
    background-color: var(--el-fill-color-light);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.impact-card {
    display: flex;
    gap: 40px;
    background: #f0f9eb;
    border: 1px solid #e1f3d8;
    padding: 20px;
    border-radius: 8px;
}

.impact-item .label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
}

.impact-item .value {
    font-size: 24px;
    font-weight: bold;
    color: var(--el-text-color-primary);
}

.impact-item .value.online {
    color: var(--el-color-success);
}

.impact-item .unit {
    font-size: 14px;
    font-weight: normal;
    color: var(--el-text-color-secondary);
}

.confirm-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>