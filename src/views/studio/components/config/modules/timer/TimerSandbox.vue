<template>
    <div class="sandbox-panel">
        <div class="panel-header row-between">
            <div>
                <h4 class="title">2. 交互验证 (Simulation)</h4>
                <div class="desc-row">
                    <transition name="fade" mode="out-in">
                        <span v-if="currentDpInfo" :key="currentDpInfo.dpId" class="filter-badge">
                            当前功能: <b>{{ currentDpInfo.name }}</b>
                        </span>
                        <span v-else class="desc">请在左侧选择要验证的功能</span>
                    </transition>
                </div>
            </div>
            <el-button type="primary" size="small" icon="Plus" class="gold-btn-ghost" :disabled="!filterDpId"
                @click="addNewTask">
                新增任务
            </el-button>
        </div>

        <div class="sandbox-content custom-scrollbar" ref="listContainerRef">
            <div v-if="!filterDpId" class="empty-guide-wrapper">
                <el-empty description="← 请先点击左侧的功能卡片" :image-size="100" />
            </div>

            <el-empty v-else-if="displayTasks.length === 0" description="该功能暂无定时任务" :image-size="80" />

            <transition-group name="list" tag="div" class="task-list" v-else>
                <div v-for="(task, idx) in displayTasks" :key="task.id" class="timer-card"
                    :class="{ 'highlight-anim': task.isNew }">
                    <div class="card-header" @click="task.isExpanded = !task.isExpanded">
                        <div class="header-left">
                            <span class="time-text-preview">
                                {{ formatTimeNum(task.target.hour) }}:{{ formatTimeNum(task.target.minute) }}
                            </span>
                            <span class="repeat-tag-preview" v-if="!task.isExpanded">
                                {{ getRepeatLabel(task.target.repeat) }}
                            </span>
                        </div>
                        <div class="header-right">
                            <el-switch v-model="task.enabled" size="small" @click.stop
                                style="--el-switch-on-color: #10b981; margin-right: 12px" />
                            <el-icon :class="{ 'is-rotated': task.isExpanded }" class="expand-icon">
                                <ArrowRight />
                            </el-icon>
                        </div>
                    </div>

                    <div v-show="task.isExpanded" class="card-body">

                        <TaskTimeEditor v-model="task.target" />

                        <el-divider style="margin: 16px 0;" border-style="dashed" />

                        <div class="action-header">执行动作 (Actions):</div>

                        <div v-for="(act, actIdx) in task.actions" :key="actIdx" class="action-row">
                            <div class="target-dp-info">
                                <span class="dp-name">{{ getDpName(act.code) }}</span>
                            </div>
                            <span class="arrow">→</span>
                            <div class="value-control">
                                <el-switch v-if="getDpType(act.code) === 'bool'" v-model="act.value" size="small"
                                    style="--el-switch-on-color: #d4af37" />
                                <el-input-number v-else-if="getDpType(act.code) === 'value'" v-model="act.value"
                                    size="small" controls-position="right" style="width: 100px" />
                                <el-select v-else-if="getDpType(act.code) === 'enum'" v-model="act.value" size="small"
                                    style="width: 100px">
                                    <el-option label="Mode A" value="0" />
                                    <el-option label="Mode B" value="1" />
                                </el-select>
                            </div>
                        </div>

                        <div class="card-footer-actions">
                            <el-button link type="danger" size="small" icon="Delete" @click="removeTask(task.id)">
                                删除任务
                            </el-button>
                        </div>
                    </div>
                </div>
            </transition-group>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { Plus, Delete, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { TimerActionDef, MockTimerTask } from '@/types/timer';
// 引入新组件
import TaskTimeEditor from './components/TaskTimeEditor.vue';


const props = defineProps<{
    availableDps: TimerActionDef[],
    filterDpId: number | null
}>();

const allTasks = ref<(MockTimerTask & { isNew?: boolean })[]>([]);
const listContainerRef = ref<HTMLElement | null>(null);

watch(() => props.filterDpId, () => {
    if (listContainerRef.value) listContainerRef.value.scrollTop = 0;
});

const displayTasks = computed(() => {
    if (!props.filterDpId) return [];
    return allTasks.value.filter(task =>
        task.actions.some(act => act.dpId === props.filterDpId)
    );
});

const currentDpInfo = computed(() => {
    return props.availableDps.find(d => d.dpId === props.filterDpId);
});

const formatTimeNum = (num: number) => String(num).padStart(2, '0');

const getDpType = (code: string) => props.availableDps.find(d => d.code === code)?.type || '';
const getDpName = (code: string) => {
    const dp = props.availableDps.find(d => d.code === code);
    return dp ? (dp.alias || dp.name) : code;
};

const getRepeatLabel = (type: string) => {
    const map: Record<string, string> = { once: '仅一次', daily: '每天', workday: '工作日', weekend: '周末', custom: '自定义' };
    return map[type] || type;
};

const addNewTask = () => {
    if (!props.filterDpId || !currentDpInfo.value) {
        ElMessage.warning("请先在左侧选择一个功能");
        return;
    }

    const dp = currentDpInfo.value;
    const defaultValue = dp.type === 'bool' ? false : 0;

    const newTask: MockTimerTask = {
        id: Date.now(),
        enabled: true,
        isExpanded: true,
        isNew: true,
        target: { hour: 8, minute: 0, repeat: 'daily', weeks: [1, 2, 3, 4, 5, 6, 0] },
        actions: [{
            dpId: dp.dpId,
            code: dp.code,
            value: defaultValue
        }]
    } as any;

    allTasks.value.unshift(newTask);

    nextTick(() => {
        if (listContainerRef.value) listContainerRef.value.scrollTop = 0;
        setTimeout(() => { newTask.isNew = false }, 1000);
    });
};

const removeTask = (taskId: number) => {
    const idx = allTasks.value.findIndex(t => t.id === taskId);
    if (idx > -1) allTasks.value.splice(idx, 1);
};
</script>

<style scoped lang="scss">
/* 保持原有样式不变，移除已被提取的样式（如 .week-selector-area 等） */
.sandbox-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    background: #fff;
}

