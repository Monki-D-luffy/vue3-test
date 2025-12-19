<script setup lang="ts">
interface Props {
    title?: string
    icon?: any
    padding?: string
    noHeader?: boolean
    // 是否禁用悬浮动效 (开启后卡片完全静止)
    noHover?: boolean
}

withDefaults(defineProps<Props>(), {
    padding: '16px',
    noHeader: false,
    noHover: false
})
</script>

<template>
    <div class="exp-card" :class="{ 'is-static': noHover }">
        <div v-if="!noHeader && (title || icon || $slots.header)" class="exp-card-header">
            <div class="header-left">
                <el-icon v-if="icon" class="header-icon">
                    <component :is="icon" />
                </el-icon>
                <span v-if="title" class="header-title">{{ title }}</span>
            </div>
            <div class="header-right">
                <slot name="header-action"></slot>
                <slot name="extra"></slot>
            </div>
        </div>

        <div class="exp-card-body" :style="{ padding: padding }">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.exp-card {
    background: var(--app-bg-card);
    border: var(--app-glass-border);
    border-radius: 16px;
    /* 默认阴影 */
    box-shadow: var(--app-shadow-md);

    /* 默认过渡 */
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* 顶部高光条 */
.exp-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 100%);
    opacity: 0.6;
    pointer-events: none;
}

/* --- 动态模式 (默认) --- */
/* 只有当没有 is-static 类时，才应用 hover 效果 */
.exp-card:not(.is-static):hover {
    transform: translateY(-4px);
    box-shadow: var(--app-shadow-lg);
    border-color: rgba(255, 255, 255, 1);
}

/* --- 静态模式 (no-hover) --- */
/* 强制覆盖所有可能的 hover 变化 */
.exp-card.is-static {
    transform: none !important;
    box-shadow: var(--app-shadow-md) !important;
    border: var(--app-glass-border) !important;
    cursor: default;
}

.exp-card-header {
    height: 36px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--app-text-sub);
}

.header-icon {
    font-size: 16px;
    color: var(--app-text-sub);
    opacity: 0.8;
}

.header-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--app-text-main);
}

.exp-card-body {
    flex: 1;
    color: var(--app-text-main);
    font-size: 13px;
    /* 确保 body 也是 flex 容器，适应高度填充 */
    display: flex;
    flex-direction: column;
    min-height: 0;
}
</style>