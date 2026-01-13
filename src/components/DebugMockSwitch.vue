<template>
    <div class="debug-container">
        <div class="mock-pill" :class="{ 'is-mock': isMock, 'is-real': !isMock }" @click="toggleMode">
            <div class="glow-effect"></div>

            <div class="pill-content">
                <div class="icon-wrapper">
                    <el-icon v-if="isMock" class="state-icon">
                        <MagicStick />
                    </el-icon>
                    <el-icon v-else class="state-icon">
                        <Connection />
                    </el-icon>
                </div>

                <div class="info-group">
                    <span class="label">DATA SOURCE</span>
                    <span class="value">{{ isMock ? 'MOCK SERVER' : 'REAL API' }}</span>
                </div>

                <div class="status-light"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Connection, MagicStick } from '@element-plus/icons-vue'

const STORAGE_KEY = 'USE_MOCK_DATA'
// 初始化状态
const isMock = ref(localStorage.getItem(STORAGE_KEY) === 'true')

const toggleMode = () => {
    const nextMode = !isMock.value
    const modeName = nextMode ? 'MOCK (模拟数据)' : 'REAL (真实接口)'
    const color = nextMode ? '#e6a23c' : '#67c23a'

    ElMessageBox.confirm(
        `即将切换数据源至：<span style="color:${color};font-weight:bold">${modeName}</span><br/><br/><span style="font-size:12px;color:#909399">切换后页面将自动刷新以应用新的 BaseURL 配置。</span>`,
        '切换环境',
        {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '立即切换',
            cancelButtonText: '取消',
            confirmButtonClass: nextMode ? 'el-button--warning' : 'el-button--success',
            type: nextMode ? 'warning' : 'success',
            center: true
        }
    ).then(() => {
        localStorage.setItem(STORAGE_KEY, String(nextMode))
        // 添加一个小延迟让用户看到按钮状态变化（可选）
        isMock.value = nextMode
        setTimeout(() => {
            window.location.reload()
        }, 300)
    }).catch(() => {
        // 取消无操作
    })
}
</script>

<style scoped>
.debug-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9000;
    /* 确保在最上层 */
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.mock-pill {
    position: relative;
    display: flex;
    align-items: center;
    height: 44px;
    padding: 0 6px;
    border-radius: 22px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    user-select: none;
    overflow: hidden;
}

/* 暗黑模式适配 */
:global(.dark) .mock-pill {
    background: rgba(30, 30, 30, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
}

.mock-pill:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.mock-pill:active {
    transform: translateY(0) scale(0.96);
}

/* === 状态配色 === */

/* Real Mode Style */
.mock-pill.is-real .icon-wrapper {
    background: linear-gradient(135deg, #67c23a, #409eff);
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

.mock-pill.is-real .status-light {
    background-color: #67c23a;
    box-shadow: 0 0 10px #67c23a;
}

.mock-pill.is-real .glow-effect {
    background: radial-gradient(circle at center, rgba(103, 194, 58, 0.15) 0%, transparent 70%);
}

/* Mock Mode Style */
.mock-pill.is-mock {
    border-color: rgba(230, 162, 60, 0.3);
}

.mock-pill.is-mock .icon-wrapper {
    background: linear-gradient(135deg, #e6a23c, #f56c6c);
    box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
}

.mock-pill.is-mock .status-light {
    background-color: #e6a23c;
    box-shadow: 0 0 10px #e6a23c;
    animation: pulse 1.5s infinite;
}

.mock-pill.is-mock .glow-effect {
    background: radial-gradient(circle at center, rgba(230, 162, 60, 0.15) 0%, transparent 70%);
}

/* === 内部元素 === */

.glow-effect {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
}

.mock-pill:hover .glow-effect {
    opacity: 1;
}

.pill-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: all 0.4s ease;
}

.state-icon {
    font-size: 16px;
}

.info-group {
    display: flex;
    flex-direction: column;
    margin-right: 4px;
}

.label {
    font-size: 9px;
    text-transform: uppercase;
    color: var(--text-secondary, #909399);
    letter-spacing: 0.5px;
    line-height: 1.2;
    font-weight: 600;
}

.value {
    font-size: 13px;
    font-weight: 800;
    color: var(--text-primary, #303133);
    letter-spacing: -0.2px;
    line-height: 1.2;
}

.status-light {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 8px;
    transition: all 0.3s ease;
}

@keyframes pulse {
    0% {
        opacity: 0.4;
        transform: scale(0.8);
    }

    50% {
        opacity: 1;
        transform: scale(1.2);
    }

    100% {
        opacity: 0.4;
        transform: scale(0.8);
    }
}
</style>