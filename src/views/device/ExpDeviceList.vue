<template>
    <div class="page-container">
        <el-row :gutter="20" class="mb-6">
            <el-col :xs="24" :sm="8">
                <StatCard label="设备总数" :value="summary.total" :icon-component="Monitor" color-theme="blue" />
            </el-col>
            <el-col :xs="24" :sm="8">
                <StatCard label="在线设备" :value="summary.online" :icon-component="Connection" color-theme="green" />
            </el-col>
            <el-col :xs="24" :sm="8">
                <StatCard label="异常/故障" :value="summary.total - summary.activated" :icon-component="Warning"
                    color-theme="orange" />
            </el-col>
        </el-row>

        <div class="card-base main-table-card">
            <div class="toolbar">
                <div class="toolbar-left">
                    <el-input v-model="filters.keyword" placeholder="搜索设备名称/SN..." prefix-icon="Search" clearable
                        class="filter-item w-300" @keyup.enter="handleSearch" />
                    <el-select v-model="filters.productId" placeholder="所有产品" clearable class="filter-item w-150">
                        <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
                    </el-select>
                    <el-select v-model="filters.isBound" placeholder="绑定状态" clearable class="filter-item w-120">
                        <el-option label="已绑定" :value="'true'" />
                        <el-option label="未绑定" :value="'false'" />
                    </el-select>
                    <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
                </div>
                <div class="toolbar-right">
                    <el-button icon="Refresh" circle @click="refresh" />
                    <el-button icon="Download" circle />
                </div>
            </div>

            <el-table v-loading="loading" :data="deviceList" style="width: 100%"
                @selection-change="handleSelectionChange" class="modern-table">
                <el-table-column type="selection" width="55" />

                <el-table-column label="设备名称" min-width="180">
                    <template #default="{ row }">
                        <div class="device-name-cell">
                            <span class="name-text" @click="openDetail(row)">{{ row.name }}</span>
                            <el-tag v-if="row.hasNewFirmware" size="small" type="danger" effect="plain"
                                class="ml-2">Update</el-tag>
                        </div>
                        <div class="sn-text">{{ row.sn }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="120">
                    <template #default="{ row }">
                        <span class="status-capsule" :class="getStatusClass(row.status)">
                            <span class="dot"></span>
                            {{ row.status }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column prop="productInfo" label="产品信息" min-width="150" />
                <el-table-column prop="dataCenter" label="区域" width="100" />
                <el-table-column prop="gmtLastOnline" label="最后在线" width="180" />

                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openDetail(row)">详情</el-button>
                        <el-button link type="danger">解绑</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-bar">
                <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                    :total="pagination.total" :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" />
            </div>
        </div>

        <Transition name="slide-up">
            <div v-if="selectedRows.length > 0" class="floating-bar glass-effect">
                <span class="selection-count">已选择 {{ selectedRows.length }} 项</span>
                <div class="bar-actions">
                    <el-button type="danger" text bg icon="Delete">批量删除</el-button>
                    <el-button type="primary" text bg icon="RefreshRight">批量重启</el-button>
                    <el-button type="success" text bg icon="VideoPlay">启用</el-button>
                    <el-divider direction="vertical" />
                    <el-button icon="Close" circle @click="clearSelection" />
                </div>
            </div>
        </Transition>

        <ExpDeviceDetailDrawer v-model="drawerVisible" :device="currentDevice" />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Monitor, Connection, Warning, Search, Refresh, Download, Delete, RefreshRight, VideoPlay, Close } from '@element-plus/icons-vue'
import StatCard from '@/components/StatCard.vue'
import ExpDeviceDetailDrawer from '@/components/ExpDeviceDetailDrawer.vue'
import { useDeviceList } from '@/composables/useDeviceList'
import { useDeviceSummary } from '@/composables/useDeviceSummary'
import { fetchProducts } from '@/api'
import type { Device, Product } from '@/types'

// 组合式函数
const {
    loading,
    deviceList,
    pagination,
    fetchDevices,
    handleSizeChange,
    handleCurrentChange
} = useDeviceList()

const { summary, fetchSummary } = useDeviceSummary()

// 本地状态
const filters = reactive({
    keyword: '',
    productId: '',
    isBound: ''
})
const products = ref<Product[]>([])
const selectedRows = ref<Device[]>([])
const drawerVisible = ref(false)
const currentDevice = ref<Device | null>(null)

// 初始化
onMounted(async () => {
    fetchDevices()
    fetchSummary('') // 获取全局统计
    products.value = await fetchProducts()
})

// 搜索处理
const handleSearch = () => {
    fetchDevices({
        keyword: filters.keyword,
        productId: filters.productId,
        isBound: filters.isBound
    })
}

const refresh = () => {
    fetchDevices()
    fetchSummary('')
}

// 表格选择
const handleSelectionChange = (rows: Device[]) => {
    selectedRows.value = rows
}

const clearSelection = () => {
    // Element Plus 表格需要通过 ref 清除选择，这里简化处理，实际需绑定 table ref
    selectedRows.value = []
    window.location.reload() // 临时暴力清除，实际应使用 tableRef.value.clearSelection()
}

// 详情抽屉
const openDetail = (row: Device) => {
    currentDevice.value = row
    drawerVisible.value = true
}

// 样式辅助
const getStatusClass = (status: string) => {
    switch (status) {
        case '在线': return 'status-online'
        case '离线': return 'status-offline'
        case '故障': return 'status-error'
        default: return 'status-default'
    }
}
</script>

<style scoped>
.mb-6 {
    margin-bottom: 24px;
}

.w-300 {
    width: 300px;
}

.w-150 {
    width: 150px;
}

.w-120 {
    width: 120px;
}

.ml-2 {
    margin-left: 8px;
}

.main-table-card {
    padding: 24px;
    min-height: 600px;
    display: flex;
    flex-direction: column;
}

/* 工具栏 */
.toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
}

.toolbar-left {
    display: flex;
    gap: 12px;
}

.filter-item {
    /* 覆盖 element 默认样式以匹配设计 */
}

/* 表格样式优化 */
.modern-table :deep(.el-table__inner-wrapper::before) {
    display: none;
    /* 移除底部横线 */
}

.modern-table :deep(.el-table__row) {
    height: 64px;
    /* 增加行高 */
}

.device-name-cell {
    display: flex;
    align-items: center;
}

.name-text {
    font-weight: 600;
    color: var(--color-primary);
    cursor: pointer;
}

.sn-text {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 2px;
}

/* 状态胶囊 */
.status-capsule {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 500;
}

.status-capsule .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

.status-online {
    background-color: #ecfdf5;
    color: #059669;
}

.status-online .dot {
    background-color: #059669;
}

.status-offline {
    background-color: #f1f5f9;
    color: #64748b;
}

.status-offline .dot {
    background-color: #94a3b8;
}

.status-error {
    background-color: #fef2f2;
    color: #dc2626;
}

.status-error .dot {
    background-color: #dc2626;
}

/* 分页栏 */
.pagination-bar {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    justify-content: flex-end;
}

/* 悬浮操作栏 */
.floating-bar {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99;
    padding: 12px 24px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    gap: 24px;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translate(-50%, 100%);
    opacity: 0;
}

.selection-count {
    font-weight: 600;
    color: var(--text-primary);
}
</style>