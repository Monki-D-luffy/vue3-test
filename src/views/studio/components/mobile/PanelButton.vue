<template>
    <button class="ios-btn" :style="{
        background: config.style.background || '#1a1a1a',
        color: config.style.color || '#fff',
        borderRadius: (config.style.radius || 8) + 'px'
    }">
        {{ config.style.text || 'Button' }}
    </button>
</template>

<script setup lang="ts">
defineProps<{ config: any }>();
</script>

<style scoped>
.ios-btn {
    width: 100%;
    padding: 14px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}

.ios-btn:active {
    opacity: 0.8;
}
</style>