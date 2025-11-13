<template>
    <el-card v-if="!firmware" class="detail-card" shadow="never">
        <div class="empty-wrapper">
            <el-empty description="请点击左侧列表查看固件详情" :image-size="120" />
        </div>
    </el-card>

    <el-card v-else class="detail-card" shadow="never">
        <template #header>
            <div class="detail-header-group">
                <div class="header-left">
                    <h2 class="detail-title">{{ firmware.productName }}</h2>
                    <el-tag class="ml-3" effect="dark" :type="getFirmwareVerifiedStatus(firmware.verified).type">
                        {{ firmware.version }}
                    </el-tag>
                </div>

                <div class="header-actions">
                    <el-button plain icon="Download" @click="onDownload">下载</el-button>
                    <el-button type="primary" icon="VideoPlay" @click="$emit('create-task', firmware)">
                        创建升级任务
                    </el-button>
                </div>
            </div>
        </template>

        <div class="detail-body">

            <el-descriptions title="版本信息" :column="2" border class="info-table">
                <el-descriptions-item label="版本号">
                    <span class="mono-text">{{ firmware.version }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="适用产品">
                    {{ firmware.productName }}
                </el-descriptions-item>
                <el-descriptions-item label="上传时间">
                    {{ formatDateTime(firmware.uploadedAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="验证状态">
                    <el-tag size="small" :type="getFirmwareVerifiedStatus(firmware.verified).type">
                        {{ getFirmwareVerifiedStatus(firmware.verified).label }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="文件链接" :span="2">
                    <el-link type="primary" :href="firmware.fileUrl" target="_blank" :underline="false">
                        {{ firmware.fileUrl }}
                    </el-link>
                </el-descriptions-item>
            </el-descriptions>

            <div class="section-block">
                <h3 class="section-title">发布说明</h3>
                <div class="release-notes-box">
                    <pre>{{ firmware.releaseNotes || '暂无发布说明...' }}</pre>
                </div>
            </div>

            <div class="section-block">
                <h3 class="section-title">版本演进</h3>
                <el-timeline>
                    <el-timeline-item :timestamp="formatDate(firmware.uploadedAt)" placement="top" type="primary" hollow
                        size="large">
                        <el-card shadow="hover" class="timeline-card active">
                            <h4>{{ firmware.version }} (当前选中)</h4>
                            <p>刚刚上传的最新版本，请确保在小范围设备上验证通过后再全量推送。</p>
                        </el-card>
                    </el-timeline-item>

                    <el-timeline-item timestamp="2023-10-01" placement="top" color="#909399">
                        <div class="history-item">
                            <span class="text-bold">v1.5.0</span>
                            <span class="text-gray ml-2">- 稳定性修复补丁</span>
                        </div>
                    </el-timeline-item>
                    <el-timeline-item timestamp="2023-09-15" placement="top" color="#e4e7ed">
                        <div class="history-item">
                            <span class="text-bold">v1.0.0</span>
                            <span class="text-gray ml-2">- 初始发布版本</span>
                        </div>
                    </el-timeline-item>
                </el-timeline>
            </div>

        </div>
    </el-card>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import { Download, VideoPlay } from '@element-plus/icons-vue'
import type { Firmware } from '@/types/index'
import { formatDateTime, formatDate, getFirmwareVerifiedStatus } from '@/utils/formatters'
import { ElMessage } from 'element-plus'

const props = defineProps({
    firmware: {
        type: Object as PropType<Firmware | null>,
        default: null
    }
})

const emit = defineEmits(['create-task'])

const onDownload = () => {
    if (props.firmware?.fileUrl) {
        window.open(props.firmware.fileUrl, '_blank')
    } else {
        ElMessage.warning('无效的下载链接')
    }
}
</script>

<style scoped>
/* 局部样式微调 */
.empty-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 400px;
}

.ml-3 {
    margin-left: 12px;
}

.header-left {
    display: flex;
    align-items: center;
}

/* 详情部分间距 */
.detail-body {
    padding-top: 8px;
}

.info-table {
    margin-bottom: 32px;
}

/* 单宽字体，适合显示版本号和哈希值 */
.mono-text {
    font-family: 'Roboto Mono', monospace;
    color: #303133;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 4px;
}

.section-block {
    margin-bottom: 32px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    border-left: 4px solid #409eff;
    padding-left: 12px;
}

/* 发布说明样式框 */
.release-notes-box {
    background-color: #282c34;
    /* 代码风格深色背景 */
    color: #abb2bf;
    padding: 16px;
    border-radius: 8px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    line-height: 1.6;
    overflow-x: auto;
}

.release-notes-box pre {
    margin: 0;
    white-space: pre-wrap;
}

/* 时间轴卡片微调 */
.timeline-card.active {
    border: 1px solid #c6e2ff;
    background-color: #ecf5ff;
}

.timeline-card h4 {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #409eff;
}

.timeline-card p {
    margin: 0;
    font-size: 13px;
    color: #606266;
}

.history-item {
    font-size: 14px;
}

.text-bold {
    font-weight: 600;
    color: #303133;
}

.text-gray {
    color: #909399;
    font-size: 13px;
}
</style>