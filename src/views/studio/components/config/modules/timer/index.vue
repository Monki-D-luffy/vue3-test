<template>
    <div class="timer-module-root noir-skin">
        <div class="module-header-bar">
            <div class="header-status">
                <span class="module-name">云端定时服务</span>
                <span class="status-dot" :class="{ active: modelValue.enabled }"></span>
                <span class="status-text">{{ modelValue.enabled ? 'Running' : 'Disabled' }}</span>
            </div>

            <div class="ios-toggle" :class="{ checked: modelValue.enabled }" @click="toggleModule">
                <div class="toggle-circle"></div>
            </div>
        </div>

        <div class="module-content" :class="{ disabled: !modelValue.enabled }">
            <TimerStrategy v-model="mergedActionList" :all-source-dps="allAvailableDps" class="left-pane" />

            <TimerSandbox :available-dps="mergedActionList" class="right-pane" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import type { TimerConfig, TimerActionDef } from '@/types/timer';
import { useStudioStore } from '@/stores/studioStore';
import TimerStrategy from './TimerStrategy.vue';
import TimerSandbox from './TimerSandbox.vue';

const props = defineProps<{ modelValue: TimerConfig }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

const mergedActionList = ref<TimerActionDef[]>([]);

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
        mergedActionList.value = props.modelValue.actions.map(a => ({ ...a }));
    }
};

watch(mergedActionList, (newVal) => {
    const actionsToSave = newVal.map(item => ({ ...item }));
    emit('update:modelValue', { ...props.modelValue, actions: actionsToSave });
}, { deep: true });

onMounted(initData);
</script>

<style scoped lang="scss">
/* 样式复用上文，无需变动 */
.timer-module-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
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

    &.disabled {
        opacity: 0.6;
        pointer-events: none;
        filter: grayscale(1);
    }
}

.left-pane {
    width: 40%;
    min-width: 300px;
}

.right-pane {
    flex: 1;
    min-width: 360px;
}
</style>