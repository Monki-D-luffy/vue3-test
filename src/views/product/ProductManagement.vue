<template>
    <div class="page-container">
        <div class="header-section">
            <div>
                <h1 class="page-title">产品管理</h1>
                <p class="page-subtitle">定义与管理 IoT 设备的产品模型、通讯协议与生命周期</p>
            </div>
            <div class="header-actions">
                <el-button type="primary" size="large" icon="Plus" class="hero-button" @click="handleCreate">
                    创建产品
                </el-button>
            </div>
        </div>

        <el-row :gutter="20" class="metrics-section">
            <el-col :xs="12" :sm="6" v-for="(metric, index) in metrics" :key="index">
                <div class="stat-card card-base">
                    <div class="stat-content">
                        <span class="stat-label">{{ metric.label }}</span>
                        <div class="stat-value-group">
                            <span class="stat-value">{{ formatNumber(metric.value) }}</span>
                            <span v-if="metric.unit" class="stat-unit">{{ metric.unit }}</span>
                        </div>
                    </div>
                    <el-icon class="stat-icon" :class="metric.colorClass">
                        <component :is="metric.icon" />
                    </el-icon>
                    <div v-if="metric.percent" class="stat-progress-bg">
                        <div class="stat-progress-bar" :style="{ width: metric.percent + '%' }"></div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <div class="toolbar-section card-base">
            <div class="toolbar-left">
                <el-input v-model="searchKeyword" placeholder="搜索产品名称或 PID..." class="search-input" clearable
                    @input="handleSearch">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>

                <div class="divider-vertical"></div>

                <div class="filter-capsules">
                    <span v-for="filter in statusFilters" :key="filter.value" class="capsule-item"
                        :class="{ active: activeStatus === filter.value }"
                        @click="activeStatus = filter.value; loadData()">
                        {{ filter.label }}
                    </span>
                </div>
            </div>

            <div class="toolbar-right">
                <el-radio-group v-model="viewMode" size="small" class="view-toggle">
                    <el-radio-button value="grid">
                        <el-icon>
                            <Grid />
                        </el-icon>
                    </el-radio-button>
                    <el-radio-button value="list">
                        <el-icon>
                            <Operation />
                        </el-icon>
                    </el-radio-button>
                </el-radio-group>
            </div>
        </div>

        <div class="content-section" v-loading="loading">

            <transition name="el-fade-in-linear" mode="out-in">
                <div v-if="viewMode === 'grid' && products.length > 0" key="grid">
                    <el-row :gutter="20">
                        <el-col v-for="item in products" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="6"
                            class="mb-20">
                            <div class="product-card card-base hover-lift" @click="handleEnter(item.id)">
                                <div class="card-header">
                                    <div class="icon-wrapper" :class="getCategoryClass(item.category)">
                                        <el-icon>
                                            <component :is="getIcon(item.category)" />
                                        </el-icon>
                                    </div>
                                    <el-tag :type="getStatusType(item.status)" effect="light" size="small"
                                        class="status-tag">
                                        {{ item.status }}
                                    </el-tag>
                                </div>

                                <div class="card-body">
                                    <h3 class="product-name">{{ item.name }}</h3>
                                    <div class="product-meta">
                                        <span class="pid-badge">{{ item.id }}</span>
                                        <span class="protocol-text">
                                            <el-icon>
                                                <Connection />
                                            </el-icon> {{ item.protocol }}
                                        </span>
                                    </div>
                                </div>

                                <div class="card-footer">
                                    <div class="data-item">
                                        <span class="label">在线设备</span>
                                        <span class="value">{{ formatNumber(item.activeDeviceCount) }}</span>
                                    </div>
                                    <div class="data-item text-right">
                                        <span class="label">固件版本</span>
                                        <span class="value font-mono">{{ item.latestFirmware || '--' }}</span>
                                    </div>
                                </div>

                                <div class="card-actions-overlay">
                                    <el-button type="primary" round size="small" @click.stop="handleEnter(item.id)">
                                        进入控制台
                                    </el-button>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </div>

                <div v-else-if="viewMode === 'list' && products.length > 0" key="list" class="card-base list-container">
                    <el-table :data="products" style="width: 100%" @row-click="(row) => handleEnter(row.id)">
                        <el-table-column label="产品信息" min-width="240">
                            <template #default="{ row }">
                                <div class="flex-center-row">
                                    <div class="list-icon-box" :class="getCategoryClass(row.category)">
                                        <el-icon>
                                            <component :is="getIcon(row.category)" />
                                        </el-icon>
                                    </div>
                                    <div class="ml-12">
                                        <div class="font-bold text-main">{{ row.name }}</div>
                                        <div class="text-xs text-sub">PID: {{ row.id }}</div>
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="protocol" label="通讯协议" width="120">
                            <template #default="{ row }">
                                <el-tag size="small" type="info" effect="plain">{{ row.protocol }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" width="100">
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="activeDeviceCount" label="激活设备" width="120" align="right" />
                        <el-table-column label="操作" width="100" align="right">
                            <template #default>
                                <el-button link type="primary">管理</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <div v-else-if="!loading" key="empty" class="empty-container">
                    <el-empty description="暂无符合条件的产品" />
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, markRaw } from 'vue' // 修复点 0: 引入 markRaw
import { useRouter } from 'vue-router'
import {
    Search, Plus, Grid, Operation, Connection,
    Files, DataLine, Bell, Sunny, Odometer, Cpu, Box, Lock
} from '@element-plus/icons-vue'
import type { ProductListItem, DeviceType } from '@/types/product'

