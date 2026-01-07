<template>
    <div class="timer-layout noir-skin">
        <div class="header-bar">
            <div class="header-info">
                <span class="module-title">云端定时 (Cloud Timer)</span>
                <span class="module-status" :class="{ 'is-active': modelValue.enabled }">
                    {{ modelValue.enabled ? '服务已启用' : '服务已禁用' }}
                </span>
            </div>
            <el-switch v-model="modelValue.enabled" class="noir-switch" inline-prompt active-text="ON"
                inactive-text="OFF" style="--el-switch-on-color: #d4af37" />
        </div>

        <div class="content-body" :class="{ 'is-disabled': !modelValue.enabled }">

            <div class="panel-left">
                <div class="section-header">
                    <h4 class="title">1. 功能白名单 (Capabilities)</h4>
                    <p class="desc">勾选允许用户在 App 端设定的功能点。</p>
                </div>

                <div class="list-container scrollable">
                    <div v-for="dp in mergedActionList" :key="dp.dpId" class="config-item"
                        :class="{ 'selected': dp.selected }" @click="toggleDp(dp)">
                        <el-checkbox v-model="dp.selected" @click.stop class="noir-checkbox" />
                        <div class="item-info">
                            <div class="item-row">
                                <span class="dp-name">{{ dp.name }}</span>
                                <el-tag size="small" type="info" effect="plain" class="dp-tag">DP{{ dp.dpId }}</el-tag>
                            </div>
                            <div class="item-row alias-row" v-if="dp.selected" @click.stop>
                                <span class="alias-label">App显示名称:</span>
                                <el-input v-model="dp.alias" size="small" class="alias-input noir-input-ghost"
                                    placeholder="例如: 自动开关" />
                            </div>
                        </div>
                        <div class="item-type">{{ dp.type }}</div>
                    </div>
                </div>

                <div class="global-setting">
                    <span class="label">单设备最大任务数</span>
                    <el-input-number v-model="modelValue.maxSchedules" :min="1" :max="30" size="small"
                        controls-position="right" class="noir-input-number" />
                </div>
            </div>

            <div class="panel-right">
                <div class="section-header row-between">
                    <div>
                        <h4 class="title">2. App 交互沙盒 (Sandbox)</h4>
                        <p class="desc">模拟真实 App 定时设置，验证白名单逻辑。</p>
                    </div>
                    <el-button type="primary" size="small" icon="Plus" class="gold-btn-ghost" @click="addMockTimer"
                        :disabled="activeActions.length === 0">
                        新增定时
                    </el-button>
                </div>

                <div class="sandbox-container scrollable">
                    <el-empty v-if="mockTimers.length === 0" description="暂无定时任务，点击右上角添加" :image-size="80" />

                    <div v-else class="timer-cards">
                        <div v-for="(task, index) in mockTimers" :key="task.id" class="timer-card-mock">
                            <div class="card-left">
                                <el-time-picker v-model="task.time" format="HH:mm" value-format="HH:mm"
                                    :clearable="false" size="small" class="noir-time-picker-text" />
                                <span class="repeat-text">每天</span>
                            </div>

                            <div class="card-mid">
                                <div class="action-row">
                                    <span class="label">执行:</span>

                                    <el-select v-model="task.targetDpCode" placeholder="选择功能" size="small"
                                        class="noir-select-sm" @change="handleDpChange(task)">
                                        <el-option v-for="act in activeActions" :key="act.dpId"
                                            :label="act.alias || act.name" :value="act.code" />
                                    </el-select>

                                    <div class="value-input-area">
                                        <el-switch v-if="getDpType(task.targetDpCode) === 'bool'" v-model="task.value"
                                            size="small" style="--el-switch-on-color: #10b981" />

                                        <span v-else-if="getDpType(task.targetDpCode) === 'enum'" class="enum-mock">
                                            模式A
                                        </span>

                                        <el-input-number v-else v-model="task.value" size="small"
                                            controls-position="right" style="width: 80px" />
                                    </div>
                                </div>
                            </div>

                            <div class="card-right">
                                <el-button type="danger" link icon="Delete" @click="mockTimers.splice(index, 1)" />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sandbox-footer">
                    <el-alert title="此区域仅为交互演示，数据不会下发到设备。" type="info" show-icon :closable="false" class="noir-alert" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { TimerConfig, TimerActionDef } from '@/types/product-config';
