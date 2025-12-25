<template>
    <div class="ai-module-wrapper">
        <div class="ai-card-border" :class="{ 'is-loading': loading }">
            <div class="ai-card-inner">
                <div class="ai-input-container">
                    <div class="ai-icon-section">
                        <el-icon v-if="loading" class="is-loading ai-pulse">
                            <Loading />
                        </el-icon>
                        <el-icon v-else class="ai-static-icon">
                            <Microphone />
                        </el-icon>
                    </div>

                    <input v-model="inputVal" class="ai-input-field" type="text"
                        placeholder="输入指令，如：'检查 Zone-A 设备健康度' 或 '生成昨日运行报告'..." @keyup.enter="handleSend"
                        :disabled="loading" />

                    <div class="ai-action-section">
                        <button class="ai-submit-btn" @click="handleSend" :disabled="!inputVal.trim() || loading">
                            <span>执行智能指令</span>
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <transition name="el-zoom-in-top">
            <div v-if="result" class="ai-response-panel dashboard-card">
                <div class="ai-response-header">
                    <div class="ai-avatar">🤖</div>
                    <span class="ai-name">Gemini Intelligence</span>
                    <div class="ai-status-tag">Auto-Diagnosing</div>
                </div>

                <div class="ai-markdown-content" v-html="parsedResult"></div>

                <div class="ai-response-footer">
                    <span class="ai-hint">按 ESC 退出 · 指令已记录至系统日志</span>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGemini } from '@/composables/useGemini';
import { parseMarkdown } from '@/utils/markdown';
import { Microphone, Loading, MagicStick } from '@element-plus/icons-vue';

const inputVal = ref('');
const { loading, result, askAI } = useGemini();

const parsedResult = computed(() => parseMarkdown(result.value));

const handleSend = async () => {
    if (!inputVal.value.trim()) return;
    await askAI(inputVal.value, 'chat');
};
</script>

<style scoped>
/* =========================================
   核心视觉封装 (无需依赖外部 CSS)
   ========================================= */

.ai-module-wrapper {
    width: 100%;
    margin-bottom: 2rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* 渐变边框容器 */
.ai-card-border {
    padding: 2px;
    /* 边框厚度 */
    border-radius: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #22d3ee 50%, #818cf8 100%);
    background-size: 200% 200%;
    box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.2);
    transition: all 0.5s ease;
}

.ai-card-border.is-loading {
    animation: border-flow 2s linear infinite;
}

@keyframes border-flow {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

/* 内层白色容器 */
.ai-card-inner {
    background: #ffffff;
    border-radius: calc(1rem - 2px);
    padding: 0.75rem 1rem;
}

.ai-input-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* 图标区 */
.ai-icon-section {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eff6ff;
    border-radius: 0.75rem;
    color: #3b82f6;
    font-size: 1.25rem;
}

.ai-pulse {
    animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
    0% {
        transform: scale(0.95);
        opacity: 0.8;
    }

    50% {
        transform: scale(1.05);
        opacity: 1;
    }

    100% {
        transform: scale(0.95);
        opacity: 0.8;
    }
}

/* 输入框主体 */
.ai-input-field {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    color: #1e293b;
    background: transparent;
    padding: 0.5rem 0;
}

.ai-input-field::placeholder {
    color: #94a3b8;
}

/* 按钮 */
.ai-submit-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.ai-submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
}

/* 响应面板 */
.ai-response-panel {
    margin-top: 1rem;
    background: white;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.ai-response-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.ai-avatar {
    font-size: 1.5rem;
}

.ai-name {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.95rem;
}

.ai-status-tag {
    font-size: 0.7rem;
    padding: 2px 8px;
    background: #f0fdf4;
    color: #16a34a;
    border-radius: 99px;
    border: 1px solid #dcfce7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Markdown 渲染微调 */
.ai-markdown-content {
    color: #475569;
    font-size: 0.9375rem;
    line-height: 1.6;
}

:deep(p) {
    margin-bottom: 0.75rem;
}

:deep(strong) {
    color: #2563eb;
}

:deep(ul) {
    padding-left: 1.25rem;
    margin-bottom: 0.75rem;
}

.ai-response-footer {
    margin-top: 1.25rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
}

.ai-hint {
    font-size: 0.75rem;
    color: #94a3b8;
}
</style>