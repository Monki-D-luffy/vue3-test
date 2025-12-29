// src/views/dashboard/components/ExpAiCommandBar.vue
<template>
    <div class="dashboard-ai-wrapper">
        <div class="ai-input-bar" :class="{ 'is-typing': isTyping }">
            <el-icon class="ai-icon">
                <MagicStick />
            </el-icon>
            <input v-model="inputVal" placeholder="Ask Dashboard AI: '分析设备在线率'..." @keyup.enter="handleSend"
                :disabled="isTyping" />
            <el-button type="primary" circle size="small" :loading="isTyping" @click="handleSend">
                <el-icon v-if="!isTyping">
                    <Position />
                </el-icon>
            </el-button>
        </div>

        <transition name="el-zoom-in-top">
            <div v-if="messages.length > 1" class="dashboard-response-area">
                <ExpAiChatPanel :messages="messages" :is-typing="isTyping" input-hidden />
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MagicStick, Position } from '@element-plus/icons-vue';
import { useAiAssistant } from '@/ai/core/useAiAssistant';
import { useExpDashboard } from '@/composables/useExpDashboard';
import ExpAiChatPanel from '@/components/AiChatPanel.vue';

const inputVal = ref('');
const { messages, isTyping, ask } = useAiAssistant();
// 获取 Dashboard 上下文能力的钩子
const { getAnalysisContext } = useExpDashboard();

const handleSend = () => {
    if (!inputVal.value.trim()) return;

    // 关键改变：显式传入 Context Getter
    ask(inputVal.value, getAnalysisContext);

    inputVal.value = '';
};
</script>

<style scoped>
.dashboard-ai-wrapper {
    max-width: 800px;
    margin: 0 auto;
}

.ai-input-bar {
    display: flex;
    align-items: center;
    background: white;
    padding: 0.75rem 1rem;
    border-radius: 50px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #e2e8f0;
    transition: all 0.3s;
    gap: 0.75rem;
}

.ai-input-bar:focus-within {
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.15);
    border-color: #cbd5e1;
}

.ai-icon {
    font-size: 1.25rem;
    color: #6366f1;
}

.ai-input-bar input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    color: #1e293b;
}

.dashboard-response-area {
    margin-top: 1rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    border: 1px solid #f1f5f9;
    height: 400px;
    overflow: hidden;
}
</style>