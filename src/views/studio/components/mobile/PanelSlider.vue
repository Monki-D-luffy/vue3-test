<template>
    <div class="ios-slider-card">
        <div class="header">
            <span class="label">{{ config.name || '数值' }}</span>
            <span class="value">{{ modelValue || 0 }}</span>
        </div>
        <div class="slider-track-container">
            <input type="range" :min="config.binding?.dpId ? getDpRange.min : 0"
                :max="config.binding?.dpId ? getDpRange.max : 100" :value="modelValue || 0" @input="onInput"
                class="ios-range" :style="{ '--active-color': config.style.activeColor || '#1a1a1a' }" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudioStore } from '@/stores/studioStore';

const props = defineProps<{
    config: any;
    modelValue?: number;
}>();

const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

// 智能获取 DP 定义的范围
const getDpRange = computed(() => {
    const dpId = props.config.binding?.dpId;
    if (!dpId) return { min: 0, max: 100 };
    const dp = store.dps.find(d => d.id === dpId);
    return dp?.property || { min: 0, max: 100 };
});

const onInput = (e: Event) => {
    const val = Number((e.target as HTMLInputElement).value);
    emit('update:modelValue', val);
};
</script>

<style scoped>
/* 引用之前的 CSS */
.ios-slider-card {
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
}

.label {
    font-size: 14px;
    font-weight: 500;
}

.value {
    font-size: 14px;
    color: #8e8e93;
    font-family: monospace;
}

.ios-range {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    background: #e9e9ea;
    border-radius: 3px;
    outline: none;
}

.ios-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    margin-top: -11px;
    position: relative;
    z-index: 2;
}

.ios-range::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: linear-gradient(to right, var(--active-color) 0%, var(--active-color) 50%, #e9e9ea 50%, #e9e9ea 100%);
    border-radius: 3px;
}
</style>