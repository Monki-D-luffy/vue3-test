<template>
    <div class="sandbox-panel">
        <div class="panel-header row-between">
            <div>
                <h4 class="title">2. 交互验证 (Simulation)</h4>
                <p class="desc">使用右上角按钮添加测试任务。</p>
            </div>
            <el-button type="primary" size="small" icon="Plus" class="gold-btn-ghost"
                :disabled="availableDps.length === 0" @click="addNewTask">
                新增任务
            </el-button>
        </div>

        <div class="sandbox-content custom-scrollbar" ref="listContainerRef">
            <div v-if="availableDps.length === 0" class="empty-guide">
                <el-alert title="请先在左侧绑定功能" type="warning" :closable="false" show-icon />
            </div>
            <el-empty v-else-if="tasks.length === 0" description="暂无测试任务" :image-size="80" />

            <transition-group name="list" tag="div" class="task-list">
                <div v-for="(task, idx) in tasks" :key="task.id" class="timer-card"
                    :class="{ 'highlight-anim': task.isNew }">

                    <div class="card-header" @click="task.isExpanded = !task.isExpanded">
                        <div class="header-left">
                            <span class="time-text">
                                {{ String(task.target.hour).padStart(2, '0') }}:{{
                                    String(task.target.minute).padStart(2,'0') }}
                            </span>
                            <span class="task-summary text-ellipsis">
                                {{ getTaskSummary(task) }}
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
                        <div class="time-edit-row" @click="openTimePicker(task)">
                            <div class="info-group">
                                <span class="label">触发时间:</span>
                                <span class="value">{{ String(task.target.hour).padStart(2, '0') }}:{{
                                    String(task.target.minute).padStart(2,'0') }}</span>
                            </div>
                            <div class="info-group">
                                <span class="label">重复:</span>
                                <el-tag size="small" effect="plain" class="noir-tag">{{
                                    getRepeatLabel(task.target.repeat) }}</el-tag>
                            </div>
                            <el-button link size="small" icon="Edit" class="edit-btn">修改</el-button>
                        </div>

                        <el-divider style="margin: 12px 0;" />

                        <div class="action-header">执行动作 (Actions):</div>
                        <div v-for="(act, actIdx) in task.actions" :key="actIdx" class="action-row">
                            <el-select v-model="act.code" size="small" class="noir-select action-select"
                                @change="(val: any) => handleActionCodeChange(act, val)">
                                <el-option v-for="dp in availableDps" :key="dp.dpId" :label="dp.alias || dp.name"
                                    :value="dp.code" />
                            </el-select>

                            <span class="arrow">→</span>

                            <div class="value-control">
                                <el-switch v-if="getDpType(act.code) === 'bool'" v-model="act.value" size="small"
                                    style="--el-switch-on-color: #d4af37" />
                                <el-input-number v-else-if="getDpType(act.code) === 'value'" v-model="act.value"
                                    size="small" controls-position="right" style="width: 100px" />
                                <el-select v-else-if="getDpType(act.code) === 'enum'" v-model="act.value" size="small"
                                    placeholder="Select" style="width: 100px">
                                    <el-option label="Mode A" value="0" />
                                    <el-option label="Mode B" value="1" />
                                </el-select>

                                <span v-else class="invalid-text">请选择功能</span>
                            </div>

                            <el-icon class="del-action-btn" @click="removeAction(task, actIdx)">
                                <Close />
                            </el-icon>
                        </div>

                        <div class="card-footer-actions">
                            <el-button link size="small" icon="Plus" @click="addActionToTask(task)">加动作</el-button>
                            <el-button link type="danger" size="small" icon="Delete"
                                @click="tasks.splice(idx, 1)">删除任务</el-button>
                        </div>
                    </div>
                </div>
            </transition-group>
        </div>

        <TimePickerModal v-model="pickerVisible" :initial-data="currentEditingTask?.target"
            @confirm="handleTimeConfirm" />
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Edit, Close, Plus, Delete, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { TimerActionDef, MockTimerTask, MockAction, TimeTarget } from '@/types/timer';
import TimePickerModal from './components/TimePickerModal.vue';

const props = defineProps<{
    availableDps: TimerActionDef[]
}>();

const tasks = ref<(MockTimerTask & { isNew?: boolean })[]>([]);
const pickerVisible = ref(false);
const currentEditingTask = ref<MockTimerTask | null>(null);
const listContainerRef = ref<HTMLElement | null>(null);

// --- Helpers ---
const getDpType = (code: string) => props.availableDps.find(d => d.code === code)?.type || '';

