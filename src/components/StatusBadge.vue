<template>
    <span class="status-badge" :class="themeClass">
        <span v-if="dot" class="dot"></span>
        <slot>{{ label }}</slot>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
    // 状态类型：映射到不同的颜色
    type?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'default'
    // 文本内容（也可通过 slot 传入）
    label?: string
    // 是否显示圆点
    dot?: boolean
}>(), {
    type: 'default',
    dot: true
})

// 生成对应的 CSS 类名
const themeClass = computed(() => `is-${props.type}`)
</script>

<style scoped>
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    /*稍微加宽一点padding，增加呼吸感*/
    border-radius: 99px;
    font-size: 12px;
    font-weight: 600;
    /* 加粗字体提升质感 */
    line-height: 1;
    transition: all 0.2s;
    white-space: nowrap;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    flex-shrink: 0;
}

/* === 主题系统 (基于 Element Plus 语义色调，但更柔和) === */

/* Default / Offline */
.is-default,
.is-info {
    background-color: #f1f5f9;
    color: #64748b;
}

.is-default .dot,
.is-info .dot {
    background-color: #94a3b8;
}

/* Success / Online */
.is-success {
    background-color: #ecfdf5;
    color: #059669;
}

.is-success .dot {
    background-color: #10b981;
}

/* Warning / Alert */
.is-warning {
    background-color: #fffbeb;
    color: #d97706;
}

.is-warning .dot {
    background-color: #f59e0b;
}

/* Danger / Error */
.is-danger {
    background-color: #fef2f2;
    color: #dc2626;
}

.is-danger .dot {
    background-color: #ef4444;
}

/* Primary / Processing */
.is-primary {
    background-color: #eff6ff;
    color: #2563eb;
}

.is-primary .dot {
    background-color: #3b82f6;
}
</style>