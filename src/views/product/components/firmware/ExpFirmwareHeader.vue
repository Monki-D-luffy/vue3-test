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
                        {{ product.nodeType === 1 ? '直连设备' : '网关设备' }}
                    </el-tag>
                </div>
                <div class="id-row">
                    <span class="label">ProductKey:</span>
                    <span class="value code-font">{{ product.productKey }}</span>
                    <el-icon class="copy-icon" @click="copyId">
                        <CopyDocument />
                    </el-icon>
                </div>
            </div>
        </div>

        <div class="product-stats" v-loading="loading">
            <div class="stat-item">
                <div class="stat-label">设备总数</div>
                <div class="stat-value">{{ product.deviceCount || 0 }}</div>
            </div>
            <div class="divider-line"></div>
            <div class="stat-item">
                <div class="stat-label">固件版本</div>
                <div class="stat-value">{{ stats.firmwareCount || 0 }}</div>
            </div>
            <div class="divider-line"></div>
            <div class="stat-item">
                <div class="stat-label">待升级</div>
                <div class="stat-value highlight">{{ stats.pendingUpgrade || 0 }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Cpu, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'

const props = defineProps<{
    product: Product
}>()

const loading = ref(false)
const stats = ref({
    firmwareCount: 5,
    latestRelease: 'v1.2.0',
    pendingUpgrade: 12
})

const copyId = () => {
    navigator.clipboard.writeText(props.product.productKey)
    ElMessage.success('ProductKey 已复制')
}

// 模拟加载统计数据
onMounted(() => {
    // 实际逻辑中这里可以调用 API
})
</script>

<style scoped>
/* 核心容器 */
.exp-header-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    border-radius: 16px;
    /* ✅ 修复1：背景色变量化 (默认白昼) */
    background: var(--app-bg-card);
    /* ✅ 修复2：边框颜色变量化 */
    border: 1px solid var(--app-border-color);
    /* ✅ 修复3：阴影变量化 */
    box-shadow: var(--app-shadow-card);
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

/* 顶部彩色装饰条 (保留你的设计) */
.exp-header-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #409eff, #36cfc9);
}

.product-main {
    display: flex;
    align-items: center;
    gap: 20px;
}

.icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    /* ✅ 修复4：使用 Element 填充色变量，自动适配深浅 */
    background: var(--el-fill-color-light);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--app-border-color);
}

.gradient-icon {
    /* 渐变图标在暗黑模式下依然可以保持，或者根据需要调整 */
    background: -webkit-linear-gradient(45deg, #409eff, #36cfc9);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.info-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.product-name {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    /* ✅ 修复5：主标题文字颜色 */
    color: var(--app-text-main);
    letter-spacing: -0.5px;
}

.custom-tag {
    font-weight: 600;
    border: none;
    /* Tag 保持 Element 默认样式即可，或者保留你的渐变 */
    background: linear-gradient(135deg, #409eff, #79bbff);
}

.id-row {
    display: flex;
    align-items: center;
    font-size: 13px;
    /* ✅ 修复6：次级文字颜色 */
    color: var(--app-text-sub);
}

.code-font {
    font-family: 'Monaco', monospace;
    /* ✅ 修复7：代码块背景和文字 */
    color: var(--app-text-main);
    background: var(--el-fill-color);
    padding: 3px 8px;
    border-radius: 6px;
    margin: 0 8px;
    font-weight: 500;
}

.copy-icon {
    cursor: pointer;
    /* ✅ 修复8：图标颜色 */
    color: var(--app-text-placeholder);
    transition: color 0.2s;
}

.copy-icon:hover {
    color: var(--el-color-primary);
}

/* 统计区域 */
.product-stats {
    display: flex;
    align-items: center;
    gap: 40px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.stat-label {
    font-size: 12px;
    /* ✅ 修复9：标签颜色 */
    color: var(--app-text-sub);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    /* ✅ 修复10：数值颜色 */
    color: var(--app-text-main);
    line-height: 1;
    font-family: 'Inter', sans-serif;
}

.stat-value.highlight {
    color: #409eff;
}

.divider-line {
    width: 1px;
    height: 32px;
    /* ✅ 修复11：分割线颜色 */
    background: var(--app-border-color);
}
</style>