// --- 类型定义 (Mock) ---
const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const activeStatus = ref('ALL')
const viewMode = ref<'grid' | 'list'>('grid')
const products = ref<ProductListItem[]>([])

// 统计指标数据
// 修复点 1: 使用 markRaw 包裹组件对象
const metrics = reactive([
    { label: 'Total Products', value: 0, unit: '个', icon: markRaw(Files), colorClass: 'text-primary', percent: 0 },
    { label: 'Development', value: 0, unit: '项', icon: markRaw(DataLine), colorClass: 'text-warning', percent: 65 },
    { label: 'Active Devices', value: 0, unit: '在线', icon: markRaw(Connection), colorClass: 'text-success', percent: 0 },
    { label: 'Alerts', value: 0, unit: '告警', icon: markRaw(Bell), colorClass: 'text-danger', percent: 0 },
])

// 筛选配置
const statusFilters = [
    { label: '全部', value: 'ALL' },
    { label: '开发中', value: 'DEVELOPMENT' },
    { label: '已发布', value: 'RELEASED' },
    { label: '异常', value: 'ALERT' },
]

// --- 辅助函数 ---
const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num
}

const getIcon = (cat: DeviceType) => {
    const map: any = { 'LIGHT': Sunny, 'SENSOR': Odometer, 'GATEWAY': Cpu, 'LOCK': Lock }
    return map[cat] || Box
}

const getCategoryClass = (cat: DeviceType) => {
    const map: Record<string, string> = {
        'LIGHT': 'icon-bg-orange',
        'SENSOR': 'icon-bg-blue',
        'GATEWAY': 'icon-bg-purple',
        'LOCK': 'icon-bg-teal'
    }
    return map[cat] || 'icon-bg-gray'
}

const getStatusType = (status: string) => {
    if (status === 'RELEASED') return 'success'
    if (status === 'ALERT') return 'danger'
    if (status === 'DEVELOPMENT') return 'warning'
    return 'info'
}

// --- 数据逻辑 ---
const loadData = async () => {
    loading.value = true
    // 模拟 API 请求延迟
    setTimeout(() => {
        const mockList: ProductListItem[] = Array.from({ length: 12 }).map((_, i) => ({
            id: `PID-${1000 + i}`,
            name: i % 2 === 0 ? `智能 WiFi 插座 Gen${i}` : `Zigbee 温湿度传感器 Pro`,
            category: i % 2 === 0 ? 'SWITCH' : 'SENSOR',
            protocol: i % 2 === 0 ? 'WIFI' : 'ZIGBEE',
            status: i === 0 ? 'ALERT' : (i % 3 === 0 ? 'RELEASED' : 'DEVELOPMENT'),
            activeDeviceCount: Math.floor(Math.random() * 5000),
            alertCount: i === 0 ? 5 : 0,
            latestFirmware: 'v1.0.2',
            lastUpdateTime: Date.now()
        }))

        // 简单筛选
        products.value = mockList.filter(p => {
            const matchSearch = p.name.includes(searchKeyword.value) || p.id.includes(searchKeyword.value)
            const matchStatus = activeStatus.value === 'ALL' || p.status === activeStatus.value
            return matchSearch && matchStatus
        })

        // 更新指标
        metrics[0].value = mockList.length
        metrics[1].value = mockList.filter(p => p.status === 'DEVELOPMENT').length
        metrics[2].value = mockList.reduce((a, b) => a + b.activeDeviceCount, 0)
        metrics[3].value = mockList.filter(p => p.status === 'ALERT').length

        loading.value = false
    }, 600)
}

const handleSearch = () => loadData()
const handleCreate = () => router.push({ name: 'ProductCreate' })
const handleEnter = (pid: string) => router.push({ name: 'ProductOverview', params: { pid } })

onMounted(() => {
    loadData()
})
</script>

<style scoped>
/* --- 全局容器与变量继承 --- */
.page-container {
    min-height: 100%;
    padding: 24px;
    background-color: var(--app-bg-canvas);
    /* 继承自 FirmwareManagement */
    color: var(--app-text-main);
}