.panel-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
}

.desc-row {
    margin-top: 4px;
    height: 24px;
    display: flex;
    align-items: center;
}

.desc {
    font-size: 12px;
    color: #909399;
}

.filter-badge {
    font-size: 12px;
    color: #d4af37;
    background: #fffdf5;
    padding: 2px 8px;
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 12px;

    b {
        font-weight: 600;
    }
}

.sandbox-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 4px;
    scroll-behavior: smooth;
    position: relative;
}

.empty-guide-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80%;
    opacity: 0.6;
}

.timer-card {
    border: 1px solid #ebeef5;
    border-radius: 12px;
    background: #fff;
    margin-bottom: 12px;
    overflow: hidden;
    transition: all 0.3s;
    width: 100%;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        border-color: #dcdfe6;
    }

    &.highlight-anim {
        animation: flashGold 1s ease-out;
    }
}

@keyframes flashGold {
    0% {
        box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.5);
        border-color: #d4af37;
    }

    100% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        border-color: #dcdfe6;
    }
}

.card-header {
    padding: 12px 16px;
    background: #fcfcfc;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid transparent;

    &.is-expanded {
        border-bottom-color: #ebeef5;
    }
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    overflow: hidden;
}

.time-text-preview {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: 'Inter', monospace;
}

.repeat-tag-preview {
    font-size: 12px;
    color: #909399;
    background: #f4f4f5;
    padding: 2px 6px;
    border-radius: 4px;
}

.header-right {
    display: flex;
    align-items: center;
}

.expand-icon {
    color: #909399;
    transition: transform 0.2s;

    &.is-rotated {
        transform: rotate(90deg);
    }
}

.card-body {
    padding: 16px;
    background: #fff;
    animation: slideDown 0.2s ease-out;
}

.action-header {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
}

.action-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.target-dp-info {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    width: 100px;
    text-align: right;
}

.arrow {
    color: #dcdfe6;
}

.value-control {
    flex: 1;
}

.card-footer-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px dashed #ebeef5;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
    transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.list-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.list-leave-active {
    position: absolute;
    width: 100%;
    z-index: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

:deep(.gold-btn-ghost) {
    color: #d4af37;
    border-color: #d4af37;
    background: transparent;

    &:disabled {
        border-color: #e4e7ed;
        color: #c0c4cc;
    }
}
</style>