const getRepeatLabel = (type: string) => {
    const map: Record<string, string> = { once: '仅一次', daily: '每天', workday: '工作日', weekend: '周末', custom: '自定义' };
    return map[type] || type;
};

const getTaskSummary = (task: MockTimerTask) => {
    if (!task.actions || task.actions.length === 0) return '无动作';
    return task.actions.map(act => {
        const dp = props.availableDps.find(d => d.code === act.code);
        const name = dp ? (dp.alias || dp.name) : '未知功能';
        let valStr = String(act.value);
        if (typeof act.value === 'boolean') valStr = act.value ? 'ON' : 'OFF';
        return `${name}: ${valStr}`;
    }).join(', ');
};

// --- Operations ---
const addNewTask = () => {
    if (!props.availableDps || props.availableDps.length === 0) {
        ElMessage.warning("请先在左侧绑定功能");
        return;
    }

    // 默认使用第一个可用功能
    const defaultDp = props.availableDps[0];
    if (!defaultDp) return;

    const defaultValue = defaultDp.type === 'bool' ? false : 0;

    // 创建全新独立对象
    const newTask: MockTimerTask = {
        id: Date.now(),
        enabled: true,
        isExpanded: true,
        // 默认给个动画标记
        isNew: true,
        target: { hour: 8, minute: 0, repeat: 'daily' as const, weeks: [1, 2, 3, 4, 5, 6, 0] },
        actions: [{
            dpId: 0,
            code: defaultDp.code,
            value: defaultValue
        }]
    } as any; // 强转一下避免 MockTimerTask 和 isNew 的类型冲突

    tasks.value.unshift(newTask);

    nextTick(() => {
        if (listContainerRef.value) listContainerRef.value.scrollTop = 0;
        setTimeout(() => { newTask.isNew = false }, 1000);
    });
};

const addActionToTask = (task: MockTimerTask) => {
    if (props.availableDps.length > 0) {
        const defaultDp = props.availableDps[0];
        if (!defaultDp) return;

        const defaultValue = defaultDp.type === 'bool' ? false : 0;
        // 确保是新对象
        task.actions.push({ dpId: 0, code: defaultDp.code, value: defaultValue });
    }
};

const removeAction = (task: MockTimerTask, idx: number) => {
    task.actions.splice(idx, 1);
};

const handleActionCodeChange = (act: MockAction, newCode: string) => {
    const type = getDpType(newCode);
    if (type === 'bool') act.value = false;
    else if (type === 'value') act.value = 0;
    else act.value = '';
};

// --- Picker ---
const openTimePicker = (task: MockTimerTask) => {
    currentEditingTask.value = task;
    pickerVisible.value = true;
};

const handleTimeConfirm = (newTarget: TimeTarget) => {
    if (currentEditingTask.value) {
        currentEditingTask.value.target = { ...newTarget };
    }
};
</script>

<style scoped lang="scss">
/* 保持样式不变 */
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
    align-items: flex-start;
}

.title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 4px 0;
}

.desc {
    font-size: 12px;
    color: #909399;
    margin: 0;
}

.sandbox-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 4px;
    scroll-behavior: smooth;
}

.empty-guide {
    margin-bottom: 20px;
}

.timer-card {
    border: 1px solid #ebeef5;
    border-radius: 12px;
    background: #fff;
    margin-bottom: 12px;
    overflow: hidden;
    transition: all 0.3s;

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

.time-text {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: 'Inter', monospace;
}

.task-summary {
    font-size: 13px;
    color: #606266;
    flex: 1;
    opacity: 0.8;
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

.time-edit-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px;
    background: #f9f9f9;
    border-radius: 8px;
    cursor: pointer;

    &:hover .edit-btn {
        opacity: 1;
    }
}

.info-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #606266;
}

.value {
    font-weight: 600;
    color: #1a1a1a;
}

.edit-btn {
    opacity: 0;
    transition: opacity 0.2s;
    color: #d4af37;
}

.action-header {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
}

.action-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.action-select {
    width: 120px;
}

.value-control {
    flex: 1;
    min-width: 80px;
}

.del-action-btn {
    cursor: pointer;
    color: #dcdfe6;

    &:hover {
        color: #f56c6c;
    }
}

.invalid-text {
    font-size: 12px;
    color: #f56c6c;
    background: #fef0f0;
    padding: 2px 6px;
    border-radius: 4px;
}

.card-footer-actions {
    display: flex;
    justify-content: space-between;
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

:deep(.noir-tag) {
    border-color: #e4e7ed;
    color: #606266;
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