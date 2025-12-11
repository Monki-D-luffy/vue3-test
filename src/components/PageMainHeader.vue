<template>
    <div class="page-main-header">
        <div class="header-content">
            <h1 class="title">
                {{ title }}
                <el-tag v-if="tag" size="small" effect="plain" class="title-tag">
                    {{ tag }}
                </el-tag>
            </h1>
            <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>

        <div class="header-actions" v-if="$slots.actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
    subtitle?: string
    tag?: string // 可选：标题旁的标签（如版本号、状态）
}>()
</script>

<style scoped>
.page-main-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid transparent;
    /* 预留边框位置，未来可配置 */
    transition: all 0.3s ease;
}

.header-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.title {
    font-size: 24px;
    /* 稍微调整以适应现代风格 */
    font-weight: 700;
    color: var(--app-text-main);
    margin: 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 12px;
}

.title-tag {
    font-weight: normal;
    border-color: var(--el-border-color);
    color: var(--app-text-sub);
}

.subtitle {
    font-size: 14px;
    color: var(--app-text-sub);
    margin: 0;
    line-height: 1.5;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* 移动端适配：操作区换行 */
@media (max-width: 768px) {
    .page-main-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .header-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>