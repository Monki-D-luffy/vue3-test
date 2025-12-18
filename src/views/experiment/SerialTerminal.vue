<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Promotion, CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue'
import { useSerialPort } from '@/composables/useSerialPort'
import SerialConnectionPanel from '@/components/SerialConnectionPanel.vue'
import SerialLogViewer from './components/SerialLogViewer.vue'
import SerialToolsSidebar from './components/SerialToolsSidebar.vue'
import ExpCard from '@/components/ExpCard.vue'

// 使用全局单例状态
const { send, isConnected } = useSerialPort()
const inputContent = ref('')
const isHexSend = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// --- 1. 按钮三态逻辑 ---
const sendButtonState = computed(() => {
    if (!isConnected.value) return 'disconnected'
    if (!inputContent.value) return 'empty'
    return 'ready'
})

// --- 2. 自动增高逻辑 ---
const autoResize = () => {
    const el = textareaRef.value
    if (!el) return
    // 先重置高度，以便在删除文字时能缩回
    el.style.height = 'auto'
    // 设置为滚动高度，但限制最大高度 (例如 150px)
    el.style.height = Math.min(el.scrollHeight, 150) + 'px'
}

// 监听内容变化，触发 resize
watch(inputContent, () => {
    nextTick(autoResize)
})

const handleSend = (e?: KeyboardEvent) => {
    // 如果是 Shift+Enter，允许换行，不发送
    if (e && e.shiftKey) return

    // 只有在 Ready 状态下才发送
    if (sendButtonState.value !== 'ready') return

    // 阻止默认回车换行
    if (e) e.preventDefault()

    send(inputContent.value, isHexSend.value, 'Manual Input')

    if (!isHexSend.value) {
        inputContent.value = ''
        // 发送后重置高度
        nextTick(() => {
            if (textareaRef.value) textareaRef.value.style.height = 'auto'
        })
    }
}
</script>

<template>
    <div class="canvas">
        <div class="header-zone">
            <SerialConnectionPanel class="connection-bar" />
        </div>

        <div class="workspace-zone">

            <div class="stage-area">
                <ExpCard class="terminal-card" no-header padding="0">
                    <SerialLogViewer />
                </ExpCard>

                <div class="input-island" :class="{ 'is-disabled': !isConnected }">

                    <div class="mode-check">
                        <el-checkbox v-model="isHexSend" label="HEX" size="small" :disabled="!isConnected" />
                    </div>

                    <div class="divider-vertical"></div>

                    <textarea ref="textareaRef" v-model="inputContent" class="native-textarea"
                        :placeholder="isConnected ? (isHexSend ? '输入 Hex (如 AA 55)...' : '输入指令 (Enter 发送, Shift+Enter 换行)...') : '请先连接串口设备'"
                        :disabled="!isConnected" rows="1" @input="autoResize" @keydown.enter="handleSend"></textarea>

                    <button class="send-btn" :class="sendButtonState" @click="handleSend()"
                        :disabled="sendButtonState === 'disconnected'">
                        <el-icon v-if="sendButtonState === 'disconnected'">
                            <CircleCloseFilled />
                        </el-icon>
                        <el-icon v-else-if="sendButtonState === 'empty'">
                            <WarningFilled />
                        </el-icon>
                        <el-icon v-else>
                            <Promotion />
                        </el-icon>
                    </button>
                </div>
            </div>

            <SerialToolsSidebar />

        </div>
    </div>
</template>

<style scoped>
.canvas {
    background-color: var(--app-bg-canvas);
    height: calc(100vh - 84px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 4px;
    overflow: hidden;
}

.header-zone {
    flex-shrink: 0;
}

:deep(.serial-connector-card) {
    border: none !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03) !important;
}

.workspace-zone {
    flex: 1;
    display: flex;
    gap: 16px;
    overflow: hidden;
    position: relative;
}

.stage-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    position: relative;
    height: 100%;
    overflow: hidden;
}

.terminal-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

:deep(.log-viewer-card) {
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
}

/* --- 修复后的输入岛样式 --- */
.input-island {
    /* 改为 min-height，允许增高 */
    min-height: 56px;
    max-height: 200px;
    /* 限制最大高度 */
    flex-shrink: 0;
    background: var(--app-bg-card);
    border-radius: 16px;
    box-shadow: var(--app-shadow-lg);
    display: flex;
    align-items: flex-end;
    /* 底部对齐，确保多行时按钮在下方 */
    padding: 8px 8px 8px 16px;
    /* 增加上下 padding */
    border: var(--app-glass-border);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    gap: 12px;
}

.input-island:focus-within {
    transform: translateY(-2px);
    border-color: #6366f1;
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.15);
}

.input-island.is-disabled {
    opacity: 0.8;
    background: #f8fafc;
    box-shadow: none;
}

.mode-check {
    display: flex;
    align-items: center;
    height: 40px;
    /* 固定高度，保持居中 */
}

.divider-vertical {
    width: 1px;
    height: 24px;
    background: #e2e8f0;
    margin-bottom: 8px;
    /* 视觉微调 */
}

/* 自动增高文本域 */
.native-textarea {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--app-text-main);
    min-width: 0;
    resize: none;
    /* 禁止手动拖拽，由JS控制 */
    line-height: 1.5;
    padding: 9px 0;
    /* 垂直居中微调 */
    overflow-y: auto;
    /* 超出最大高度后显示滚动条 */
}

.native-textarea::placeholder {
    color: #94a3b8;
}

/* --- 发送按钮三态样式 --- */
.send-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
}

/* 状态 1: 未连接 (Disconnected) */
.send-btn.disconnected {
    background: #f1f5f9;
    color: #cbd5e1;
    cursor: not-allowed;
    box-shadow: none;
}

/* 状态 2: 连接但无内容 (Empty) */
.send-btn.empty {
    background: #eff6ff;
    /* 极淡的蓝色背景 */
    color: #a5b4fc;
    /* 淡紫色图标 */
    cursor: not-allowed;
    /* 或者 allowed 但不做操作，视需求而定，这里建议不允许 */
    border: 1px solid rgba(99, 102, 241, 0.1);
}

/* 状态 3: 就绪 (Ready) */
.send-btn.ready {
    background: var(--app-gradient-primary);
    color: rgb(30, 195, 224);
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: scale(1);
}

.send-btn.ready:hover {
    transform: scale(1.08) translateY(-1px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    background: var(--app-gradient-hover);
}

.send-btn.ready:active {
    transform: scale(0.95);
}
</style>