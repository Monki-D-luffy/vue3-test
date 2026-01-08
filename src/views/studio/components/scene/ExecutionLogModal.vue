<template>
    <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="场景执行终端"
        width="600px" class="execution-log-dialog" destroy-on-close align-center append-to-body>
        <div class="terminal-window">
            <div class="terminal-header">
                <div class="traffic-lights">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                </div>
                <span class="status-text">EXECUTION_LOG_STREAM</span>
            </div>
            <div class="terminal-body" ref="logBodyRef">
                <template v-if="logs.length > 0">
                    <div v-for="(log, index) in logs" :key="index" class="log-line" :class="log.level">
                        <span class="log-time">[{{ formatTime(log.time) }}]</span>
                        <span class="log-msg">{{ log.msg }}</span>
                    </div>
                </template>
                <div class="log-line system" v-if="loading">
                    <span class="cursor">_</span> 正在执行指令序列...
                </div>
                <div class="empty-log" v-if="!loading && logs.length === 0">
                    等待执行...
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

const formatTime = (ts: number | string) => {
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
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.terminal-header {
    background: #2d2d2d;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #333;
}

.traffic-lights {
    display: flex;
    gap: 6px;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.dot.red {
    background: #ff5f56;
}

.dot.yellow {
    background: #ffbd2e;
}

.dot.green {
    background: #27c93f;
}

.status-text {
    font-size: 11px;
    color: #888;
    letter-spacing: 1px;
    font-weight: 600;
}

.terminal-body {
    height: 350px;
    padding: 16px;
    overflow-y: auto;
    color: #d4d4d4;
    font-size: 13px;
    line-height: 1.6;
}

.log-line {
    display: flex;
    gap: 12px;
    margin-bottom: 6px;
}

.log-time {
    color: #569cd6;
    /* VSCode Blue */
    flex-shrink: 0;
    opacity: 0.8;
}

.log-line.info .log-msg {
    color: #d4d4d4;
}

.log-line.success .log-msg {
    color: #4ec9b0;
    font-weight: bold;
}

.log-line.error .log-msg {
    color: #f44747;
}

.log-line.system {
    color: #6a9955;
    font-style: italic;
}

.empty-log {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-style: italic;
}

/* 光标闪烁动画 */
.cursor {
    animation: blink 1s step-end infinite;
    font-weight: bold;
    color: #27c93f;
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