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
import { useRoute } from 'vue-router';
import { Cpu, Close } from '@element-plus/icons-vue';
import ExpAiChatPanel from '@/components/ExpAiChatPanel.vue';
import { useAiAssistant } from '@/composables/useAiAssistant';

const visible = ref(false);
const route = useRoute();
const { messages, isTyping, ask } = useAiAssistant();

const toggleVisible = () => {
    visible.value = !visible.value;
};

// 【关键逻辑】全局上下文获取器
// 当你在非 Dashboard 页面提问时，AI 只能看到这些通用信息
const getGlobalContext = async () => {
    return {
        currentPage: route.path,
        pageTitle: document.title,
        timestamp: new Date().toLocaleString(),
        note: "User is asking from global floating button."
    };
};

const handleSend = (text: string) => {
    // 注入全局上下文
    ask(text, getGlobalContext);
};
</script>

<style scoped>
.ai-float-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
}

.float-btn {
    width: 40px;
    height: 40px;
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

/* 点击展开后，按钮旋转并变透明（可选） */
.float-btn.is-active {
    transform: rotate(90deg) scale(0.8);
    opacity: 0;
    pointer-events: none;
    /* 防止遮挡抽屉 */
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
    /* 防止在小屏幕溢出 */
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
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: #cd16e9;
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