<template>
    <div class="timer-module-root noir-skin">
        <div class="module-header-bar">
            <div class="header-status">
                <span class="module-name">云端定时服务 (Cloud Timer)</span>
                <span class="status-dot" :class="{ active: modelValue.enabled }"></span>
                <span class="status-text">{{ modelValue.enabled ? 'Running' : 'Disabled' }}</span>
            </div>

            <div class="ios-toggle" :class="{ checked: modelValue.enabled }" @click="toggleModule">
                <div class="toggle-circle"></div>
            </div>
        </div>

        <div class="module-content" :class="{ 'is-disabled-visual': !modelValue.enabled }">
            <TimerStrategy v-model="mergedActionList" :all-source-dps="allAvailableDps" :active-id="currentSelectedDpId"
                class="left-pane" @select="handleDpSelect" />

            <TimerSandbox :available-dps="mergedActionList" :filter-dp-id="currentSelectedDpId" class="right-pane" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import type { TimerConfig, TimerActionDef } from '@/types/timer';
import { useStudioStore } from '@/stores/studioStore';
import TimerStrategy from './TimerStrategy.vue';
import TimerSandbox from './TimerSandbox.vue';

const props = withDefaults(defineProps<{
    modelValue: TimerConfig
}>(), {
    modelValue: () => ({ enabled: false, actions: [] })
}); const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

const mergedActionList = ref<TimerActionDef[]>([]);
const currentSelectedDpId = ref<number | null>(null);

// 模拟数据兜底
const mockStandardDps = [
    { id: 101, code: 'switch_led', name: '主灯开关', type: 'bool', mode: 'rw' },
    { id: 102, code: 'work_mode', name: '工作模式', type: 'enum', mode: 'rw' },
    { id: 103, code: 'bright_value', name: '亮度设置', type: 'value', mode: 'rw' },
    { id: 104, code: 'temp_set', name: '目标温度', type: 'value', mode: 'rw' },
    { id: 105, code: 'fan_speed', name: '风扇档位', type: 'enum', mode: 'rw' }
];

const allAvailableDps = computed(() => {
    if (store.dps && store.dps.length > 0) return store.dps;
    return mockStandardDps;
});

const toggleModule = () => {
    const newVal = !props.modelValue.enabled;
    emit('update:modelValue', { ...props.modelValue, enabled: newVal });
};

const initData = () => {
    if (props.modelValue.actions) {
        mergedActionList.value = props.modelValue?.actions?.map(a => ({ ...a })) ?? [];
        // 默认选中第一个功能，提升体验
        if (mergedActionList.value.length > 0) {
            // 使用可选链与空合并以防 dpId 为 undefined
            currentSelectedDpId.value = mergedActionList.value[0]?.dpId ?? null;
        }
    }
};

const handleDpSelect = (dpId: number) => {
    currentSelectedDpId.value = dpId;
};

watch(mergedActionList, (newVal) => {
    const list = newVal || [];
    const actionsToSave = list.map(item => ({ ...item }));
    emit('update:modelValue', { ...props.modelValue, actions: actionsToSave });

    // 如果当前选中的被删除了，重置选中状态
    if (currentSelectedDpId.value && !list.find(d => d.dpId === currentSelectedDpId.value)) {
        // 保护性读取首项 dpId，若为 undefined 则使用 null
        currentSelectedDpId.value = list.length > 0 ? (list[0]?.dpId ?? null) : null;
    }
}, { deep: true });

onMounted(initData);
</script>

<style scoped lang="scss">
.timer-module-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    /* 确保容器占满父级 */
    position: relative;
}

.module-header-bar {
    padding: 12px 24px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    background: #fff;
}

.module-name {
    font-size: 16px;
    font-weight: 700;
    margin-right: 12px;
    color: #1a1a1a;
}

.header-status {
    display: flex;
    align-items: center;
    gap: 6px;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #dcdfe6;
    transition: background 0.3s;

    &.active {
        background: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }
}

.status-text {
    font-size: 12px;
    color: #909399;
    font-weight: 500;
    font-family: monospace;
}

/* iOS 风格开关 */
.ios-toggle {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    background: #e4e7ed;
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

    &.checked {
        background: #d4af37;

        .toggle-circle {
            transform: translateX(20px);
            background: #fff;
            border-color: #fff;
        }
    }
}

.toggle-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    position: absolute;
    top: 2px;
    left: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.module-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    transition: opacity 0.3s;

    &.is-disabled-visual {
        opacity: 0.7;
        /* 关键修改：不再完全禁用点击，而是通过视觉置灰 */
        /* pointer-events: none; */
    }
}

.left-pane {
    width: 35%;
    min-width: 280px;
    max-width: 400px;
    border-right: 1px solid #e4e7ed;
}

.right-pane {
    flex: 1;
    min-width: 0;
    /* Flex 溢出保护 */
}
</style>