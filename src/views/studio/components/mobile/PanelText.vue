<template>
    <div class="ios-text-wrapper" :style="{
        justifyContent: mapAlign(config.style.align),
        background: config.style.background || 'transparent'
    }">
        <span class="text-content" :style="{
            color: config.style.color || '#1a1a1a',
            fontSize: (config.style.fontSize || 16) + 'px',
            fontWeight: config.style.fontWeight || 400
        }">
            {{ hasBinding ? formatValue(modelValue) : (config.style.text || '文本内容') }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ config: any; modelValue?: any }>();

const hasBinding = computed(() => !!props.config.binding?.dpId);

const mapAlign = (align: string) => {
    if (align === 'center') return 'center';
    if (align === 'right') return 'flex-end';
    return 'flex-start';
};

const formatValue = (val: any) => {
    if (val === undefined || val === null) return '--';
    // 如果是布尔值，转换显示
    if (typeof val === 'boolean') return val ? 'ON' : 'OFF';
    return val;
};
</script>

<style scoped>
.ios-text-wrapper {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    min-height: 44px;
    width: 100%;
}

.text-content {
    line-height: 1.4;
    word-break: break-all;
}
</style>