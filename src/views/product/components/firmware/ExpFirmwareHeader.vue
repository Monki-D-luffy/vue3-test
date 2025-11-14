<template>
    <div class="exp-header-card colorful-bg">
        <div class="product-main">
            <div class="icon-wrapper">
                <el-icon :size="32" class="gradient-icon">
                    <Cpu />
                </el-icon>
            </div>
            <div class="info-content">
                <div class="title-row">
                    <h1 class="product-name">{{ product.name }}</h1>
                    <el-tag type="primary" effect="dark" round class="ml-2 custom-tag">
                        {{ product.type }}
                    </el-tag>
                </div>
                <div class="id-row">
                    <span class="label">ID:</span>
                    <span class="value code-font">{{ product.id }}</span>
                    <el-icon class="copy-icon" @click="copyId">
                        <CopyDocument />
                    </el-icon>
                </div>
            </div>
        </div>

        <div class="product-stats" v-loading="loading">
            <div class="stat-item">
                <div class="stat-label">固件版本</div>
                <div class="stat-value">{{ stats.firmwareCount }}</div>
            </div>
            <div class="divider-line"></div>
            <div class="stat-item">
                <div class="stat-label">最新发布</div>
                <div class="stat-value">{{ stats.latestRelease }}</div>
            </div>
            <div class="divider-line"></div>
            <div class="stat-item">
                <div class="stat-label">活跃设备</div>
                <div class="stat-value highlight">{{ stats.activeRate }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { Cpu, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'
// 引入 API 和工具
import { fetchFirmwares } from '@/api'
import api from '@/api' // 直接用 axios 实例查设备
import { formatTimeAgo } from '@/utils/formatters'

const props = defineProps<{
    product: Product
}>()

const loading = ref(false)
const stats = reactive({
    firmwareCount: 0,
    latestRelease: '--',
    activeRate: '--'
})

const copyId = async () => {
    try {
        await navigator.clipboard.writeText(props.product.id)
        ElMessage.success('Product ID 已复制')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}

// 核心逻辑：加载真实统计数据
const loadStats = async () => {
    if (!props.product?.id) return

    loading.value = true
    try {
        // 1. 获取固件信息 (数量 & 最新时间)
        // 只需要取第1页的1条数据，利用排序获取最新的，利用 total 获取总数
        const fwRes = await fetchFirmwares({
            productId: props.product.id,
            _page: 1,
            _limit: 1,
            _sort: 'uploadedAt',
            _order: 'desc'
        })

        stats.firmwareCount = fwRes.total
        if (fwRes.items && fwRes.items.length > 0) {
            const uploadedAt = fwRes.items[0]?.uploadedAt
            stats.latestRelease = uploadedAt ? formatTimeAgo(uploadedAt) : '无'
        } else {
            stats.latestRelease = '无'
        }

        // 2. 获取设备活跃度 (在线率)
        // 注意：这里简单拉取该产品下所有设备进行计算
        // 在真实生产环境中，应该有一个专门的 /products/{id}/stats 接口
        const devRes = await api.get('/devices', {
            params: { productId: props.product.id }
        })
        // 兼容 mock server 返回结构
        const devices = devRes.data.data || []
        const totalDev = devices.length

        if (totalDev > 0) {
            const onlineCount = devices.filter((d: any) => d.status === '在线').length
            const rate = Math.round((onlineCount / totalDev) * 100)
            stats.activeRate = `${rate}%`
        } else {
            stats.activeRate = '0%'
        }

    } catch (error) {
        console.error('加载统计失败', error)
        stats.firmwareCount = 0
        stats.latestRelease = '--'
        stats.activeRate = '--'
    } finally {
        loading.value = false
    }
}

// 监听产品切换，重新加载数据
watch(() => props.product.id, () => {
    loadStats()
}, { immediate: true })

</script>

<style scoped>
.exp-header-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: none;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
}

.colorful-bg::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #409eff, #a0cfff);
}

.product-main {
    display: flex;
    align-items: center;
    gap: 20px;
}

.icon-wrapper {
    width: 64px;
    height: 64px;
    background-color: #f0f7ff;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.1);
}

.gradient-icon {
    color: #409eff;
    background: -webkit-linear-gradient(45deg, #409eff, #36cfc9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.product-name {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.5px;
}

.custom-tag {
    border: none;
    background: linear-gradient(135deg, #409eff, #79bbff);
    font-weight: 600;
    padding: 0 12px;
}

.id-row {
    margin-top: 8px;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #909399;
}

.code-font {
    font-family: 'Monaco', monospace;
    color: #606266;
    background: #f2f3f5;
    padding: 3px 8px;
    border-radius: 6px;
    margin: 0 8px;
    font-weight: 500;
}

.copy-icon {
    cursor: pointer;
    color: #c0c4cc;
    transition: color 0.2s;
}

.copy-icon:hover {
    color: #409eff;
}

/* 统计区域 */
.product-stats {
    display: flex;
    align-items: center;
    background: #f8f9fb;
    padding: 12px 24px;
    border-radius: 12px;
    min-width: 300px;
    /* 稍微加宽一点 */
    justify-content: space-around;
}

.stat-item {
    text-align: center;
    min-width: 80px;
}

.stat-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #2c3e50;
}

.stat-value.highlight {
    color: #67c23a;
}

.divider-line {
    width: 1px;
    height: 24px;
    background-color: #e4e7ed;
    margin: 0 16px;
}
</style>