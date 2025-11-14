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

        <div class="product-stats">
            <div class="stat-item">
                <div class="stat-label">固件版本</div>
                <div class="stat-value">12</div>
            </div>
            <div class="divider-line"></div>
            <div class="stat-item">
                <div class="stat-label">最新发布</div>
                <div class="stat-value">2小时前</div>
            </div>
            <div class="divider-line"></div>
            <div class="stat-item">
                <div class="stat-label">活跃设备</div>
                <div class="stat-value highlight">85%</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/* Script 部分保持不变，直接复用上一版的逻辑 */
import { Cpu, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'

const props = defineProps<{
    product: Product
}>()

const copyId = async () => {
    try {
        await navigator.clipboard.writeText(props.product.id)
        ElMessage.success('Product ID 已复制')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}
</script>

<style scoped>
.exp-header-card {
    background: #ffffff;
    border-radius: 16px;
    /* 更大的圆角 */
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* 移除显式边框，改用柔和阴影 */
    border: none;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
}

/* ✨ 魔法：添加一个极淡的顶部色彩光晕 */
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
    /* 超大圆角 */
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.1);
}

.gradient-icon {
    /* 图标渐变色 */
    color: #409eff;
    background: -webkit-linear-gradient(45deg, #409eff, #36cfc9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.product-name {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    /* 更粗的字体 */
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

/* 统计区域优化 */
.product-stats {
    display: flex;
    align-items: center;
    background: #f8f9fb;
    padding: 12px 24px;
    border-radius: 12px;
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