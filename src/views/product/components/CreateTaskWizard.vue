<template>
    <el-dialog v-model="visible" title="新建批量升级任务" width="700px" :close-on-click-modal="false"
        :before-close="handleClose" destroy-on-close>
        <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px;">
            <el-step title="选择固件" />
            <el-step title="升级范围" />
            <el-step title="确认启动" />
        </el-steps>

        <div v-if="activeStep === 0" class="step-content" v-loading="loadingFirmwares">
            <div class="section-title">目标产品：{{ product.name }}</div>

            <el-alert v-if="availableFirmwares.length === 0 && !loadingFirmwares" title="该产品暂无已验证的固件" type="warning"
                description="请先在'固件版本库'中上传固件，并点击'通过验证'。" show-icon :closable="false" style="margin-bottom: 15px;" />

            <el-table v-else :data="availableFirmwares" highlight-current-row @current-change="handleFirmwareSelect"
                style="width: 100%" height="300px" border>
                <el-table-column width="55" align="center">
                    <template #default="{ row }">
                        <el-radio :model-value="selectedFirmware?.id" :label="row.id"
                            @change="() => handleFirmwareSelect(row)">
                            &nbsp;
                        </el-radio>
                    </template>
                </el-table-column>
                <el-table-column prop="version" label="版本号" width="120">
                    <template #default="{ row }">
                        <el-tag effect="dark" type="success">{{ row.version }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="uploadedAt" label="上传时间" width="180">
                    <template #default="{ row }">
                        {{ formatDateTime(row.uploadedAt) }}
                    </template>
                </el-table-column>
                <el-table-column prop="releaseNotes" label="说明" show-overflow-tooltip />
            </el-table>
        </div>

        <div v-if="activeStep === 1" class="step-content">
            <el-form label-width="100px" label-position="left">
                <el-form-item label="目标版本">
                    <span style="font-weight: bold; font-size: 16px;">{{ selectedFirmware?.version }}</span>
                </el-form-item>

                <el-form-item label="推送策略">
                    <el-radio-group v-model="upgradeScope">
                        <el-radio-button value="all">全量推送 (All)</el-radio-button>
                        <el-radio-button value="filter">按区域筛选 (Filter)</el-radio-button>
                    </el-radio-group>
                </el-form-item>

                <transition name="el-zoom-in-top">
                    <div v-if="upgradeScope === 'filter'" class="filter-box">
                        <el-form-item label="数据中心">
                            <el-select v-model="filterForm.dataCenter" placeholder="请选择目标数据中心" style="width: 100%">
                                <el-option label="中国 (CN)" value="CN" />
                                <el-option label="美西 (US-WEST)" value="US-WEST" />
                                <el-option label="中欧 (EU-CENTRAL)" value="EU-CENTRAL" />
                                <el-option label="印度 (IN)" value="IN" />
                                <el-option label="美东 (US-EAST)" value="US-EAST" />
                                <el-option label="西欧 (EU-WEST)" value="EU-WEST" />
                                <el-option label="新加坡 (SG)" value="SG" />
                            </el-select>
                        </el-form-item>
                    </div>
                </transition>

                <div class="impact-card" v-loading="estimating">
                    <div class="card-title">
                        <el-icon>
                            <DataLine />
                        </el-icon> 影响范围预估
                    </div>
                    <div class="impact-stats">
                        <div class="stat-item">
                            <div class="label">符合条件设备</div>
                            <div class="value">{{ estimatedImpact.total }} <small>台</small></div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <div class="label">预计在线可升级</div>
                            <div class="value highlight">{{ estimatedImpact.online }} <small>台</small></div>
                        </div>
                    </div>
                </div>
            </el-form>
        </div>

        <div v-if="activeStep === 2" class="step-content confirm-step">
            <el-result icon="info" title="准备就绪" sub-title="请最后确认任务信息。点击启动后，系统将开始分批下发升级指令。">
                <template #extra>
                    <div class="confirm-list">
                        <div class="confirm-item">
                            <span class="label">任务名称：</span>
                            <span class="value">{{ taskName }}</span>
                        </div>
                        <div class="confirm-item">
                            <span class="label">目标产品：</span>
                            <span class="value">{{ product.name }}</span>
                        </div>
                        <div class="confirm-item">
                            <span class="label">固件版本：</span>
                            <span class="value tag">{{ selectedFirmware?.version }}</span>
                        </div>
                        <div class="confirm-item">
                            <span class="label">覆盖范围：</span>
                            <span class="value">{{ upgradeScope === 'all' ? '全量设备' : `区域: ${filterForm.dataCenter}`
                            }}</span>
                        </div>
                        <div class="confirm-item">
                            <span class="label">预计升级：</span>
                            <span class="value highlight">{{ estimatedImpact.total }} 台</span>
                        </div>
                    </div>
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
                    🚀 立即启动任务
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/formatters'
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
const loadingFirmwares = ref(false)
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
    if (!selectedFirmware.value) return ''
    const date = new Date().toISOString().slice(0, 10)
    return `${props.product.name}_v${selectedFirmware.value.version}_${date}_Campaign`
})

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// --- 逻辑 ---

