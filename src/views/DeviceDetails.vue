<!-- 详情页: Dashboard的子页面 -->
<template>
    <div class="details-container">
        <el-page-header @back="goBack" class="page-header">
            <template #content>
                <span class="text-large font-600 mr-3"> 设备详情 </span>
            </template>
        </el-page-header>

        <el-card v-if="loading" shadow="never" v-loading="loading" class="details-card"
            style="height: 300px;"></el-card>

        <el-card v-else-if="deviceDetails" shadow="never" class="details-card">
            <template #header>
                <div class="card-header">
                    <span>{{ deviceDetails.name }}</span>
                    <el-tag :type="getStatusType(deviceDetails.status)" effect="light" round>
                        {{ deviceDetails.status }}
                    </el-tag>
                </div>
            </template>

            <el-descriptions :column="2" border>
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
        </el-card>

        <el-empty v-else description="设备不存在或加载失败"></el-empty>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const deviceDetails = ref(null)
const loading = ref(true)

// --- API 请求 ---
const fetchDeviceDetails = async (id) => {
    loading.value = true
    try {
        // json-server 天然支持 /devices/:id 这种 GET 请求
        const response = await api.get(`/devices/${id}`)
        deviceDetails.value = response.data.data
    } catch (error) {
        ElMessage.error('获取设备详情失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}

// --- 事件处理 ---
const goBack = () => {
    router.push('/dashboard') // 或者使用 router.go(-1)
}

// --- 辅助函数 (和主看板一样) ---
const getStatusType = (status) => {
    switch (status) {
        case '在线': return 'success'
        case '离线': return 'info'
        case '故障': return 'danger'
        case '未激活': return 'warning'
        default: return ''
    }
}

// --- 生命周期 ---
onMounted(() => {
    // 1. 从路由参数中获取设备 ID
    const deviceId = route.params.id
    if (deviceId) {
        // 2. 发起 API 请求
        fetchDeviceDetails(deviceId)
    } else {
        ElMessage.error('未找到设备ID')
        loading.value = false
    }
})
</script>

<style scoped>
.details-container {
    padding: 20px;
    background-color: #f5f7fa;
    min-height: calc(100vh - 40px);
    /* 减去内边距 */
}

.page-header {
    margin-bottom: 20px;
}

.details-card {
    border: none;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
}
</style>