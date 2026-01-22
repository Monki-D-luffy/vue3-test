<template>
    <el-dialog v-model="visible" title="真机验证推送 (Verify on Device)" width="520px" append-to-body destroy-on-close
        class="verify-modal">
        <div class="modal-content">
            <div class="info-box mb-4">
                <el-icon class="info-icon">
                    <Iphone />
                </el-icon>
                <div class="info-text">
                    <p class="title">定向验证测试</p>
                    <p class="desc">
                        将目标设备加入验证白名单。如果该版本已有发布任务，将复用现有任务；否则将创建新的灰度验证任务。
                        <br>目标版本: <b class="font-mono">v{{ firmware?.version }}</b>
                    </p>
                </div>
            </div>

            <div class="meta-grid mb-4">
                <div class="meta-item">
                    <span class="label">所属产品 (Product)</span>
                    <span class="value">{{ product?.name }}</span>
                </div>
                <div class="meta-item">
                    <span class="label">固件库 ID (Repo)</span>
                    <span class="value font-mono">{{ firmware?.repoId?.substring(0, 8) }}...</span>
                </div>
            </div>

            <el-form label-position="top" class="device-form">
                <el-form-item label="目标设备 UUID">
                    <div class="input-action-row">
                        <el-input v-model="deviceUuid" placeholder="请输入测试设备 UUID" clearable @keyup.enter="checkDevice"
                            :prefix-icon="Search" />
                        <el-button type="primary" plain @click="checkDevice" :loading="checking">
                            检测设备
                        </el-button>
                    </div>
                </el-form-item>

                <transition name="el-zoom-in-top">
                    <div v-if="deviceInfo" class="device-result-card success">
                        <div class="row">
                            <span class="label">设备状态:</span>
                            <el-tag size="small" type="success" effect="dark">匹配成功</el-tag>
                        </div>
                        <div class="row mt-2">
                            <span class="label">当前版本:</span>
                            <span class="value font-mono">{{ deviceInfo.currentVersion || '未知' }}</span>
                        </div>
                        <div class="row mt-1">
                            <span class="label">在线状态:</span>
                            <span class="value">{{ deviceInfo.online ? '在线' : '离线' }}</span>
                        </div>
                    </div>
                </transition>

                <transition name="el-zoom-in-top">
                    <div v-if="checkError" class="device-result-card error">
                        <el-icon>
                            <CircleCloseFilled />
                        </el-icon>
                        <span>{{ checkError }}</span>
                    </div>
                </transition>
            </el-form>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="close">取消</el-button>
                <el-button type="success" @click="handlePush" :loading="pushing" :disabled="!deviceInfo">
                    <el-icon class="mr-1">
                        <Promotion />
                    </el-icon>
                    确认推送
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Iphone, Search, CircleCloseFilled, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Firmware, Product } from '@/types'
import { fetchDevices } from '@/api/modules/device'
import {
    createTaskAndGetId,
    addVerifyDevice,
    publishGray,
    queryOTATasks
} from '@/api/modules/iot-ota'

