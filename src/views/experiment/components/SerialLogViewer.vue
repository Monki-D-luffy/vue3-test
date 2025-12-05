<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { useSerialPort, type SerialLog } from '@/composables/useSerialPort'
import { bytesToHex, bytesToText } from '@/utils/serial'

const { logs, clearLogs, stats, resetStats } = useSerialPort()

const autoScroll = ref(true)
const viewMode = ref<'ASCII' | 'HEX'>('ASCII')
const viewerRef = ref<HTMLElement | null>(null)

watch(() => logs.value.length, async () => {
    if (autoScroll.value && viewerRef.value) {
        await nextTick()
        viewerRef.value.scrollTop = viewerRef.value.scrollHeight
    }
})

// 时间格式化：YYYY-MM-DD HH:mm:ss.SSS
const formatTime = (ts: number) => {
    const date = new Date(ts)
    const Y = date.getFullYear()
    const M = (date.getMonth() + 1).toString().padStart(2, '0')
    const D = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    const s = date.getSeconds().toString().padStart(2, '0')
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    return `${Y}-${M}-${D} ${h}:${m}:${s}.${ms}`
}

const renderContent = (log: SerialLog) => {
    if (log.type === 'SYS') return log.originalData ? bytesToText(log.originalData) : 'System Message'
    return viewMode.value === 'HEX' ? bytesToHex(log.originalData) : bytesToText(log.originalData)
}

const rxTooltip = computed(() => `Total Received: ${stats.rxBytes.toLocaleString()} Bytes`)
const txTooltip = computed(() => `Total Sent: ${stats.txBytes.toLocaleString()} Bytes`)
</script>

<template>
    <div class="log-viewer-card">
        <div class="viewer-header">
            <div class="header-left">
                <span class="title">Data Terminal</span>
                <div class="stats-group">
                    <el-tooltip :content="rxTooltip" placement="bottom" :show-after="500">
                        <div class="stat-pill rx">
                            <span class="label">RX</span>
                            <span class="value">{{ stats.rxPackets }}</span>
                        </div>
                    </el-tooltip>
                    <el-tooltip :content="txTooltip" placement="bottom" :show-after="500">
                        <div class="stat-pill tx">
                            <span class="label">TX</span>
                            <span class="value">{{ stats.txPackets }}</span>
                        </div>
                    </el-tooltip>
                </div>
            </div>

            <div class="header-tools">
                <el-radio-group v-model="viewMode" size="small" class="mode-switch">
                    <el-radio-button label="ASCII" />
                    <el-radio-button label="HEX" />
                </el-radio-group>
                <div class="divider-v"></div>
                <el-checkbox v-model="autoScroll" label="自动滚动" size="small" />
                <div class="divider-v"></div>
                <el-button link size="small" @click="() => { clearLogs(); resetStats(); }" class="clear-btn">
                    <el-icon>
                        <Delete />
                    </el-icon> 清空
                </el-button>
            </div>
        </div>

        <div class="viewer-body" ref="viewerRef">
            <div v-if="logs.length === 0" class="empty-state">
                <div class="empty-icon">i</div>
                <p>暂无数据交互</p>
            </div>

            <div v-for="log in logs" :key="log.id" class="log-entry" :class="log.type.toLowerCase()">
                <div class="entry-meta">
                    <span class="time">{{ formatTime(log.timestamp) }}</span>

                    <div class="meta-separator"></div>

                    <span class="len" v-if="log.type !== 'SYS'">{{ log.originalData.byteLength }} B</span>

                    <div class="meta-separator"></div>

                    <span class="direction-tag" :class="log.type">{{ log.type }}</span>

                    <template v-if="log.source && log.source !== 'Device'">
                        <div class="meta-separator"></div>
                        <span class="source-tag">{{ log.source }}</span>
                    </template>
                </div>

                <div class="entry-content" :class="[viewMode.toLowerCase()]">
                    {{ renderContent(log) }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.log-viewer-card {
    background: var(--app-bg-card);
    display: flex;
    flex-direction: column;
    height: 100%;
    -webkit-font-smoothing: antialiased;
}

/* --- Header 样式 (保持紧凑) --- */
.viewer-header {
    height: 40px;
    /* 稍微压低高度 */
    padding: 0 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.title {
    font-weight: 700;
    font-size: 12px;
    color: var(--app-text-main);
}

.stats-group {
    display: flex;
    gap: 6px;
}

.stat-pill {
    display: flex;
    align-items: center;
    font-size: 10px;
    border-radius: 4px;
    overflow: hidden;
}

.stat-pill .label {
    padding: 1px 4px;
    font-weight: 700;
    color: white;
}

.stat-pill .value {
    padding: 1px 6px;
    background: white;
    font-weight: 600;
    min-width: 20px;
    text-align: center;
    border: 1px solid;
    border-left: none;
    border-radius: 0 4px 4px 0;
}

.stat-pill.rx .label {
    background: #10b981;
}

.stat-pill.rx .value {
    color: #059669;
    border-color: #d1fae5;
}

.stat-pill.tx .label {
    background: #3b82f6;
}

.stat-pill.tx .value {
    color: #2563eb;
    border-color: #dbeafe;
}

.header-tools {
    display: flex;
    align-items: center;
    gap: 8px;
}

.divider-v {
    width: 1px;
    height: 12px;
    background: #cbd5e1;
}

.clear-btn {
    font-size: 12px;
}

/* --- Body 样式 (双行布局) --- */
.viewer-body {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    color: var(--app-text-main);
}

/* 单条日志容器 */
.log-entry {
    display: flex;
    flex-direction: column;
    /* 关键：垂直排列 */
    padding: 6px 16px;
    border-bottom: 1px solid #f1f5f9;
}

.log-entry:hover {
    background-color: #f8fafc;
}

/* 第一行：元数据 */
.entry-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 4px;
    /* 与内容区的间距 */
    user-select: none;
}

.meta-separator {
    width: 1px;
    height: 10px;
    background: #cbd5e1;
    opacity: 0.5;
}

.time {
    font-family: sans-serif;
    font-weight: 500;
}

.len {
    font-family: monospace;
}

.direction-tag {
    font-weight: 700;
    font-size: 10px;
    padding: 0 4px;
    border-radius: 3px;
}

.direction-tag.RX {
    color: #059669;
    background: #ecfdf5;
}

.direction-tag.TX {
    color: #2563eb;
    background: #eff6ff;
}

.direction-tag.SYS {
    color: #d97706;
    background: #fffbeb;
}

.source-tag {
    font-size: 10px;
    color: #64748b;
    background: #f1f5f9;
    padding: 0 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
}

/* 第二行：内容数据 */
.entry-content {
    word-break: break-all;
    white-space: pre-wrap;
    color: #334155;
    padding-left: 0;
    /* 顶格显示，不再缩进 */
    font-weight: 500;
}

/* 不同类型的颜色微调 */
.log-entry.tx .entry-content {
    color: #3b82f6;
}

/* TX 偏蓝 */
.log-entry.rx .entry-content {
    color: #1e293b;
}

/* RX 深灰 */
.log-entry.sys .entry-content {
    color: #94a3b8;
    font-style: italic;
}

.entry-content.hex {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 11px;
}

.empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
}

.empty-icon {
    width: 24px;
    height: 24px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    text-align: center;
    line-height: 20px;
    font-weight: bold;
    margin-bottom: 8px;
}
</style>