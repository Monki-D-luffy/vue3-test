<template>
    <div class="dashboard-container">

        <div class="page-header">
            <h1 class="title">设备明细</h1>
            <el-button type="primary">申领数据中心</el-button>
        </div>

        <el-row :gutter="20" class="summary-cards">
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="card-content">
                        <span>设备总数</span>
                        <span class="value">{{ summary.total }}</span>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="card-content">
                        <span>已激活设备</span>
                        <span class="value">{{ summary.activated }}</span>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card shadow="hover">
                    <div class="card-content">
                        <span>当前在线设备</span>
                        <span class="value">{{ summary.online }}</span>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filters" class="filter-form">
                <el-form-item label="是否绑定">
                    <el-select v-model="filters.isBound" placeholder="全部" clearable>
                        <el-option label="已绑定" :value="true" />
                        <el-option label="未绑定" :value="false" />
                    </el-select>
                </el-form-item>
                <el-form-item label="全部产品">
                    <el-select v-model="filters.productId" placeholder="全部产品" clearable>
                    </el-select>
                </el-form-item>
                <el-form-item label="时间区间">
                    <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" />
                </el-form-item>
                <el-form-item class="search-input">
                    <el-input v-model="filters.keyword" placeholder="设备ID/名称/PUUID/SN码" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="table-card" shadow="never">
            <el-table :data="deviceList" v-loading="loading">
                <el-table-column prop="name" label="设备名称/ID" width="180" />
                <el-table-column prop="status" label="设备状态" width="100" />
                <el-table-column prop="puuid" label="生产PUUID" width="200" />
                <el-table-column prop="productId" label="所属产品/产品ID" width="180" />
                <el-table-column prop="sn" label="设备SN码" width="180" />
                <el-table-column prop="gmtActive" label="激活时间" width="180" />
                <el-table-column prop="gmtLastOnline" label="最近上线时间" width="180" />
                <el-table-column label="操作" fixed="right" min-width="150">
                    <template #default="scope">
                        <el-button link type="primary">查看</el-button>
                        <el-button link type="primary">详情</el-button>
                        <el-button link type="danger">删除</el-button>
                    </template>
                </el-table-column>

                <template #empty>
                    <el-empty description="暂无激活设备" />
                </template>
            </el-table>
        </el-card>

    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = 'http://192.168.1.100/api' // 保持和 mock 一致

// 顶部卡片数据
const summary = ref({
    total: 0,
    activated: 0,
    online: 0
})

// 筛选表单数据
const filters = reactive({
    isBound: '',
    productId: '',
    dateRange: '',
    keyword: ''
})

// 表格数据
const deviceList = ref([])
const loading = ref(true) // 表格加载状态

// --- API 请求函数 ---

// 获取顶部统计数据
const fetchSummary = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/devices/summary`)
        summary.value = response.data.data
    } catch (error) {
        ElMessage.error('获取统计数据失败')
        console.error(error)
    }
}

// 获取设备列表数据
const fetchDevices = async () => {
    loading.value = true
    try {
        // 1. 准备要发送给后端的参数
        //    我们从 reactive 的 filters 中解构出需要的值
        const { isBound, productId, dateRange, keyword } = filters

        // 2. Element Plus 的 el-date-picker 返回的是一个数组 [Date, Date]
        //    我们需要将其转换成后端更喜欢的格式，比如 '2025-11-01'
        const params = {
            isBound,
            productId,
            keyword,
            // 3. 只有当 dateRange 有值 (不是空字符串或null) 且是一个数组时，我们才处理它
            startDate: dateRange && dateRange[0] ? dateRange[0].toISOString().split('T')[0] : '',
            endDate: dateRange && dateRange[1] ? dateRange[1].toISOString().split('T')[0] : ''
        }

        // 4. 使用 axios 的 { params: ... } 配置，
        //    axios 会自动将 params 对象转换成 URL 查询字符串
        //    例如：.../api/devices?startDate=2025-11-01&endDate=2025-11-04
        const response = await axios.get(`${API_BASE_URL}/devices`, { params: params })

        deviceList.value = response.data.data
    } catch (error) {
        ElMessage.error('获取设备列表失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}

// --- 事件处理函数 ---

const handleSearch = () => {
    // 触发搜索，（在真实后端中）会根据 filters 重新获取数据
    ElMessage.success('正在搜索...')
    fetchDevices()
}

const handleReset = () => {
    // 重置所有筛选条件
    filters.isBound = ''
    filters.productId = ''
    filters.dateRange = ''
    filters.keyword = ''
    ElMessage.info('已重置')
    fetchDevices()
}

// --- 生命周期钩子 ---
onMounted(() => {
    // 页面加载时，同时获取两部分数据
    fetchSummary()
    fetchDevices()
})

</script>

<style scoped>
/* 添加一些样式来美化布局 */
.dashboard-container {
    padding: 20px;
    background-color: #f5f7fa;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.title {
    font-size: 24px;
    margin: 0;
}

.summary-cards {
    margin-bottom: 20px;
}

.card-content {
    display: flex;
    flex-direction: column;
}

.card-content .value {
    font-size: 28px;
    font-weight: bold;
    margin-top: 10px;
}

.filter-card,
.table-card {
    margin-bottom: 20px;
}

.filter-form .el-form-item {
    margin-bottom: 10px;
    /* 减少行间距 */
}

/* 让搜索框在行内表单中不换行 */
.filter-form .search-input {
    min-width: 200px;
}
</style>