const props = defineProps<{
    modelValue: boolean
    firmware: Firmware | null
    product?: Product
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const deviceUuid = ref('')
const checking = ref(false)
const pushing = ref(false)
const deviceInfo = ref<{ uuid: string; currentVersion: string; online: boolean } | null>(null)
const checkError = ref('')

watch(() => props.modelValue, (val) => {
    if (val) {
        deviceUuid.value = ''
        deviceInfo.value = null
        checkError.value = ''
    }
})

// 1. 检测设备逻辑
const checkDevice = async () => {
    if (!deviceUuid.value) return
    if (!props.product?.id) {
        checkError.value = '缺少产品上下文信息'
        return
    }

    checking.value = true
    deviceInfo.value = null
    checkError.value = ''

    try {
        const { items } = await fetchDevices(1, 1, {
            keyword: deviceUuid.value,
            productId: props.product.id
        } as any)

        if (items && items.length > 0) {
            const dev = items[0]
            deviceInfo.value = {
                uuid: dev.uuid,
                currentVersion: dev.firmwareVersion || '-',
                online: dev.status === '在线'
            }
        } else {
            checkError.value = '未找到该设备，或设备不属于当前产品'
        }
    } catch (e) {
        console.error(e)
        checkError.value = '设备校验服务异常'
    } finally {
        checking.value = false
    }
}

// 2. 推送逻辑 (复刻 OTA 测试台逻辑 + 智能容错)
const handlePush = async () => {
    if (!props.firmware || !props.product || !deviceInfo.value) return

    pushing.value = true
    try {
        let taskId = ''
        let taskStatus = -1

        // Step A: 检查是否存在当前版本的任务
        const tasks = await queryOTATasks({
            pageIndex: 1,
            pageSize: 1,
            productId: props.product.id,
            firmwaresRepoId: props.firmware.repoId,
            firmwareVersion: props.firmware.version
        } as any)

        const existingItems = (tasks.data as any)?.items || (tasks.data as any)?.data?.items || []
        const matchedTask = existingItems.find((t: any) => t.firmwareVersion === props.firmware?.version)

        if (matchedTask) {
            console.log('🔄 复用现有任务:', matchedTask.otaTaskId)
            taskId = matchedTask.otaTaskId
            taskStatus = matchedTask.status
        } else {
            console.log('🆕 创建新灰度任务')
            taskId = await createTaskAndGetId({
                productId: props.product.id,
                firmwaresRepoId: props.firmware.repoId,
                firmwareVersion: props.firmware.version,
                country: 'Global',
                upgradeMode: 1, // 灰度
                releaseNote: `Verify push to ${deviceInfo.value.uuid}`,
                remark: 'Manual Verification'
            })
            taskStatus = 0 // 草稿
        }

        // Step B: 添加白名单 (智能容错版)
        // 🚨 关键修复：即便后端报错说“已存在”，我们也要视为成功
        try {
            await addVerifyDevice(taskId, deviceInfo.value.uuid)
        } catch (e: any) {
            const msg = e.response?.data?.Message || e.message || ''
            // 如果错误信息包含“已存在”、“exist”等关键词，说明目标达成，忽略报错
            if (msg.includes('已存在') || msg.includes('exist') || msg.includes('Duplicate')) {
                console.log('✅ 设备已在白名单中，跳过添加步骤')
            } else {
                throw e // 其他未知错误才抛出
            }
        }

        // Step C: 如果任务未启动，则启动灰度发布
        if (taskStatus === 0 || taskStatus === 2) {
            await publishGray({
                otaTaskId: taskId,
                grayPolicy: 1,
                grayValue: 999
            })
        }

        ElMessage.success(`验证指令已下发! 任务ID: ${taskId.substring(0, 8)}...`)
        emit('success')
        close()
    } catch (e: any) {
        console.error(e)
        const msg = e.response?.data?.Message || e.message || '推送失败'
        ElMessage.error(msg)
    } finally {
        pushing.value = false
    }
}

const close = () => visible.value = false
</script>

<style scoped>
.verify-modal :deep(.el-dialog__body) {
    padding-top: 10px;
}

.info-box {
    background: #ecfdf5;
    border: 1px solid #d1fae5;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    gap: 12px;
}

.info-icon {
    font-size: 24px;
    color: #10b981;
    margin-top: 2px;
}

.title {
    font-weight: 600;
    color: #065f46;
    margin: 0 0 4px 0;
    font-size: 14px;
}

.desc {
    font-size: 12px;
    color: #047857;
    margin: 0;
    line-height: 1.4;
}

.meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    background: #f8fafc;
    padding: 12px;
    border-radius: 8px;
}

.meta-item {
    display: flex;
    flex-direction: column;
}

.meta-item .label {
    font-size: 12px;
    color: #64748b;
}

.meta-item .value {
    font-size: 13px;
    color: #334155;
    font-weight: 500;
}

.input-action-row {
    display: flex;
    gap: 8px;
}

.device-result-card {
    margin-top: 12px;
    padding: 12px;
    border-radius: 6px;
    font-size: 13px;
}

.device-result-card.success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
}

.device-result-card.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    display: flex;
    align-items: center;
    gap: 8px;
}

.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>