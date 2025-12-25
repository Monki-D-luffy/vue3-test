<template>
    <div class="ai-command-container">
        <div class="ai-input-wrapper hover-lift" :class="{ 'is-loading': loading }">
            <div class="ai-icon-box">
                <el-icon v-if="loading" class="is-loading">
                    <Loading />
                </el-icon>
                <el-icon v-else>
                    <Microphone />
                </el-icon>
            </div>

            <input v-model="inputVal" class="ai-real-input" type="text"
                placeholder="Ask Gemini: '检查所有在线设备的健康状态' 或 '重启异常网关'..." @keyup.enter="handleSend" :disabled="loading" />

            <button class="ai-send-btn" @click="handleSend" :disabled="!inputVal || loading">
                执行指令 ✨
            </button>
        </div>

        <transition name="el-zoom-in-top">
            <div v-if="result" class="ai-result-panel dashboard-card">
                <div class="ai-result-header">
                    <el-icon class="text-blue-500">
                        <ChatDotRound />
                    </el-icon>
                    <span class="text-gradient-ai">Gemini OS</span>
                </div>
                <div class="ai-markdown-body" v-html="parsedResult"></div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGemini } from '@/composables/useGemini';
import { parseMarkdown } from '@/utils/markdown'; // 确保你创建了这个工具

const inputVal = ref('');
const { loading, result, askAI } = useGemini();

// 将 AI 返回的 Markdown 文本转换为 HTML
const parsedResult = computed(() => parseMarkdown(result.value));

const handleSend = async () => {
    if (!inputVal.value.trim()) return;
    await askAI(inputVal.value, 'chat');
    // 指令发送后保留文本，方便用户修改，或者你也可以选择清空 inputVal.value = ''
};
</script>

<style scoped>
.ai-command-container {
    margin-bottom: 24px;
}

/* --- 自定义输入框样式 (为了极致美感，不使用 el-input) --- */
.ai-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    height: 64px;
    background: var(--bg-card);
    border-radius: 16px;
    /* 更大的圆角 */
    border: 1px solid transparent;
    /* 预留边框位置 */
    background-image: linear-gradient(#fff, #fff), var(--gemini-gradient);
    /* 渐变边框黑科技 */
    background-origin: border-box;
    background-clip: padding-box, border-box;
    box-shadow: var(--shadow-sm);
    padding: 0 8px;
    transition: all 0.3s ease;
}

.ai-input-wrapper:focus-within {
    box-shadow: var(--shadow-modal);
    transform: translateY(-2px);
}

.ai-icon-box {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--primary-color);
    background: var(--primary-light);
    border-radius: 12px;
    margin-right: 12px;
}

.ai-real-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 16px;
    color: var(--text-primary);
    background: transparent;
    height: 100%;
}

.ai-real-input::placeholder {
    color: var(--text-placeholder);
}

.ai-send-btn {
    padding: 10px 24px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.ai-send-btn:hover:not(:disabled) {
    background: var(--primary-color-hover);
}

.ai-send-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* --- 结果面板 --- */
.ai-result-panel {
    margin-top: 16px;
    border-left: 4px solid var(--primary-color);
    /* 左侧强调线 */
}

.ai-result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 700;
}

/* 简单的 Markdown 样式适配 */
.ai-markdown-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
}

:deep(p) {
    margin-bottom: 8px;
}

:deep(strong) {
    color: var(--color-blue-600);
}

:deep(ul) {
    padding-left: 20px;
    margin-bottom: 8px;
}

:deep(li) {
    margin-bottom: 4px;
}
</style>