import { useStudioStore } from '@/stores/studioStore';

const props = defineProps<{ modelValue: TimerConfig }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

// --- 1. 左侧逻辑：白名单管理 ---

// 如果 Store 里没数据，使用这些假数据撑起界面
const fallbackDps = [
    { id: 101, code: 'switch_led', name: '主灯开关', type: 'bool', mode: 'rw' },
    { id: 102, code: 'color_temp', name: '色温调节', type: 'value', mode: 'rw' },
    { id: 103, code: 'work_mode', name: '场景模式', type: 'enum', mode: 'rw' },
    { id: 104, code: 'battery', name: '剩余电量', type: 'value', mode: 'ro' } // 只读，应该被过滤
];

// 优先用 Store 的真实数据
const sourceDps = computed(() => (store.dps && store.dps.length > 0) ? store.dps : fallbackDps);

// 合并逻辑：将“原始DP”和“已保存的配置”合并
const mergedActionList = ref<TimerActionDef[]>([]);

const initData = () => {
    // 过滤掉只读属性 (RO)，因为不能定时设置只读属性
    const writableDps = sourceDps.value.filter((dp: any) => dp.mode !== 'ro');

    mergedActionList.value = writableDps.map((dp: any) => {
        // 检查是否之前保存过
        const saved = props.modelValue.actions?.find(a => a.dpId === dp.id);
        return {
            dpId: dp.id,
            code: dp.code,
            name: dp.name,
            type: dp.type,
            // 如果保存过，使用保存的状态；否则默认不勾选
            selected: saved ? saved.selected : false,
            alias: saved?.alias || ''
        };
    });
};

const toggleDp = (dp: TimerActionDef) => {
    dp.selected = !dp.selected;
};

// 监听内部变动，实时向外 emit，实现双向绑定
watch(mergedActionList, (newVal) => {
    // 必须深拷贝，断开引用
    const actionsToSave = newVal.map(item => ({ ...item }));
    emit('update:modelValue', { ...props.modelValue, actions: actionsToSave });
}, { deep: true });

onMounted(initData);


// --- 2. 右侧逻辑：交互沙盒 ---

interface MockTask {
    id: number;
    time: string;
    targetDpCode: string;
    value: any;
}

const mockTimers = ref<MockTask[]>([
    { id: 1, time: '07:30', targetDpCode: 'switch_led', value: true }
]);

// 只有“被勾选”的 DP 才会出现在右侧下拉框里
const activeActions = computed(() => mergedActionList.value.filter(a => a.selected));

const getDpType = (code: string) => {
    const dp = mergedActionList.value.find(a => a.code === code);
    return dp ? dp.type : 'value';
};

const addMockTimer = () => {
    // 默认选中第一个可用的动作
    const defaultAction = activeActions.value[0];
    if (!defaultAction) return;

    mockTimers.value.push({
        id: Date.now(),
        time: '12:00',
        targetDpCode: defaultAction.code,
        value: 0
    });
};

const handleDpChange = (task: MockTask) => {
    // 切换动作时重置值
    task.value = 0;
};
</script>

<style scoped lang="scss">
/* 核心布局修复：
   使用 Flex + min-height: 0 组合拳，完美解决 overflow: auto 失效问题 
*/

.timer-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    font-family: 'Inter', sans-serif;
}

