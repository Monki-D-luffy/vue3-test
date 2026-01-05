<template>
    <div class="ios-switch-wrapper">
        <div class="label">{{ config.name || '开关' }}</div>
        <div class="ios-switch" :class="{ 'is-active': modelValue }"
            :style="{ background: modelValue ? (config.style.activeColor || '#1a1a1a') : '#e9e9ea' }"
            @click.stop="toggle">
            <div class="handle"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
// ✅ 升级：接收 modelValue 实现双向绑定
const props = defineProps<{
    config: any;
    modelValue?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const toggle = () => {
    // 触发外部状态更新
    emit('update:modelValue', !props.modelValue);
};
</script>

<style scoped>
/* 样式保持不变 (引用之前的 CSS) */
.ios-switch-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.label {
    font-size: 16px;
    font-weight: 500;
    color: #1a1a1a;
}

.ios-switch {
    width: 51px;
    height: 31px;
    border-radius: 31px;
    position: relative;
    transition: background 0.3s;
    cursor: pointer;
}

.handle {
    width: 27px;
    height: 27px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.is-active .handle {
    transform: translateX(20px);
}
</style>