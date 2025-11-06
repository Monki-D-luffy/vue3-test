<template>
    <div class="dashboard-container">

        <div class="page-header">
            <h1 class="title">设备明细</h1>

            <el-dropdown type="primary" split-button @command="handleCenterChange">
                {{ dataCenterMap[selectedCenter] }}
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="CN">中国数据中心</el-dropdown-item>
                        <el-dropdown-item command="US-WEST">美西数据中心</el-dropdown-item>
                        <el-dropdown-item command="EU-CENTRAL">中欧数据中心</el-dropdown-item>
                        <el-dropdown-item command="IN">印度数据中心</el-dropdown-item>
                        <el-dropdown-item command="US-EAST">美东数据中心</el-dropdown-item>
                        <el-dropdown-item command="EU-WEST">西欧数据中心</el-dropdown-item>
                        <el-dropdown-item command="SG">新加坡数据中心</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <el-row :gutter="20" class="summary-cards">

            <el-col :span="8">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon blue-bg">
                            <el-icon>
                                <Monitor />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <span class="label">设备总数</span>
                            <span class="value">{{ summary.total }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon blue-bg">
                            <el-icon>
                                <CircleCheck />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <span class="label">已激活设备</span>
                            <span class="value">{{ summary.activated }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <el-col :span="8">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-icon blue-bg">
                            <el-icon>
                                <Connection />
                            </el-icon>
                        </div>
                        <div class="stat-info">
                            <span class="label">当前在线设备</span>
                            <span class="value">{{ summary.online }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filters" class="filter-form">
                <el-form-item>
                    <el-select v-model="filters.isBound" placeholder="是否绑定" clearable>
                        <el-option label="已绑定" :value="'true'" />
                        <el-option label="未绑定" :value="'false'" />
                    </el-select>
                </el-form-item>
                <el-form-item label="全部产品">
                    <el-select v-model="filters.productId" placeholder="全部产品" clearable>
                    </el-select>
                </el-form-item>
                <el-form-item label="时间区间">
                    <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" unlink-panels />
                </el-form-item>
                <el-form-item class="search-input">
                    <el-input v-model="filters.keyword" placeholder="设备ID / 名称 / PUUID / SN码" clearable />
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
                <el-table-column prop="status" label="设备状态" width="120">
                    <template #default="scope">
                        <el-tag :type="getStatusType(scope.row.status)" effect="light" round>
                            {{ scope.row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="设备状态" width="100" />
                <el-table-column prop="puuid" label="生产PUUID" width="200" />
                <el-table-column prop="productId" label="所属产品/产品ID" width="180" />
                <el-table-column prop="sn" label="设备SN码" width="180" />
                <el-table-column prop="gmtActive" label="激活时间" width="180" />
                <el-table-column prop="gmtLastOnline" label="最近上线时间" width="180" />
                <el-table-column label="操作" fixed="right" min-width="150">
                    <template #default="scope">
                        <el-button link type="primary">查看</el-button>
                        <el-button link type="primary" @click="goToDetails(scope.row)">详情</el-button>
                        <el-button link type="danger">删除</el-button>
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty description="暂无激活设备" />
                </template>

            </el-table>
            <div class="pagination-block" v-if="pagination.total > 0">
                <el-pagination :total="pagination.total" v-model:current-page="pagination.currentPage"
                    v-model:page-size="pagination.pageSize" :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>

        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
// import axios from 'axios'
import { ElMessage } from 'element-plus'
import api from '@/api'
// 引入需要的图标
import { Monitor, CircleCheck, Connection } from '@element-plus/icons-vue'
// 导入 useRouter
import { useRouter } from 'vue-router'

// 实例化 router
const router = useRouter()

// 新增一个跳转方法
const goToDetails = (row) => {
    console.log('跳转到详情页, ID:', row.id)
    router.push({
        name: 'device-details', // 使用我们刚才在路由中定义的 name
        params: { id: row.id }  // 传入设备 ID
    })
}

// 顶部卡片数据
const summary = ref({
    total: 0,
    activated: 0,
    online: 0
})
// 选择的数据中心
const dataCenterMap = {
    'CN': '中国数据中心',
    'US-WEST': '美西数据中心',
    'EU-CENTRAL': '中欧数据中心',
    'IN': '印度数据中心',
    'US-EAST': '美东数据中心',
    'EU-WEST': '西欧数据中心',
    'SG': '新加坡数据中心',
}

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
const selectedCenter = ref('CN')

// 分页数据
const pagination = reactive({
    currentPage: 1, // 当前页码
    pageSize: 10,   // 每页显示条数
    total: 0        // 总条目数
})
// --- API 请求函数 ---

// 获取顶部统计数据
const fetchSummary = async () => {
    try {
        // ▼▼▼ 添加 params，把 selectedCenter 的值传出去 ▼▼▼
        const response = await api.get(`/devices/summary`, {
            params: {
                dataCenter: selectedCenter.value
            }
        })
        summary.value = response.data.data
    } catch (error) {
        ElMessage.error('获取统计数据失败')
        console.error(error)
    }
}

// 辅助函数：根据状态返回对应的 Element Plus Tag 类型
const getStatusType = (status) => {
    switch (status) {
        case '在线': return 'success'   // 绿色
        case '离线': return 'info'      // 灰色
        case '故障': return 'danger'    // 红色
        case '未激活': return 'warning' // 黄色
        default: return ''             // 默认蓝色
    }
}

// 获取设备列表数据
const fetchDevices = async () => {
    loading.value = true
    try {
        // 1. 准备原始参数
        const { isBound, productId, dateRange, keyword } = filters
        const rawParams = {
            isBound,
            productId,
            q: keyword,
            // 将 startDate 映射为 gmtActive_gte (激活时间 >= 开始日期)
            gmtActive_gte: dateRange && dateRange[0] ? dateRange[0].toISOString().split('T')[0] + ' 00:00:00' : null,
            // 将 endDate 映射为 gmtActive_lte (激活时间 <= 结束日期)
            // 注意：为了包含结束当天的所有时间，我们加上 23:59:59
            gmtActive_lte: dateRange && dateRange[1] ? dateRange[1].toISOString().split('T')[0] + ' 23:59:59' : null,
            dataCenter: selectedCenter.value,

            //  新增：为 json-server 添加分页参数
            _page: pagination.currentPage,
            _limit: pagination.pageSize
        }

        // 2. ✨ 关键修改：创建一个新对象，只存入有值的参数 ✨
        const params = {}
        for (const key in rawParams) {
            if (rawParams[key] !== null && rawParams[key] !== undefined && rawParams[key] !== '') {
                params[key] = rawParams[key]
            }
        }

        // 3. 发送请求
        const response = await api.get(`/devices`, { params })

        // 4. ✨ 修改：从响应头获取总数
        // json-server 会在 'x-total-count' 响应头中返回总条目数
        // ▼▼▼ 3.2 新增：从响应头获取总数 ▼▼▼
        // json-server 会把总数放在 'x-total-count' 响应头里
        // 我们需要把它取出来，更新到 pagination.total 状态上
        pagination.total = Number(response.headers['x-total-count'] || 0)
        console.log('总设备数:', pagination.total);
        // 5. 更新列表数据
        deviceList.value = response.data.data
    } catch (error) {
        ElMessage.error('获取设备列表失败')
        console.error(error)
    } finally {
        loading.value = false
    }
}


// --- 事件处理函数 ---

// 切换数据中心
const handleCenterChange = (command) => {
    console.log('数据中心切换为:', command)
    selectedCenter.value = command

    pagination.currentPage = 1 //  重置到第一页
    // 一旦切换了数据中心，我们就应该重新获取数据
    // (我们也会在 onMounted 中调用它，以加载默认数据中心的数据)
    fetchDevices()
    fetchSummary()
}


const handleSearch = () => {
    // 触发搜索，（在真实后端中）会根据 filters 重新获取数据
    ElMessage.success('正在搜索...')

    pagination.currentPage = 1 //  重置到第一页

    fetchDevices()
}

const handleReset = () => {
    // 重置所有筛选条件
    filters.isBound = ''
    filters.productId = ''
    filters.dateRange = ''
    filters.keyword = ''
    ElMessage.info('已重置')

    pagination.currentPage = 1
    pagination.pageSize = 10 //  重置到第一页

    fetchDevices()
}

// 新增分页事件处理函数
/** 当每页条数 (pageSize) 改变时触发 */
const handleSizeChange = (newSize) => {
    console.log(`每页 ${newSize} 条`)
    pagination.pageSize = newSize
    // 切换每页条数时，重置到第1页
    pagination.currentPage = 1
    fetchDevices()
}

/** 当页码 (currentPage) 改变时触发 */
const handleCurrentChange = (newPage) => {
    console.log(`翻到第 ${newPage} 页`)
    pagination.currentPage = newPage
    // 只需要获取新一页的数据
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

/* 这段代码的意思是：
  找到 class 为 "filter-form" 的元素 (我们的表单),
  然后找到它里面的 "el-form-item",
  再找到它里面的 "el-select" (我们的下拉框),
  然后把它们的宽度统一设置为 150px。
*/
.filter-form .el-form-item .el-select {
    width: 150px;
}

/* 您可能还想让“设备ID/设备名称”输入框也长一点，
  可以用类似的方法：
*/
.filter-form .el-form-item .el-input {
    width: 500px;
}

.stat-card :deep(.el-card__body) {
    padding: 20px;
}

.stat-item {
    display: flex;
    align-items: center;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 20px;
}

.stat-icon .el-icon {
    font-size: 30px;
    color: #fff;
}

/* 不同颜色的图标背景 */
.blue-bg {
    background: linear-gradient(135deg, #36d1dc, #5b86e5);
}

.green-bg {
    background: linear-gradient(135deg, #67b26f, #4ca2cd);
}

.purple-bg {
    background: linear-gradient(135deg, #f6d365, #fda085);
    /* 这里其实是橙色渐变，你可以自己改 */
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-info .label {
    font-size: 14px;
    color: #909399;
}

.stat-info .value {
    font-size: 28px;
    font-weight: bold;
    color: #303133;
    margin-top: 5px;
}

/* 自定义分页样式 */
.pagination-block {
    /* 1. 增加一个上边距，和表格拉开距离 */
    margin-top: 24px;

    /* 2. 增加一个上内边距，让分割线和分页条之间也有距离 */
    padding-top: 20px;

    /* 3. (现代化) 增加一条浅色上边框作为分割线 */
    border-top: 1px solid var(--el-border-color-lighter);

    /* 4. (居中) 使用 flex 布局让内部的 el-pagination 组件居中 */
    display: flex;
    justify-content: center;
}

/* 1. 统一放大字体和图标
  我们使用 :deep() 深度选择器来修改子组件的样式。
  --el-font-size-base 是 Element Plus 的基础字号变量，
  我们把它从 14px 提升到 16px，所有相关文字都会变大。
*/
.pagination-block :deep(.el-pagination) {
    --el-font-size-base: 16px;
}

/* 2. 让页码按钮更大、更圆润，更易点击
*/
.pagination-block :deep(.el-pager li) {
    min-width: 36px;
    /* 增加按钮宽度 */
    height: 36px;
    /* 增加按钮高度 */
    line-height: 36px;
    /* 垂直居中 */
    border-radius: 6px;
    /* 增加圆角，看起来更现代 */
}

/* 3. 增加一个更柔和、现代的 hover 效果 
*/
.pagination-block :deep(.el-pager li:not(.is-active):hover) {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9) !important;
}

/* 4. 左右箭头按钮也应用相同的尺寸和圆角 
*/
.pagination-block :deep(.el-pagination button) {
    min-width: 36px;
    height: 36px;
    border-radius: 6px;
}

/* 5. "前往" 输入框也使用圆角
*/
.pagination-block :deep(.el-pagination__jump .el-input__wrapper) {
    border-radius: 6px;
}

/* 自定义分页样式结束 */
</style>