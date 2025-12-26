<template>
    <div class="ai-module-wrapper">
        <div class="ai-card-border" :class="{ 'is-loading': isTyping }">
            <div class="ai-card-inner">
                <div class="ai-input-container">
                    <div class="ai-icon-section">
                        <el-icon v-if="isTyping" class="is-loading ai-pulse">
                            <Loading />
                        </el-icon>
                        <el-icon v-else class="ai-static-icon">
                            <Microphone />
                        </el-icon>
                    </div>

                    <input v-model="inputVal" class="ai-input-field" type="text"
                        placeholder="输入指令，如：'分析 Zone-A 设备故障' 或 '查看在线率趋势'..." @keyup.enter="handleSend"
                        :disabled="isTyping" />

                    <div class="ai-action-section">
                        <el-button v-if="messages.length > 1" circle size="small" class="clear-btn" @click="clearChat"
                            title="清空对话">
                            <el-icon>
                                <Delete />
                            </el-icon>
                        </el-button>

                        <button class="ai-submit-btn" @click="handleSend" :disabled="!inputVal.trim() || isTyping">
                            <span>{{ isTyping ? '分析中...' : '执行指令' }}</span>
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <transition name="el-zoom-in-top">
            <div v-if="messages.length > 0" class="ai-response-panel dashboard-card">
                <div class="chat-scroll-container" ref="scrollArea">
                    <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.role">

                        <div class="ai-response-header">
                            <el-icon class="ai-avatar" :class="msg.role">
                                <component :is="msg.role === 'assistant' ? 'Cpu' : 'UserFilled'" />
                            </el-icon>
                            <span class="ai-name">
                                {{ msg.role === 'assistant' ? 'AI 分析师' : 'Me' }}
                            </span>
                            <span class="ai-time" v-if="msg.role === 'assistant'">
                                {{ index === messages.length - 1 && isTyping ? '正在输入...' : 'Just now' }}
                            </span>
                        </div>

                        <div class="ai-content-body">
                            <div class="markdown-body" v-html="renderContent(msg.content)"></div>
                            <span v-if="isTyping && index === messages.length - 1 && msg.role === 'assistant'"
                                class="typing-cursor">|</span>
                        </div>

                        <div v-if="index < messages.length - 1" class="message-divider"></div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import {
    Loading,
    Microphone,
    MagicStick,
    UserFilled,
    Cpu,
    Delete
} from '@element-plus/icons-vue';
import { useAiAssistant } from '@/composables/useAiAssistant';
// 尝试导入 markdown 工具，如果没有则使用降级函数
import { parseMarkdown } from '@/utils/markdown';

const inputVal = ref('');
const scrollArea = ref<HTMLElement | null>(null);

// 核心逻辑接入
const { messages, isTyping, ask, clearChat } = useAiAssistant();

// 处理发送
const handleSend = () => {
    if (!inputVal.value.trim() || isTyping.value) return;
    ask(inputVal.value);
    inputVal.value = '';
};

// 渲染内容辅助函数
const renderContent = (content: string) => {
    try {
        return parseMarkdown ? parseMarkdown(content) : content;
    } catch (e) {
        return content; // 降级显示纯文本
    }
};

// 自动滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (scrollArea.value) {
            scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
        }
    });
};

// 监听消息变化，触发滚动
watch(() => messages.value, () => scrollToBottom(), { deep: true });
</script>

<style scoped>
/* =========================================
   原有样式保留 (Keep Original Styles)
   ========================================= */
.ai-module-wrapper {
    position: relative;
    z-index: 10;
    max-width: 800px;
    margin: 0 auto;
}

.ai-card-border {
    padding: 3px;
    border-radius: 20px;
    background: linear-gradient(90deg, #3b83f6b3 0%, #8a5cf6c5 100%);

    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
    transition: all 0.3s ease;
}

.ai-card-border:hover,
.ai-card-border.is-loading {
    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
    box-shadow: 0 5px 10px 0px rgba(59, 130, 246, 0.2);
}

.ai-card-inner {
    background: white;
    border-radius: 18px;
    padding: 0.5rem 0.75rem;
}

.ai-input-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 3.5rem;
}

.ai-icon-section {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 50%;
    color: #64748b;
}

.ai-pulse {
    color: #3b82f6;
    animation: spin 2s linear infinite;
}

.ai-input-field {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    color: #1e293b;
    background: transparent;
}

.ai-input-field::placeholder {
    color: #94a3b8;
}

.ai-action-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.ai-submit-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #0f172a;
    color: white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 2rem;
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

.clear-btn {
    color: #94a3b8;
    border-color: transparent;
}

.clear-btn:hover {
    color: #ef4444;
    background: #fee2e2;
}

/* =========================================
   响应面板样式调整 (Adapted for Chat)
   ========================================= */
.ai-response-panel {
    margin-top: 1rem;
    background: white;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    /* padding: 1.5rem;  <-- 改为内部容器 padding */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    /* 包含滚动条 */
}

/* 新增：滚动容器 */
.chat-scroll-container {
    padding: 1.5rem;
    max-height: 400px;
    /* 限制高度，超出滚动 */
    overflow-y: auto;
    scroll-behavior: smooth;
}

/* 新增：单条消息行 */
.message-row {
    margin-bottom: 1.5rem;
}

.ai-response-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.ai-avatar {
    font-size: 1.25rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ai-avatar.assistant {
    background: #eff6ff;
    color: #3b82f6;
}

.ai-avatar.user {
    background: #f1f5f9;
    color: #64748b;
}

.ai-name {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.9rem;
}

.ai-time {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-left: auto;
}

.ai-content-body {
    padding-left: 2.75rem;
    /* 对齐头像右侧 */
    color: #334155;
    line-height: 1.6;
    font-size: 0.95rem;
}

/* 分割线 */
.message-divider {
    height: 1px;
    background: #f1f5f9;
    margin: 1.5rem 0 1.5rem 2.75rem;
}

/* 动画 */
@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}

.typing-cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background-color: #3b82f6;
    margin-left: 4px;
    vertical-align: middle;
    animation: blink 1s step-end infinite;
}

/* 简单的 Markdown 样式修正 (如果 markdown.css 未加载) */
.markdown-body :deep(h3) {
    font-size: 1.1em;
    margin-top: 1em;
    margin-bottom: 0.5em;
    color: #1e293b;
}

.markdown-body :deep(ul) {
    padding-left: 1.5em;
    margin: 0.5em 0;
}

.markdown-body :deep(li) {
    margin-bottom: 0.25em;
}

.markdown-body :deep(strong) {
    color: #0f172a;
    font-weight: 600;
}

.markdown-body :deep(p) {
    margin-bottom: 0.5em;
}
</style>