<template>
    <div class="scene-automation-container">
        <div class="header-actions">
            <div class="left-panel">
                <h2 class="page-title">场景联动 (Automation)</h2>
                <p class="page-subtitle">编排设备间的自动化逻辑，打造智能闭环。</p>
            </div>
            <div class="right-panel">
                <el-input v-model="searchQuery" placeholder="搜索场景名称..." prefix-icon="Search" class="search-input"
                    clearable />
                <el-button type="primary" icon="Plus" @click="handleCreate">
                    新建场景
                </el-button>
            </div>
        </div>

        <el-row :gutter="24">
            <el-col :span="24" v-if="filteredScenes.length === 0">
                <el-empty description="暂无场景，点击右上角创建一个吧" />
            </el-col>

            <el-col v-for="scene in filteredScenes" :key="scene.id" :xs="24" :sm="12" :md="8" :xl="6" class="mb-24">
                <div class="scene-card dashboard-card"
                    :class="{ 'is-disabled': !scene.enabled, 'is-manual': isManualScene(scene) }"
                    @click="handleEdit(scene)">
                    <div class="status-indicator"
                        :style="{ background: scene.enabled ? 'var(--el-color-primary)' : 'var(--el-border-color)' }">
                    </div>

                    <div class="card-header">
                        <div class="scene-icon">
                            <el-icon :size="20">
                                <component :is="getSceneIcon(scene)" />
                            </el-icon>
                        </div>
                        <div class="scene-info">
                            <h3 class="scene-name text-ellipsis" :title="scene.name">{{ scene.name }}</h3>
                            <span class="scene-desc text-ellipsis">{{ scene.description || '暂无描述' }}</span>
                        </div>
                        <el-switch v-model="scene.enabled" size="small" @click.stop active-action-icon="Check"
                            inactive-action-icon="Close" />
                    </div>

                    <div class="logic-flow">
                        <div class="flow-section triggers">
                            <div class="section-label">IF ({{ scene.matchType === 'AND' ? '满足所有' : '满足任一' }})</div>
                            <div class="chip-container">
                                <el-tag v-for="(trigger, idx) in scene.triggers.slice(0, 2)" :key="trigger.id"
                                    size="small" effect="light" class="flow-tag trigger-tag">
                                    {{ trigger.displayText }}
                                </el-tag>
                                <el-tag v-if="scene.triggers.length > 2" size="small" type="info" class="more-tag">+{{
                                    scene.triggers.length - 2 }}</el-tag>
                            </div>
                        </div>

                        <div class="flow-arrow">
                            <el-icon>
                                <Bottom />
                            </el-icon>
                        </div>

                        <div class="flow-section actions">
                            <div class="section-label">THEN</div>
                            <div class="chip-container">
                                <el-tag v-for="(action, idx) in scene.actions.slice(0, 2)" :key="action.id" size="small"
                                    effect="light" class="flow-tag action-tag">
                                    {{ action.displayText }}
                                </el-tag>
                                <el-tag v-if="scene.actions.length > 2" size="small" type="info" class="more-tag">+{{
                                    scene.actions.length - 2 }}</el-tag>
                            </div>
                        </div>
                    </div>

                    <div class="card-footer" v-if="isManualScene(scene)" @click.stop>
                        <el-button type="primary" link size="small" icon="VideoPlay" @click="handleRun(scene)">
                            立即执行
                        </el-button>
                        <span class="last-run" v-if="scene.lastTriggered">
                            上次执行: {{ formatTime(scene.lastTriggered) }}
                        </span>
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
import { Search, Plus, Check, Close, Bottom, VideoPlay, Timer, Pointer, Connection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { SceneRule } from '@/types/automation';
import { useStudioStore } from '@/stores/studioStore';

// ✅ 这里的路径必须指向上面新建的文件
import SceneDrawer from '@/views/studio/components/scene/SceneDrawer.vue';
import ExecutionLogModal from '@/views/studio/components/scene/ExecutionLogModal.vue';

const store = useStudioStore();

// --- State ---
const searchQuery = ref('');
const drawerVisible = ref(false);
const currentScene = ref<SceneRule | undefined>(undefined);

// Log Modal State
const logVisible = ref(false);
const executionLogs = ref<any[]>([]);
const isExecuting = ref(false);

// ✅ 使用 Store 数据，增加防御性检查
const filteredScenes = computed(() => {
    const scenes = store.scenes || [];
    if (!searchQuery.value) return scenes;
    return scenes.filter(s =>
        s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

// --- Init ---
onMounted(() => {
    store.fetchScenes();
});

// --- Helpers ---
const isManualScene = (scene: SceneRule) => {
    return scene.triggers.some(t => t.type === 'manual');
};

const getSceneIcon = (scene: SceneRule) => {
    if (isManualScene(scene)) return 'Pointer';
    if (scene.triggers.some(t => t.type === 'timer')) return 'Timer';
    return 'Connection';
};

const formatTime = (isoStr: string) => {
    if (!isoStr) return '从未';
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// --- Handlers ---
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
    } else {
        ElMessage.error('保存失败');
    }
};

const handleRun = async (scene: SceneRule) => {
    logVisible.value = true;
    isExecuting.value = true;
    executionLogs.value = [];

    try {
        const result = await store.runScene(scene.id);
        if (result && result.logs) {
            executionLogs.value = result.logs;
        }
    } catch (e) {
        console.error(e);
        ElMessage.error('执行失败，请检查后端服务是否启动');
    } finally {
        isExecuting.value = false;
    }
};
</script>

<style scoped>
/* 容器与布局 */
.scene-automation-container {
    padding: 0;
}

.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--el-text-color-primary);
}

.page-subtitle {
    color: var(--el-text-color-secondary);
    margin: 0;
    font-size: 14px;
}

.right-panel {
    display: flex;
    gap: 12px;
}

.search-input {
    width: 240px;
}

.mb-24 {
    margin-bottom: 24px;
}

/* 卡片样式 */
.scene-card {
    position: relative;
    height: 100%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.scene-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-card);
    border-color: var(--el-color-primary-light-5);
}

.scene-card.is-disabled {
    opacity: 0.7;
    filter: grayscale(0.8);
}

/* 左侧状态条 */
.status-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    transition: background 0.3s;
}

/* 卡片头部 */
.card-header {
    padding: 16px 20px 12px 20px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.scene-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
    flex-shrink: 0;
}

.scene-info {
    flex: 1;
    min-width: 0;
}

.scene-name {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.scene-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    display: block;
}

/* 逻辑流可视化区 */
.logic-flow {
    padding: 16px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.flow-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.chip-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.flow-tag {
    border: none;
    font-weight: 500;
}

.trigger-tag {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}

.action-tag {
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
}

.flow-arrow {
    display: flex;
    justify-content: center;
    opacity: 0.3;
    margin: -4px 0;
}

/* 底部操作区 */
.card-footer {
    padding: 12px 20px;
    background: var(--el-fill-color-lighter);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--el-border-color-lighter);
}

.last-run {
    font-size: 11px;
    color: var(--el-text-color-secondary);
}
</style>