/* 顶部栏 */
.header-bar {
    flex-shrink: 0;
    /* 禁止压缩 */
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

/* 主体内容区：双栏布局 */
.content-body {
    flex: 1;
    /* 占据剩余高度 */
    display: flex;
    overflow: hidden;
    /* 关键：截断溢出，将滚动权交给子元素 */
    min-height: 0;
    /* 关键：FireFox/Chrome Flex 滚动修复 */
    transition: opacity 0.3s;

    &.is-disabled {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(1);
    }
}

/* 左栏与右栏通用 */
.panel-left,
.panel-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    min-width: 0;
    /* 防止内容撑开 flex item */
}

.panel-left {
    border-right: 1px solid #e4e7ed;
    background: #fcfcfc;
    max-width: 45%;
}

.panel-right {
    background: #fff;
}

/* 标题区 */
.section-header {
    flex-shrink: 0;
    margin-bottom: 16px;

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

/* 滚动列表容器 */
.scrollable {
    flex: 1;
    overflow-y: auto;
    /* 开启垂直滚动 */
    padding-right: 6px;

    /* 美化滚动条 */
    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: #e4e7ed;
        border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: #c0c4cc;
    }
}

/* 左侧配置项样式 */
.config-item {
    display: flex;
    align-items: flex-start;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    margin-bottom: 8px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
        border-color: #c0c4cc;
        transform: translateY(-1px);
    }

    &.selected {
        border-color: #d4af37;
        background: #fffdf5;
        box-shadow: 0 2px 8px rgba(212, 175, 55, 0.05);
    }
}

.item-info {
    flex: 1;
    margin: 0 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.item-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dp-name {
    font-size: 13px;
    font-weight: 500;
    color: #333;
}

.dp-tag {
    transform: scale(0.9);
    transform-origin: left center;
}

.alias-label {
    font-size: 12px;
    color: #909399;
}

.alias-input {
    width: 140px;
}

.item-type {
    font-size: 12px;
    color: #c0c4cc;
    font-family: monospace;
    padding-top: 2px;
}

.global-setting {
    flex-shrink: 0;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #606266;
}

/* 右侧沙盒样式 */
.timer-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.timer-card-mock {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    transition: all 0.2s;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: #dcdfe6;
    }
}

.card-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding-right: 16px;
    border-right: 1px solid #f2f3f5;
}

.repeat-text {
    font-size: 10px;
    color: #909399;
}

.card-mid {
    flex: 1;
    padding: 0 16px;
}

.action-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.label {
    font-size: 12px;
    color: #909399;
}

.value-input-area {
    width: 80px;
    display: flex;
    justify-content: flex-end;
}

.enum-mock {
    font-size: 12px;
    background: #f4f4f5;
    padding: 2px 6px;
    border-radius: 4px;
    color: #606266;
}

/* 覆盖 Element 样式 (黑金风格) */
:deep(.noir-switch.el-switch .el-switch__core) {
    border-color: #dcdfe6;
    background: #dcdfe6;
}

:deep(.noir-switch.el-switch.is-checked .el-switch__core) {
    border-color: #d4af37;
    background: #d4af37;
}

:deep(.noir-input-ghost .el-input__wrapper) {
    box-shadow: none;
    background: transparent;
    padding: 0 4px;
    border-bottom: 1px dashed #dcdfe6;
    border-radius: 0;
}

:deep(.noir-input-ghost .el-input__wrapper.is-focus) {
    box-shadow: none !important;
    border-bottom: 1px solid #d4af37;
}

:deep(.noir-time-picker-text .el-input__wrapper) {
    box-shadow: none;
    padding: 0;
    background: transparent;
}

:deep(.noir-time-picker-text .el-input__inner) {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    width: 60px;
    text-align: center;
    font-family: 'Inter', sans-serif;
}

:deep(.gold-btn-ghost) {
    color: #d4af37;
    border-color: #d4af37;
    background: transparent;

    &:hover {
        background: #d4af37;
        color: #fff;
    }

    &:disabled {
        border-color: #e4e7ed;
        color: #c0c4cc;
        background: transparent;
    }
}

.sandbox-footer {
    flex-shrink: 0;
    margin-top: 16px;
}

:deep(.noir-alert) {
    background: #f8f9fb;
    border: 1px solid #e4e7ed;
}
</style>