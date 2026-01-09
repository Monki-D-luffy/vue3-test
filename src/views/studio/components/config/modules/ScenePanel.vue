<template>
    <div class="scene-panel-container">
        <div class="panel-header">
            <div class="header-left">
                <h2 class="section-title">场景联动</h2>
                <span class="section-desc">自动化规则编排：当满足条件时，自动执行任务</span>
            </div>
            <div class="header-right">
                <el-input v-model="searchQuery" placeholder="搜索场景名称..." :prefix-icon="Search" class="search-input"
                    clearable />
                <el-button type="primary" :icon="Plus" class="create-btn" @click="handleCreate">
                    新建场景
                </el-button>
            </div>
        </div>

        <el-row :gutter="20">
            <el-col :span="24" v-if="filteredScenes.length === 0">
                <div class="empty-wrapper">
                    <el-empty description="暂无场景配置" :image-size="120">
                        <el-button type="primary" @click="handleCreate">立即创建</el-button>
                    </el-empty>
                </div>
            </el-col>

            <el-col v-for="scene in filteredScenes" :key="scene.id" :xs="24" :sm="12" :md="12" :lg="8" :xl="6"
                class="mb-20">
                <div class="scene-card hover-lift" :class="{ 'is-disabled': !scene.enabled }"
                    @click="handleEdit(scene)">
                    <div class="card-top">
                        <div class="scene-meta">
                            <div class="title-row">
                                <span class="status-indicator" :class="{ active: scene.enabled }"></span>
                                <h3 class="name text-ellipsis" :title="scene.name">{{ scene.name }}</h3>
                            </div>
                            <p class="desc text-ellipsis">{{ scene.description || '暂无描述' }}</p>
                        </div>
                        <el-switch v-model="scene.enabled" size="small" inline-prompt active-text="ON"
                            inactive-text="OFF" @click.stop />
                    </div>

                    <div class="pipeline-detail-box">

                        <el-popover placement="top" :width="260" trigger="hover" popper-class="scene-detail-popper">
                            <template #reference>
                                <div class="detail-column trigger-col">
                                    <div class="col-header">
                                        <span class="label">IF</span>
                                        <el-tag size="small" effect="plain" round class="logic-tag">
                                            {{ scene.matchType === 'OR' ? '满足任一' : '满足所有' }}
                                        </el-tag>
                                    </div>
                                    <div class="item-list">
                                        <div v-for="(t, idx) in scene.triggers.slice(0, 2)" :key="idx"
                                            class="detail-item">
                                            <el-icon class="item-icon">
                                                <component :is="getIconByType(t.type)" />
                                            </el-icon>
                                            <span class="item-text text-ellipsis">{{ getTriggerText(t) }}</span>
                                        </div>
                                        <div v-if="scene.triggers.length > 2" class="more-item">
                                            +{{ scene.triggers.length - 2 }} 更多条件...
                                        </div>
                                        <div v-if="scene.triggers.length === 0" class="empty-item">未配置触发条件</div>
                                    </div>
                                </div>
                            </template>

                            <div class="popper-list">
                                <div class="popper-title">触发条件列表 ({{ scene.matchType }})</div>
                                <div v-for="(t, i) in scene.triggers" :key="i" class="popper-item">
                                    <el-icon>
                                        <component :is="getIconByType(t.type)" />
                                    </el-icon>
                                    <span>{{ getTriggerText(t) }}</span>
                                </div>
                            </div>
                        </el-popover>

                        <div class="flow-arrow-vertical">
                            <el-icon>
                                <Right />
                            </el-icon>
                        </div>

                        <el-popover placement="top" :width="260" trigger="hover" popper-class="scene-detail-popper">
                            <template #reference>
                                <div class="detail-column action-col">
                                    <div class="col-header">
                                        <span class="label">THEN</span>
                                    </div>
                                    <div class="item-list">
                                        <div v-for="(a, idx) in scene.actions.slice(0, 2)" :key="idx"
                                            class="detail-item">
                                            <el-icon class="item-icon">
                                                <component :is="getIconByType(a.type)" />
                                            </el-icon>
                                            <span class="item-text text-ellipsis">{{ a.displayText || '未配置动作' }}</span>
                                        </div>
                                        <div v-if="scene.actions.length > 2" class="more-item">
                                            +{{ scene.actions.length - 2 }} 更多动作...
                                        </div>
                                        <div v-if="scene.actions.length === 0" class="empty-item">未配置执行动作</div>
                                    </div>
                                </div>
                            </template>
                            <div class="popper-list">
                                <div class="popper-title">执行动作列表</div>
                                <div v-for="(a, i) in scene.actions" :key="i" class="popper-item">
                                    <el-icon>
                                        <component :is="getIconByType(a.type)" />
                                    </el-icon>
                                    <span>{{ a.displayText }}</span>
                                </div>
                            </div>
                        </el-popover>

                    </div>

                    <div class="card-bottom">
                        <div class="last-run-info">...</div>
                        <el-button v-if="isManualScene(scene)" type="primary" link size="small" icon="VideoPlay"
                            @click.stop="handleRun(scene)">
                            立即运行
                        </el-button>
                    </div>
                </div>
            </el-col>
        </el-row>

        <SceneDrawer v-model="drawerVisible" :scene-data="currentScene" @save="handleSave" />
        <ExecutionLogModal v-model="logVisible" :logs="executionLogs" :loading="isExecuting" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
    Search, Plus, VideoPlay, Right, Clock,
    Timer, Pointer, Lightning, Bell, Sunny, Moon, Connection
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { SceneRule } from '@/types/automation';
import { useStudioStore } from '@/stores/studioStore';