// 1. 加载可用固件
const loadFirmwares = async () => {
    loadingFirmwares.value = true
    try {
        // 这里我们获取该产品的所有固件，然后在前端筛选 verified === true
        // 在真实后端中，应该传参 verified: true
        const res = await fetchFirmwares({
            _page: 1,
            _limit: 50,
            productId: props.product.id,
            _sort: 'uploadedAt',
            _order: 'desc'
        })
        // ✨ 关键过滤：只允许选择已验证的固件
        availableFirmwares.value = res.items.filter(f => f.verified === true)
    } catch (error) {
        console.error(error)
        ElMessage.error('加载固件列表失败')
    } finally {
        loadingFirmwares.value = false
    }
}

// 选择固件
const handleFirmwareSelect = (row: Firmware) => {
    selectedFirmware.value = row
}

// 下一步检查
const handleNext = async () => {
    if (activeStep.value === 0) {
        if (!selectedFirmware.value) return ElMessage.warning('请先选择一个目标固件')
        // 进入步骤2时，触发一次预估
        await updateImpactEstimation()
    } else if (activeStep.value === 1) {
        if (upgradeScope.value === 'filter' && !filterForm.dataCenter) {
            return ElMessage.warning('请选择数据中心')
        }
    }
    activeStep.value++
}

// 2. 调用 API 预估影响
const updateImpactEstimation = async () => {
    if (!selectedFirmware.value) return

    estimating.value = true
    try {
        const res = await estimateUpgradeImpact(
            props.product.id,
            selectedFirmware.value.id,
            upgradeScope.value === 'all' ? {} : { dataCenter: filterForm.dataCenter }
        )
        estimatedImpact.total = res.total
        estimatedImpact.online = res.online
    } catch (e) {
        console.error(e)
    } finally {
        estimating.value = false
    }
}

// 监听筛选条件变化，防抖自动刷新预估
watch([upgradeScope, () => filterForm.dataCenter], () => {
    if (activeStep.value === 1) {
        updateImpactEstimation()
    }
})

// 3. 提交创建任务
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
            filters: upgradeScope.value === 'all' ? {} : filterForm
        })

        ElMessage.success('批量升级任务已成功创建！')
        emit('success')
        handleClose()
    } catch (e) {
        console.error(e)
        ElMessage.error('创建任务失败')
    } finally {
        submitting.value = false
    }
}

const handleClose = () => {
    if (submitting.value) return
    visible.value = false
    // 关闭后重置状态
    setTimeout(() => {
        activeStep.value = 0
        selectedFirmware.value = null
        upgradeScope.value = 'all'
        filterForm.dataCenter = ''
        estimatedImpact.total = 0
        estimatedImpact.online = 0
    }, 300)
}

// 打开弹窗时加载数据
watch(visible, (val) => {
    if (val) loadFirmwares()
})
</script>

<style scoped>
.step-content {
    padding: 10px;
    min-height: 320px;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
}

.filter-box {
    background-color: var(--el-fill-color-light);
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid var(--el-border-color-lighter);
}

/* 影响预估卡片样式 */
.impact-card {
    margin-top: 20px;
    background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(103, 194, 58, 0.1);
}

.card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #67c23a;
    margin-bottom: 15px;
}

.impact-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
}

.stat-item {
    text-align: center;
}

.stat-item .label {
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
}

.stat-item .value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    line-height: 1;
}

.stat-item .value.highlight {
    color: #67c23a;
}

.stat-item .unit {
    font-size: 14px;
    font-weight: normal;
    color: #909399;
}

.stat-divider {
    width: 1px;
    height: 40px;
    background-color: rgba(0, 0, 0, 0.06);
}

/* 确认页样式 */
.confirm-step {
    display: flex;
    justify-content: center;
}

.confirm-list {
    background-color: var(--el-fill-color-lighter);
    padding: 20px 30px;
    border-radius: 8px;
    width: 100%;
}

.confirm-item {
    display: flex;
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.6;
}

.confirm-item:last-child {
    margin-bottom: 0;
}

.confirm-item .label {
    color: var(--el-text-color-secondary);
    width: 80px;
    flex-shrink: 0;
}

.confirm-item .value {
    color: var(--el-text-color-primary);
    font-weight: 500;
}

.confirm-item .value.tag {
    color: var(--el-color-primary);
    font-weight: 700;
}

.confirm-item .value.highlight {
    color: #67c23a;
    font-weight: 700;
}
</style>