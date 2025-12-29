<template>
    <div class="ai-chat-panel">
        <div class="chat-messages" ref="scrollRef">
            <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.role">

                <div class="avatar">
                    <el-icon v-if="msg.role === 'assistant'">
                        <Cpu />
                    </el-icon>
                    <el-icon v-else>
                        <UserFilled />
                    </el-icon>
                </div>

                <div class="bubble-wrapper">
                    <div class="sender-name">{{ msg.role === 'assistant' ? 'AI Copilot' : 'Me' }}</div>
                    <div class="bubble-content markdown-body" v-html="renderMarkdown(msg.content)"></div>
                    <span v-if="isTyping && index === messages.length - 1 && msg.role === 'assistant'"
                        class="cursor">|</span>
                </div>
            </div>
        </div>

        <div class="chat-input-area" v-if="!inputHidden">
            <el-input v-model="internalInput" placeholder="输入指令..." @keyup.enter="handleSend" :disabled="isTyping">
                <template #append>
                    <el-button @click="handleSend" :loading="isTyping">
                        <el-icon>
                            <Position />
                        </el-icon>
                    </el-button>
                </template>
            </el-input>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { Cpu, UserFilled, Position } from '@element-plus/icons-vue';
// 如果没有 markdown 工具，可以暂时用 (t) => t 代替，或者使用简单的正则替换
import { parseMarkdown } from '@/utils/markdown';

// 定义消息结构，确保与 api/modules/ai.ts 一致
export interface AiMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const props = defineProps<{
    messages: AiMessage[];
    isTyping: boolean;
    inputHidden?: boolean; // 允许外部隐藏输入框（比如 Dashboard 那里有自己的输入条）
}>();

const emit = defineEmits(['send']);

const internalInput = ref('');
const scrollRef = ref<HTMLElement | null>(null);

// 简单的 Markdown 渲染包装
const renderMarkdown = (text: string) => {
    try {
        return parseMarkdown ? parseMarkdown(text) : text;
    } catch {
        return text;
    }
};

const handleSend = () => {
    if (!internalInput.value.trim() || props.isTyping) return;
    emit('send', internalInput.value);
    internalInput.value = '';
};

// 监听消息列表变化，自动滚动到底部
watch(() => props.messages, async () => {
    await nextTick();
    if (scrollRef.value) {
        scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    }
}, { deep: true });
</script>

<style scoped>
.ai-chat-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f8fafc;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.message-row {
    display: flex;
    gap: 1rem;
    max-width: 90%;
}

.message-row.user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-row.assistant .avatar {
    background: #e0e7ff;
    color: #4f46e5;
}

.message-row.user .avatar {
    background: #f1f5f9;
    color: #64748b;
}

.bubble-wrapper {
    display: flex;
    flex-direction: column;
}

.sender-name {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
    text-align: left;
}

.message-row.user .sender-name {
    text-align: right;
}

.bubble-content {
    background: white;
    padding: 1rem;
    border-radius: 0px 12px 12px 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    font-size: 0.95rem;
    line-height: 1.4;
    color: #334155;
    word-break: break-word;
}

.message-row.user .bubble-content {
    background: #4f46e5;
    color: white;
    border-radius: 12px 0px 12px 12px;
}

/* 简单的样式覆盖 */
.message-row.user .bubble-content :deep(strong) {
    color: white;
}

.message-row.user .bubble-content :deep(a) {
    color: #e0e7ff;
    text-decoration: underline;
}

.chat-input-area {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e2e8f0;
}

.cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background-color: #4f46e5;
    margin-left: 2px;
    vertical-align: sub;
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}
</style>