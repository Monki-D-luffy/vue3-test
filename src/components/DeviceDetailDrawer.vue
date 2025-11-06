<!-- 详情页 -->
<template>
    <el-drawer v-model="visible" title="设备详情" direction="rtl" size="50%" @closed="$emit('close')">
        <div v-loading="deviceLoading" style="padding: 20px; min-height: 300px;">
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
                <el-descriptions-item label="激活时间">{{ deviceDetails.gmtActive }}</el-descriptions-item>
                <el-descriptions-item label="最近上线时间">{{ deviceDetails.gmtLastOnline }}</el-descriptions-item>
            </el-descriptions>

            <el-empty v-if="!deviceDetails && !deviceLoading" description="无设备详情" />
        </div>
    </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

// 1. 定义组件接收的属性 (props)
const props = defineProps({
    deviceId: {
        type: String,
        required: true
    }
})

// 2. 定义组件能发出的事件 (emits)
const emit = defineEmits(['close'])

// 3. 内部状态
const visible = ref(true) // 组件一旦被 v-if 渲染，抽屉就应立即显示
const deviceDetails = ref(null)
const deviceLoading = ref(false)

// 4. API 请求 (和之前一样)
const fetchDeviceDetails = async (id) => {
    deviceLoading.value = true
    deviceDetails.value = null
    try {
        const response = await api.get(`/devices/${id}`) //
        deviceDetails.value = response.data.data
    } catch (error) {
        ElMessage.error('获取设备详情失败')
        console.error(error)
        visible.value = false // 加载失败时自动关闭
        emit('close')         // 并通知父组件
    } finally {
        deviceLoading.value = false
    }
}

// 5. 辅助函数 (和之前一样)
const getStatusType = (status) => {
    switch (status) {
        case '在线': return 'success'
        case '离线': return 'info'
        case '故障': return 'danger'
        case '未激活': return 'warning'
        default: return ''
    }
}

// 6. 生命周期钩子
onMounted(() => {
    // 当组件被创建(v-if=true)时，
    // 立即使用传入的 prop (deviceId) 来获取数据
    if (props.deviceId) {
        fetchDeviceDetails(props.deviceId)
    }
})
</script>

<style scoped>
/* 这些样式只属于这个组件，
  父组件不需要再关心抽屉长什么样
*/
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
}

/* :deep() 允许我们修改 el-drawer 的内部样式
  我们不希望抽屉的 body 有内边距，
  因为我们自己在内容区加了 padding
*/
:deep(.el-drawer__body) {
    padding: 0;
}
</style>