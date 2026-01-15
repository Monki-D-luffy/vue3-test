<template>
    <el-popover placement="left" :width="500" trigger="hover" popper-class="light-payload-popover" :show-arrow="true"
        :offset="10" transition="el-zoom-in-top" @show="onShow">
        <template #reference>
            <div class="payload-trigger">
                <div class="text-container">
                    <span class="truncate-text">{{ rawString }}</span>
                </div>
            </div>
        </template>

        <div class="popover-content">

            <div class="popover-header">
                <div class="header-left">
                    <el-icon class="mr-1 text-primary">
                        <Document />
                    </el-icon>
                    <span class="title">数据详情</span>
                    <span class="dpid-tag" v-if="eventId">ID: {{ eventId }}</span>
                </div>
                <div class="header-right">
                    <el-button link size="small" type="primary" @click="handleCopy">
                        <el-icon class="mr-1">
                            <CopyDocument />
                        </el-icon> 复制
                    </el-button>
                </div>
            </div>

            <div class="view-tabs">
                <div class="tab-item" :class="{ active: currentView === 'parsed' }" @click="currentView = 'parsed'">
                    智能解析
                </div>
                <div class="tab-item" :class="{ active: currentView === 'raw' }" @click="currentView = 'raw'">
                    原始报文
                </div>
            </div>

            <div class="payload-body custom-scrollbar">

                <div v-if="currentView === 'parsed'" class="parsed-view">
                    <div v-if="isStructured" class="structured-card">
                        <div class="card-row" v-if="parsedData.label">
                            <span class="row-label">含义</span>
                            <span class="row-value highlight">{{ parsedData.label }}</span>
                        </div>
                        <div class="card-row main-row">
                            <span class="row-label">数值</span>
                            <span class="row-value main">{{ parsedData.value }} <span v-if="parsedData.unit"
                                    class="unit">{{
                                        parsedData.unit }}</span></span>
                        </div>
                        <div class="card-row" v-if="parsedData.desc">
                            <span class="row-label">描述</span>
                            <span class="row-value desc">{{ parsedData.desc }}</span>
                        </div>
                    </div>

                    <pre v-else-if="isObjectOrJson" class="code-block">{{ formatJson(parsedData) }}</pre>

                    <div v-else class="simple-text">{{ parsedData }}</div>
                </div>

                <div v-else class="raw-view">
                    <pre class="code-block raw">{{ rawString }}</pre>
                </div>

            </div>
        </div>
    </el-popover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Document, View } from '@element-plus/icons-vue'
import { parseDpData, isParsedStructure } from '@/utils/dpParser'

const props = defineProps<{
    content: string | object | null;
    eventId?: string | number; // ✨ 接收 DPID，用于传给 parser
}>()

const currentView = ref<'parsed' | 'raw'>('parsed')

// 1. 原始字符串
const rawString = computed(() => {
    if (props.content === null || props.content === undefined) return ''
    if (typeof props.content === 'string') return props.content
    return JSON.stringify(props.content)
})

// 2. 调用外部文件进行解析
const parsedData = computed(() => {
    return parseDpData(props.eventId, props.content)
})

// 3. 判断解析结果类型
const isStructured = computed(() => isParsedStructure(parsedData.value))
const isObjectOrJson = computed(() => typeof parsedData.value === 'object')

// 初始化：默认看解析
const onShow = () => {
    currentView.value = 'parsed'
}

const formatJson = (val: any) => {
    try {
        return JSON.stringify(val, null, 2)
    } catch {
        return val
    }
}

const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(rawString.value)
        ElMessage.success('已复制到剪贴板')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}
</script>

<style scoped>
/* --- 触发器样式 --- */
.payload-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    width: 100%;
    height: 24px;
}

.payload-trigger:hover .trigger-icon {
    color: #409eff;
    background: #ecf5ff;
}

.text-container {
    flex: 1;
    min-width: 0;
}

.truncate-text {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'JetBrains Mono', monospace;
    color: #606266;
    font-size: 12px;
}

.trigger-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: #909399;
    transition: all 0.2s;
}

/* --- Popover 内容区 (Light Theme) --- */
.popover-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 400px;
    background-color: #ffffff;
}

/* 头部 */
.popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f2f5;
    background-color: #fcfcfc;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 6px;
}

.title {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
}

.dpid-tag {
    background: #f0f2f5;
    color: #909399;
    font-size: 11px;
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
}

.text-primary {
    color: #409eff;
}

/* Tabs 切换 */
.view-tabs {
    display: flex;
    padding: 4px 16px;
    background: #ffffff;
    border-bottom: 1px solid #f0f2f5;
    gap: 16px;
}

.tab-item {
    font-size: 12px;
    color: #606266;
    cursor: pointer;
    padding: 6px 0;
    position: relative;
    transition: color 0.2s;
    font-weight: 500;
}

.tab-item:hover {
    color: #409eff;
}

.tab-item.active {
    color: #409eff;
}

.tab-item.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #409eff;
    border-radius: 2px;
}

/* 数据展示区 */
.payload-body {
    flex: 1;
    overflow: auto;
    padding: 16px;
    font-size: 13px;
    color: #303133;
    line-height: 1.6;
}

/* 结构化卡片样式 (Parser 结果) */
.structured-card {
    background: #f9fafb;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 12px;
}

.card-row {
    display: flex;
    margin-bottom: 8px;
}

.card-row:last-child {
    margin-bottom: 0;
}

.row-label {
    width: 60px;
    color: #909399;
    font-size: 12px;
}

.row-value {
    flex: 1;
    font-weight: 500;
    color: #303133;
}

.row-value.main {
    font-size: 15px;
    font-weight: 600;
}

.row-value.highlight {
    color: #409eff;
}

.row-value.desc {
    color: #606266;
    font-size: 12px;
}

.unit {
    font-size: 12px;
    color: #909399;
    margin-left: 4px;
    font-weight: normal;
}

/* 代码块样式 */
.code-block {
    margin: 0;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    background: #f5f7fa;
    padding: 12px;
    border-radius: 6px;
    color: #475569;
    white-space: pre-wrap;
    word-break: break-all;
    border: 1px solid #e4e7ed;
}

.simple-text {
    color: #606266;
}

/* 滚动条 */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
</style>

<style>
/* 全局样式覆盖 */
.el-popover.light-payload-popover {
    padding: 0 !important;
    border-radius: 8px !important;
    box-shadow: 0 12px 32px 4px rgba(0, 0, 0, 0.08), 0 8px 20px rgba(0, 0, 0, 0.04) !important;
    border: 1px solid #e4e7ed !important;
}
</style>