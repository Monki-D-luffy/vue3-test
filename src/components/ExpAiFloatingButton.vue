<template>
    <div class="ai-float-container">
        <div class="float-btn" @click="toggleVisible" :class="{ 'is-active': visible }">
            <el-icon class="icon">
                <Cpu />
            </el-icon>
            <span class="pulse-ring" v-if="!visible"></span>
        </div>

        <transition name="el-zoom-in-bottom">
            <div v-if="visible" class="ai-drawer-card">
                <div class="drawer-header">
                    <span class="title">✨ AI Copilot</span>
                    <el-icon class="close-btn" @click="visible = false">
                        <Close />
                    </el-icon>
                </div>

                <div class="drawer-body">
                    <ExpAiChatPanel :messages="messages" :is-typing="isTyping" @send="handleSend" />
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Cpu, Close } from '@element-plus/icons-vue';
import ExpAiChatPanel from '@/components/ExpAiChatPanel.vue';
import { useAiAssistant } from '@/composables/useAiAssistant';
// ✅ 引入新的上下文管理器
import { useAiContext } from '@/composables/useAiContext';

const visible = ref(false);
const { messages, isTyping, ask } = useAiAssistant();
const { getGlobalContext } = useAiContext();

const toggleVisible = () => {
    visible.value = !visible.value;
};

const handleSend = (text: string) => {
    // ✅ 关键修改：传入 getGlobalContext，AI 将能根据当前路由自动抓取不同数据
    ask(text, getGlobalContext);
};
</script>

<style scoped>
/* 保持原有样式不变 */
.ai-float-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
}

.float-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
}

.float-btn:hover {
    transform: scale(1.1);
}

.float-btn.is-active {
    transform: rotate(90deg) scale(0.8);
    opacity: 0;
    pointer-events: none;
}

.pulse-ring {
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    border: 2px solid #6366f1;
    opacity: 0.6;
    animation: pulse 2s infinite;
}

.ai-drawer-card {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 380px;
    height: 600px;
    max-height: 80vh;
    background: white;
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #eef2ff;
    transform-origin: bottom right;
}

.drawer-header {
    height: 56px;
    background: linear-gradient(to right, #f8fafc, #ffffff);
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
}

.title {
    font-weight: 700;
    color: #1e293b;
    font-size: 1.05rem;
}

.close-btn {
    cursor: pointer;
    color: #94a3b8;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #f1f5f9;
    color: #ef4444;
}

.drawer-body {
    flex: 1;
    overflow: hidden;
    position: relative;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.6;
    }

    100% {
        transform: scale(1.5);
        opacity: 0;
    }
}
</style>