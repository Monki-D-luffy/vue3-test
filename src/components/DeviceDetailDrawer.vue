<template>
    <el-drawer :model-value="true" title="设备详情" direction="rtl" size="50%" @closed="onClose">
        <div v-loading="deviceLoading" style="padding: 20px; min-height: 300px;">
            <div class="action-bar" v-if="deviceDetails">
                <el-button v-if="deviceDetails.hasNewFirmware && deviceDetails.status !== '升级中'" type="primary"
                    :icon="Top" @click="onUpgradeClick">
                    升级固件 ({{ deviceDetails.firmwareVersion }})
                </el-button>
                <el-button v-else-if="deviceDetails.status === '升级中'" type="info" loading plain disabled>
                    正在升级...
                </el-button>
                <el-button v-else type="success" :icon="CircleCheck" plain disabled>
                    已是最新版本 ({{ deviceDetails.firmwareVersion }})
                </el-button>
            </div>
            <el-divider v-if="deviceDetails" />

            <el-descriptions v-if="deviceDetails" :column="2" border>
                <template #title>
                    <div class="card-header">
                        <span>{{ deviceDetails.name }}</span>
                        <el-tag :type="getStatusType(deviceDetails.status)" effect="light" round>
                            {{ deviceDetails.status }}
                        </el-tag>
                    </div>
                </template>

                <el-descriptions-item label="设备ID">{{ deviceDetails.id }}</el-descriptions-item>
                <el-descriptions-item label="设备SN码">{{ deviceDetails.sn }}</el-descriptions-item>
                <el-descriptions-item label="生产PUUID">{{ deviceDetails.puuid }}</el-descriptions-item>
                <el-descriptions-item label="所属产品">{{ deviceDetails.productInfo }}</el-descriptions-item>
                <el-descriptions-item label="数据中心">
                    <el-tag size="small">{{ deviceDetails.dataCenter }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="是否绑定">
                    <el-tag :type="deviceDetails.isBound ? 'success' : 'info'" size="small">
                        {{ deviceDetails.isBound ? '已绑定' : '未绑定' }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="激活时间">{{ formatDateTime(deviceDetails.gmtActive) }}</el-descriptions-item>
                <el-descriptions-item label="最近上线">{{ formatDateTime(deviceDetails.gmtLastOnline)
                    }}</el-descriptions-item>
            </el-descriptions>

            <el-divider v-if="deviceDetails">原始数据</el-divider>
            <pre v-if="deviceDetails" class="raw-data">{{ JSON.stringify(deviceDetails, null, 2) }}</pre>

            <el-empty v-if="!deviceDetails && !deviceLoading" description="未能加载设备数据" />
        </div>
    </el-drawer>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue'
// [修正]：导入需要的组件
import {
    ElDrawer,
    ElDescriptions,
    ElDescriptionsItem,
    ElTag,
    ElEmpty,
    ElButton,
    ElDivider,
    ElMessage
} from 'element-plus'
// [新增]：导入图标
import { Top, CircleCheck } from '@element-plus/icons-vue'
import api from '@/api' // [沿用] 你的 api 实例
import { formatDateTime } from '@/utils/formatters'

// 1. 定义组件的 props (和之前一样)
const props = defineProps({
    deviceId: {
        type: String,
        required: true
    }
})

// 2. [修正]：定义组件能发出的事件 (emits)，新增 'trigger-upgrade'
const emit = defineEmits(['close', 'trigger-upgrade'])

// 3. 内部状态 (和之前一样)
// [修正]：移除 visible = ref(true)，因为 model-value 会控制
const deviceDetails = ref(null)
const deviceLoading = ref(false)

// 4. API 请求 (和之前一样)
const fetchDeviceDetails = async (id) => {
    if (!id) return
    deviceLoading.value = true
    deviceDetails.value = null
    try {
        const response = await api.get(`/devices/${id}`)
        deviceDetails.value = response.data.data
    } catch (error) {
        ElMessage.error('获取设备详情失败')
        console.error(error)
        onClose() // 加载失败时自动关闭
    } finally {
        deviceLoading.value = false
    }
}

// 5. 辅助函数
const getStatusType = (status) => {
    switch (status) {
        case '在线': return 'success'
        case '离线': return 'info'
        case '故障': return 'danger'
        case '未激活': return 'warning'
        case '升级中': return 'processing' // [新增]
        default: return ''
    }
}

// 6. [新增]：升级按钮点击处理
const onUpgradeClick = () => {
    // 将完整的设备对象发射出去
    emit('trigger-upgrade', deviceDetails.value)
    // (可选) 升级时自动关闭抽屉
    onClose()
}

// 7. [新增]：关闭抽屉的统一处理
const onClose = () => {
    emit('close')
}

// 8. 生命周期钩子
// [修正]：使用 watch 替代 onMounted，以便在 deviceId 变化时重新加载
watch(
    () => props.deviceId,
    (newId) => {
        if (newId) {
            fetchDeviceDetails(newId)
        }
    },
    { immediate: true } // 立即执行一次
)
</script>

<style scoped>
/* [沿用] */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* [新增] */
.action-bar {
    margin-bottom: 16px;
}

.raw-data {
    background-color: #fafafa;
    border: 1px solid #eaeaea;
    padding: 10px;
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
}
</style>