/* --- 头部 --- */
.header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
}

.page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--app-text-main);
    margin: 0 0 8px 0;
}

.page-subtitle {
    font-size: 14px;
    color: var(--app-text-sub);
    margin: 0;
}

.hero-button {
    padding-left: 24px;
    padding-right: 24px;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    transition: transform 0.2s;
}

.hero-button:active {
    transform: scale(0.96);
}

/* --- 通用卡片基类 (类似 FirmwareManagement 的 card-base) --- */
.card-base {
    background-color: var(--app-bg-card);
    border-radius: 12px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    /* 柔和阴影 */
    border: 1px solid transparent;
    transition: all 0.3s ease;
}

/* --- Metrics 区域 --- */
.metrics-section {
    margin-bottom: 24px;
}

.stat-card {
    position: relative;
    padding: 20px;
    height: 110px;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}

.stat-label {
    font-size: 13px;
    color: var(--app-text-sub);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--app-text-main);
    line-height: 1;
}

.stat-unit {
    font-size: 12px;
    color: var(--app-text-sub);
    margin-left: 4px;
}

.stat-icon {
    font-size: 64px;
    position: absolute;
    right: -10px;
    bottom: -15px;
    opacity: 0.1;
    transform: rotate(15deg);
    z-index: 1;
    transition: opacity 0.3s;
}

.stat-card:hover .stat-icon {
    opacity: 0.2;
}

/* 颜色辅助类 */
.text-primary {
    color: var(--el-color-primary);
}

.text-success {
    color: var(--el-color-success);
}

.text-warning {
    color: var(--el-color-warning);
}

.text-danger {
    color: var(--el-color-danger);
}

.stat-progress-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: rgba(0, 0, 0, 0.05);
}

.stat-progress-bar {
    height: 100%;
    background-color: var(--el-color-warning);
    /* 默认 */
}

/* --- 工具栏区域 --- */
.toolbar-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    margin-bottom: 24px;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.search-input {
    width: 280px;
    --el-input-bg-color: transparent;
    --el-input-border-color: transparent;
}

:deep(.search-input .el-input__wrapper) {
    background-color: var(--app-bg-canvas);
    box-shadow: none !important;
    border-radius: 8px;
}

:deep(.search-input .el-input__wrapper.is-focus) {
    background-color: var(--app-bg-card);
    box-shadow: 0 0 0 1px var(--el-color-primary) !important;
}

.divider-vertical {
    width: 1px;
    height: 20px;
    background-color: var(--el-border-color-light);
}

.filter-capsules {
    display: flex;
    gap: 8px;
}

.capsule-item {
    padding: 6px 16px;
    font-size: 13px;
    border-radius: 20px;
    cursor: pointer;
    color: var(--app-text-sub);
    transition: all 0.2s;
}

.capsule-item:hover {
    background-color: var(--app-bg-canvas);
    color: var(--app-text-main);
}

.capsule-item.active {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
}

/* --- 产品卡片 --- */
.mb-20 {
    margin-bottom: 20px;
}

.product-card {
    position: relative;
    height: 220px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
}

.hover-lift:hover {
    transform: translateY(-4px);
    border-color: var(--el-border-color-lighter);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

/* 动态图标背景色 */
.icon-bg-orange {
    background: rgba(230, 162, 60, 0.1);
    color: #e6a23c;
}

.icon-bg-blue {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
}

.icon-bg-purple {
    background: rgba(155, 89, 182, 0.1);
    color: #9b59b6;
}

.icon-bg-teal {
    background: rgba(20, 184, 166, 0.1);
    color: #14b8a6;
}

.icon-bg-gray {
    background: rgba(144, 147, 153, 0.1);
    color: #909399;
}

.card-body {
    flex: 1;
}

.product-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--app-text-main);
    margin: 0 0 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--app-text-sub);
}

.pid-badge {
    background-color: var(--app-bg-canvas);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
}

.protocol-text {
    display: flex;
    align-items: center;
    gap: 4px;
}

.card-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: space-between;
}

.data-item {
    display: flex;
    flex-direction: column;
}

.data-item .label {
    font-size: 12px;
    color: var(--app-text-sub);
    margin-bottom: 4px;
}

.data-item .value {
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text-main);
}

.text-right {
    text-align: right;
}

/* 悬浮遮罩按钮 */
.card-actions-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    /* 仅在 Dark 下需要调整 */
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 20px;
    opacity: 0;
    transition: opacity 0.3s;
}

.product-card:hover .card-actions-overlay {
    opacity: 1;
}

/* --- 列表视图调整 --- */
.list-container {
    padding: 12px 24px;
}

.flex-center-row {
    display: flex;
    align-items: center;
}

.ml-12 {
    margin-left: 12px;
}

.list-icon-box {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.empty-container {
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>