<template>
    <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="场景执行终端"
        width="500px" class="execution-log-dialog" destroy-on-close align-center>
        <div class="terminal-window">
            <div class="terminal-header">
                <span class="status-dot"></span>
                <span class="status-text">EXECUTION_LOG_STREAM</span>
            </div>
            <div class="terminal-body" ref="logBodyRef">
                <div v-for="(log, index) in logs" :key="index" class="log-line" :class="log.level">
                    <span class="log-time">[{{ formatTime(log.time) }}]</span>
                    <span class="log-msg">{{ log.msg }}</span>
                </div>
                <div class="log-line system" v-if="loading">
                    <span class="cursor">_</span> 正在执行指令序列...
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { watch, ref, nextTick } from 'vue';

interface Log {
    time: number;
    level: string;
    msg: string;
}

const props = defineProps<{
    modelValue: boolean;
    logs: Log[];
    loading?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const logBodyRef = ref<HTMLElement>();

const formatTime = (ts: number) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
};

// 自动滚动到底部
watch(() => props.logs, () => {
    nextTick(() => {
        if (logBodyRef.value) {
            logBodyRef.value.scrollTop = logBodyRef.value.scrollHeight;
        }
    });
}, { deep: true });
</script>

<style scoped>
.terminal-window {
    background: #1e1e1e;
    border-radius: 8px;
    overflow: hidden;
    font-family: 'JetBrains Mono', Consolas, monospace;
    border: 1px solid #333;
}

.terminal-header {
    background: #2d2d2d;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #333;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #27c93f;
    /* Mac Green */
    box-shadow: 0 0 8px #27c93f;
}

.status-text {
    font-size: 11px;
    color: #888;
    letter-spacing: 1px;
}

.terminal-body {
    height: 300px;
    padding: 16px;
    overflow-y: auto;
    color: #d4d4d4;
    font-size: 12px;
    line-height: 1.6;
}

.log-line {
    display: flex;
    gap: 10px;
    margin-bottom: 4px;
}

.log-time {
    color: #569cd6;
    /* Blue */
    flex-shrink: 0;
}

.log-line.info .log-msg {
    color: #d4d4d4;
}

.log-line.success .log-msg {
    color: #4ec9b0;
    /* Teal/Green */
}

.log-line.error .log-msg {
    color: #f44747;
}

.log-line.system {
    color: #6a9955;
}

/* 光标闪烁动画 */
.cursor {
    animation: blink 1s step-end infinite;
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}
</style>