<template>
    <div class="flex flex-col h-full bg-white relative overflow-hidden">
        <div
            class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
            <div class="flex items-center gap-3">
                <div
                    class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <el-icon :size="18">
                        <Cpu />
                    </el-icon>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800 text-sm leading-tight">IoT Agent</h3>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="relative flex h-2 w-2">
                            <span v-if="status !== 'idle'"
                                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2"
                                :class="status === 'idle' ? 'bg-gray-300' : 'bg-emerald-500'"></span>
                        </span>
                        <span class="text-[10px] font-medium uppercase tracking-wide"
                            :class="status === 'idle' ? 'text-gray-400' : 'text-emerald-600'">
                            {{ statusText }}
                        </span>
                    </div>
                </div>
            </div>
            <el-button link @click="handleClear">
                <el-icon class="text-gray-400 hover:text-red-500 transition-colors">
                    <Delete />
                </el-icon>
            </el-button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-6 bg-[#f8fafc] scroll-smooth" ref="scrollRef">
            <div v-if="messages.length === 0" class="flex flex-col items-center justify-center mt-10 opacity-60">
                <el-icon :size="48" class="text-gray-300 mb-4">
                    <ChatDotRound />
                </el-icon>
                <p class="text-gray-400 text-sm">我是您的智能中控助手，请下达指令。</p>
            </div>

            <template v-for="(msg, index) in messages" :key="index">
                <div v-if="msg.role === 'user'" class="flex justify-end animate-fade-in-up">
                    <div
                        class="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md shadow-indigo-100 max-w-[85%] text-sm leading-relaxed">
                        {{ msg.content }}
                    </div>
                </div>

                <div v-else-if="msg.role === 'system'" class="flex justify-start animate-fade-in-up">
                    <div class="max-w-[90%] w-full">
                        <div class="flex items-center gap-2 mb-1.5 ml-1">
                            <el-icon class="text-gray-400 text-xs">
                                <Connection />
                            </el-icon>
                            <span class="text-[10px] font-mono text-gray-400 uppercase">Tool Execution Log</span>
                        </div>
                        <div
                            class="bg-gray-100 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap">
                            {{ formatToolOutput(msg.content) }}
                        </div>
                    </div>
                </div>

                <div v-else class="flex gap-3 justify-start animate-fade-in-up max-w-[90%]">
                    <div
                        class="w-8 h-8 rounded-full bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <el-icon class="text-indigo-500">
                            <Service />
                        </el-icon>
                    </div>
                    <div
                        class="bg-white border border-gray-100 text-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed prose prose-sm max-w-none">
                        <div v-html="parseMarkdown(msg.content)"></div>
                    </div>
                </div>
            </template>

            <div v-if="status === 'thinking'" class="flex gap-3 ml-1 animate-pulse">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <el-icon class="is-loading text-gray-400">
                        <Loading />
                    </el-icon>
                </div>
                <div class="flex items-center text-xs text-gray-400">正在思考下一步行动...</div>
            </div>

            <div v-if="status === 'executing'" class="flex gap-3 ml-1">
                <div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                    <el-icon class="is-loading text-amber-500">
                        <Tools />
                    </el-icon>
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-xs font-bold text-gray-600">正在执行工具...</span>
                    <span class="text-[10px] text-gray-400 font-mono">{{ currentTool || 'Processing' }}</span>
                </div>
            </div>
        </div>

        <div class="p-4 bg-white border-t border-gray-100">
            <div class="relative group">
                <textarea v-model="inputValue" rows="1"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all resize-none overflow-hidden"
                    placeholder="输入指令，例如：'搜索在线的摄像头'" @keydown.enter.exact.prevent="handleSubmit" @input="autoResize"
                    ref="inputRef"></textarea>
                <button
                    class="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
                    :disabled="!inputValue.trim() || status !== 'idle'" @click="handleSubmit">
                    <el-icon>
                        <Position />
                    </el-icon>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import {
    Cpu, Delete, ChatDotRound, Service, Position, Loading, Tools, Connection
} from '@element-plus/icons-vue';
// 🚀 核心引入
import { useAgent } from '../core/agent';
import { useAiContext } from '../core/useAiContext';
import { parseMarkdown } from '@/utils/markdown'; // 复用现有的 Markdown 渲染

// 1. 初始化 Agent 大脑
const { messages, status, currentTool, execute, clear } = useAgent();
const { getGlobalContext } = useAiContext();

const inputValue = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);

// 2. 状态文案映射
const statusText = computed(() => {
    switch (status.value) {
        case 'idle': return 'Ready';
        case 'thinking': return 'Thinking';
        case 'executing': return 'Action';
        case 'replying': return 'Typing';
        default: return 'Standby';
    }
});

// 3. 处理发送
const handleSubmit = async () => {
    const text = inputValue.value.trim();
    if (!text || status.value !== 'idle') return;

    inputValue.value = '';
    if (inputRef.value) inputRef.value.style.height = 'auto'; // Reset height

    // ⚡️ 核心动作：触发 Agent 思考循环
    await execute(text, getGlobalContext);
};

// 4. 清空会话
const handleClear = () => {
    clear();
};

// 5. 辅助：格式化工具输出，防止过长
const formatToolOutput = (content: string) => {
    try {
        // 尝试解析 JSON 格式化显示
        // 如果是 [Tool Output]: ... 格式，去掉前缀
        const cleanContent = content.replace(/^\[Tool Output.*?\]:\s*/, '');
        const obj = JSON.parse(cleanContent);
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return content; // 无法解析则原样显示
    }
};

// 6. 辅助：输入框自适应高度
const autoResize = () => {
    const el = inputRef.value;
    if (el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
};

// 7. 自动滚动
watch(
    [() => messages.value.length, status],
    () => {
        nextTick(() => {
            if (scrollRef.value) {
                scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
            }
        });
    }
);
</script>

<style scoped>
.animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 隐藏滚动条但保留滚动功能 */
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 4px;
}
</style>