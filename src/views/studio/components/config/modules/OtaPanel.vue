<template>
    <div class="ota-layout">
        <div class="header-bar">
            <div class="header-info">
                <span class="module-title">固件升级 (OTA)</span>
                <span class="module-status" :class="{ 'is-active': modelValue.enabled }">
                    {{ modelValue.enabled ? '服务已启用' : '服务已禁用' }}
                </span>
            </div>
            <el-switch v-model="modelValue.enabled" class="noir-switch" inline-prompt active-text="ON"
                inactive-text="OFF" />
        </div>

        <div class="content-body" :class="{ 'is-disabled': !modelValue.enabled }">
            <div class="panel-left">
                <div class="section-header">
                    <h4 class="title">1. 升级策略 (Policy)</h4>
                    <p class="desc">配置设备的自动更新逻辑与频率。</p>
                </div>

                <OtaStrategyPanel v-model="modelValue.policy" />
            </div>

            <div class="panel-right">
                <div class="section-header row-between">
                    <div>
                        <h4 class="title">2. 版本发布 (Releases)</h4>
                        <p class="desc">管理固件版本与发布范围。</p>
                    </div>
                    <el-button type="primary" size="small" icon="Upload" class="gold-btn-ghost"
                        @click="openPublishDialog">
                        发布新版本
                    </el-button>
                </div>

                <div class="release-container scrollable">
                    <el-empty v-if="!modelValue.releases || modelValue.releases.length === 0" description="暂无发布记录"
                        :image-size="80" />

                    <el-timeline v-else>
                        <el-timeline-item v-for="item in sortedReleases" :key="item.id" :type="getTimelineType(item)"
                            :hollow="item.type !== 'prod'" :timestamp="formatDate(item.createdAt)" placement="top">
                            <div class="release-card">
                                <div class="rc-header">
                                    <span class="rc-version">v{{ item.version }}</span>
                                    <el-tag :type="getTagType(item)" size="small" effect="dark" class="rc-tag">
                                        {{ getTypeName(item.type) }}
                                    </el-tag>
                                    <span v-if="item.type === 'gray'" class="gray-scale-badge">{{ item.grayScale
                                    }}%</span>
                                </div>
                                <div class="rc-content">
                                    <p class="rc-desc">{{ item.description }}</p>
                                    <div class="rc-meta">
                                        <span>{{ formatSize(item.size) }}</span>
                                        <span class="divider">|</span>
                                        <span :class="item.status === 'active' ? 'text-success' : 'text-gray'">
                                            {{ item.status === 'active' ? '● 已上架' : '○ 已暂停' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </el-timeline-item>
                    </el-timeline>
                </div>
            </div>
        </div>

        <FirmwarePublishModal v-model="publishVisible" :next-version="suggestedVersion"
            @publish="handlePublishSuccess" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { OtaConfig, FirmwareRelease } from '@/types/product-config';
import { ElMessage } from 'element-plus';
import OtaStrategyPanel from './ota/OtaStrategyPanel.vue'; // ✅ 引入新组件
import FirmwarePublishModal from './ota/FirmwarePublishModal.vue';

const props = defineProps<{ modelValue: OtaConfig }>();
const emit = defineEmits(['update:modelValue']);

// ... (保留原有的 computed 和 methods: sortedReleases, formatDate, openPublishDialog 等) ...
// ⚠️ 注意：原来的 UPGRADE_MODES 常量已经移入子组件，这里不需要了

// 版本排序
const sortedReleases = computed(() => {
    if (!props.modelValue.releases) return [];
    return [...props.modelValue.releases].sort((a, b) => b.createdAt - a.createdAt);
});

// 辅助函数 (保持不变)
const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatSize = (bytes: number) => (bytes / 1024).toFixed(1) + ' KB';
const getTimelineType = (item: FirmwareRelease) => item.type === 'prod' ? 'success' : item.type === 'gray' ? 'warning' : 'info';
const getTagType = (item: FirmwareRelease) => item.type === 'prod' ? 'success' : item.type === 'gray' ? 'warning' : 'info';
const getTypeName = (type: string) => ({ prod: '正式版', gray: '灰度', dev: '开发版' }[type] || type);

// 弹窗逻辑 (保持不变)
const publishVisible = ref(false);
const suggestedVersion = computed(() => {
    // 1. 获取最新版本，若无则默认为 '1.0.0'
    const lastVer = sortedReleases.value[0]?.version || '1.0.0';

    // 2. 分割并转为数字
    // e.g. "1.0" -> [1, 0]
    let parts = lastVer.split('.').map(n => parseInt(n, 10));

    // 3. 安全校验：如果有非数字（NaN），直接重置
    if (parts.some(n => isNaN(n))) {
        return '1.0.1';
    }

    // 4. 补齐位数 (Padding)
    // 确保至少有 3 位。如果只有 [1, 0]，补成 [1, 0, 0]
    while (parts.length < 3) {
        parts.push(0);
    }

    // 5. 现在可以安全地自增第三位 (Patch) 了
    parts[2] = (parts[2] ?? 0) + 1;

    return parts.join('.');
});

const openPublishDialog = () => { publishVisible.value = true; };

const handlePublishSuccess = (newRelease: FirmwareRelease) => {
    const newReleases = [newRelease, ...(props.modelValue.releases || [])];
    emit('update:modelValue', { ...props.modelValue, releases: newReleases });
};
</script>

<style scoped lang="scss">
/* 复用之前的 OtaPanel 样式，但移除被抽离部分的样式 */
.ota-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    font-family: 'Inter', sans-serif;
}

.header-bar {
    flex-shrink: 0;
    padding: 16px 24px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
}

.module-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    margin-right: 12px;
}

.module-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f4f4f5;
    color: #909399;

    &.is-active {
        color: #d4af37;
        background: rgba(212, 175, 55, 0.1);
    }
}

.content-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
    transition: opacity 0.3s;

    &.is-disabled {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(1);
    }
}

.panel-left,
.panel-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    min-width: 0;
}

.panel-left {
    border-right: 1px solid #e4e7ed;
    background: #fcfcfc;
    max-width: 45%;
}

.panel-right {
    background: #fff;
}

.section-header {
    flex-shrink: 0;
    margin-bottom: 24px;

    &.row-between {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
}

.title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 4px 0;
}

.desc {
    font-size: 12px;
    color: #909399;
    margin: 0;
}

.scrollable {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
}

/* Timeline Card Style (保持右侧样式) */
.release-card {
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .rc-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .rc-version {
        font-family: monospace;
        font-weight: 700;
        font-size: 14px;
    }

    .gray-scale-badge {
        background: #fdf6ec;
        color: #e6a23c;
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 2px;
    }

    .rc-desc {
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
        line-height: 1.5;
    }

    .rc-meta {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;

        .divider {
            margin: 0 8px;
            color: #ebeef5;
        }

        .text-success {
            color: #10b981;
        }

        .text-gray {
            color: #909399;
        }
    }
}

:deep(.noir-switch.el-switch .el-switch__core) {
    border-color: #dcdfe6;
    background: #dcdfe6;
}

:deep(.noir-switch.el-switch.is-checked .el-switch__core) {
    border-color: #d4af37;
    background: #d4af37;
}

:deep(.gold-btn-ghost) {
    color: #d4af37;
    border-color: #d4af37;
    background: transparent;

    &:hover {
        background: #d4af37;
        color: #fff;
    }
}
</style>