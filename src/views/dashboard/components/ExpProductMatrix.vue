<template>
    <div class="product-matrix-section">
        <div class="section-header">
            <h3 class="section-title">产品监控矩阵</h3>
            <div class="section-actions">
                <el-button link type="primary">查看全部产品</el-button>
            </div>
        </div>

        <div class="product-grid">
            <div v-for="item in products" :key="item.id" class="product-item-card hover-lift">
                <div class="item-header">
                    <div class="product-icon" :class="`is-${item.status}`">
                        <el-icon>
                            <component :is="item.icon" />
                        </el-icon>
                    </div>
                    <div class="status-indicator">
                        <span class="status-dot" :class="item.status"></span>
                        <span class="status-text">{{ formatStatus(item.status) }}</span>
                    </div>
                </div>

                <div class="item-body">
                    <h4 class="product-name">{{ item.name }}</h4>
                    <div class="product-meta">
                        <span class="category-tag">{{ item.category }}</span>
                        <span class="version-tag">Build {{ item.version }}</span>
                    </div>
                </div>

                <div class="item-footer">
                    <div class="progress-info">
                        <span class="label">在线率</span>
                        <span class="value">{{ item.onlineCount }} / {{ item.totalCount }}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-fill" :class="item.status"
                            :style="{ width: `${(item.onlineCount / item.totalCount) * 100}%` }"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ProductStatusItem } from '@/types/dashboard';

defineProps<{
    products: ProductStatusItem[]
}>();

const formatStatus = (status: string) => {
    const map: Record<string, string> = {
        'healthy': '运行正常',
        'warning': '存在告警',
        'offline': '链接中断'
    };
    return map[status] || status;
};
</script>

<style scoped>
.product-matrix-section {
    margin-bottom: 2rem;
    font-family: 'Inter', system-ui, sans-serif;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
}

/* Grid 布局 */
.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.product-item-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 1rem;
    padding: 1.25rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.08);
    border-color: #dbeafe;
}

/* 头部样式 */
.item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.product-icon {
    width: 44px;
    height: 44px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.product-icon.is-healthy {
    background: #eff6ff;
    color: #3b82f6;
}

.product-icon.is-warning {
    background: #fffbeb;
    color: #f59e0b;
}

.product-icon.is-offline {
    background: #f8fafc;
    color: #94a3b8;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: #f8fafc;
    border-radius: 99px;
    border: 1px solid #f1f5f9;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.status-dot.healthy {
    background: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-dot.warning {
    background: #f59e0b;
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.status-dot.offline {
    background: #94a3b8;
}

.status-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
}

/* 主体样式 */
.product-name {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.product-meta {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
}

.category-tag {
    font-size: 0.7rem;
    padding: 2px 6px;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 4px;
}

.version-tag {
    font-size: 0.7rem;
    padding: 2px 6px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 4px;
    font-family: monospace;
}

/* 底部进度条 */
.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
}

.progress-info .label {
    color: #94a3b8;
}

.progress-info .value {
    color: #1e293b;
    font-weight: 600;
}

.progress-bar-container {
    width: 100%;
    height: 6px;
    background: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 1s ease-out;
}

.progress-fill.healthy {
    background: #3b82f6;
}

.progress-fill.warning {
    background: #f59e0b;
}

.progress-fill.offline {
    background: #cbd5e1;
}
</style>