import SceneDrawer from '@/views/studio/components/scene/SceneDrawer.vue';
import ExecutionLogModal from '@/views/studio/components/scene/ExecutionLogModal.vue';

const store = useStudioStore();

// --- State ---
const searchQuery = ref('');
const drawerVisible = ref(false);
const currentScene = ref<SceneRule | undefined>(undefined);
const logVisible = ref(false);
const executionLogs = ref<any[]>([]);
const isExecuting = ref(false);

// --- Computed ---
const filteredScenes = computed(() => {
    const scenes = store.scenes || [];
    if (!searchQuery.value) return scenes;
    return scenes.filter(s =>
        s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

onMounted(() => {
    store.fetchScenes();
});

// --- Icons Helper ---
// 根据类型返回对应图标，用于列表中直观展示
const getIconByType = (type: string) => {
    const map: Record<string, any> = {
        timer: Timer,
        manual: Pointer,
        condition: Lightning,
        device: Sunny, // 假设设备是 Sunny
        scene: Moon,
        notify: Bell,
        service: Connection
    };
    return map[type] || Lightning;
};

const isManualScene = (scene: SceneRule) => {
    return scene.triggers.some(t => t.type === 'manual');
};

const formatTime = (isoStr: string) => {
    if (!isoStr) return '从未触发';
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// --- Handlers (保持不变) ---
const handleCreate = () => {
    currentScene.value = undefined;
    drawerVisible.value = true;
};

const handleEdit = (scene: SceneRule) => {
    currentScene.value = JSON.parse(JSON.stringify(scene));
    drawerVisible.value = true;
};

const handleSave = async (scene: SceneRule) => {
    const success = await store.saveScene(scene);
    if (success) {
        ElMessage.success('场景已保存');
        drawerVisible.value = false;
    }
    // Error handled in store
};

const handleRun = async (scene: SceneRule) => {
    logVisible.value = true;
    isExecuting.value = true;
    executionLogs.value = [];
    try {
        const result = await store.runScene(scene.id);
        if (result && result.logs) executionLogs.value = result.logs;
    } catch (e) {
        ElMessage.error('执行失败');
    } finally {
        isExecuting.value = false;
    }
};

// --- 增强的格式化工具 (Fail-safe Formatter) ---
const getTriggerText = (t: any) => {
    // 1. 如果有现成的 displayText，直接用
    if (t.displayText && t.displayText.trim() !== '') return t.displayText;

    // 2. 如果没有，根据类型尝试生成（兜底逻辑）
    switch (t.type) {
        case 'manual': return '手动点击执行';
        case 'timer': return t.cron ? `定时: ${t.cron}` : '定时任务';
        case 'device':
            // 尝试拼凑信息
            return `设备条件 (ID:${t.deviceId?.slice(-4) || '?'})`;
        default: return '未知条件';
    }
};

const getActionText = (a: any) => {
    if (a.displayText && a.displayText.trim() !== '') return a.displayText;

    switch (a.type) {
        case 'device': return '设备控制';
        case 'notify': return '发送通知';
        case 'delay': return '延时等待';
        default: return '执行动作';
    }
};
</script>

<style scoped>
/* 容器 */
.scene-panel-container {
    height: 100%;
}

.mb-20 {
    margin-bottom: 20px;
}

/* Header */
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #1f2937;
}

.section-desc {
    font-size: 13px;
    color: #9ca3af;
}

.header-right {
    display: flex;
    gap: 12px;
}

.search-input {
    width: 220px;
}

.create-btn {
    padding: 8px 20px;
}

/* 卡片主体 */
.scene-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #eaecf0;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    min-height: 200px;
    /* 保证高度一致 */
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
    border-color: #d0d5dd;
}

.scene-card.is-disabled {
    opacity: 0.6;
    background-color: #f9fafb;
}

/* Top Area */
.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.scene-meta {
    flex: 1;
    min-width: 0;
    margin-right: 12px;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #d1d5db;
}

.status-indicator.active {
    background: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.name {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0;
}

.desc {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
}

/* Pipeline Detail Box (核心布局) */
.pipeline-detail-box {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    padding: 12px;
    display: flex;
    align-items: stretch;
    /* 等高 */
    gap: 8px;
    flex: 1;
    /* 撑开中间部分 */
    margin-bottom: 16px;
}

.detail-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.col-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.col-header .label {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.5px;
}

.logic-tag {
    height: 18px;
    padding: 0 6px;
    font-size: 10px;
    background-color: transparent;
    border-color: #cbd5e1;
    color: #64748b;
}

/* 条件列表项 */
.item-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    color: #334155;
    height: 28px;
}

/* 颜色区分 Trigger 和 Action */
.trigger-col .detail-item {
    border-left: 2px solid #3b82f6;
    /* Blue indicator */
}

.action-col .detail-item {
    border-left: 2px solid #10b981;
    /* Green indicator */
}

.item-icon {
    font-size: 14px;
    color: #64748b;
    flex-shrink: 0;
}

.item-text {
    flex: 1;
    line-height: 1.2;
}

.more-item,
.empty-item {
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    margin-top: 2px;
}

/* 中间箭头 */
.flow-arrow-vertical {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
    width: 20px;
}

/* 底部 */
.card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #f3f4f6;
    padding-top: 12px;
    margin-top: auto;
}

.last-run-info {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Element Plus 覆盖 */
:deep(.el-switch.is-checked .el-switch__core) {
    background-color: #10b981;
    border-color: #10b981;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.empty-wrapper {
    padding: 40px;
    display: flex;
    justify-content: center;
}
</style>

<style>
/* Popover 样式 (全局但带命名空间) */
.scene-detail-popper {
    padding: 0 !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e2e8f0 !important;
}

.popper-title {
    background: #f8fafc;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 8px 8px 0 0;
}

.popper-list {
    display: flex;
    flex-direction: column;
}

.popper-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
}

.popper-item:last-child {
    border-bottom: none;
}

.popper-item:hover {
    background: #f8fafc;
}
</style>