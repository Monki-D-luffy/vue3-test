<template>
    <div class="panel-content">
        <el-empty description="固件版本库开发中..." />
        <p align="center">当前选中产品: {{ product?.name }} ({{ product?.id }})</p>
    </div>
</template>

<script setup lang="ts">
import type { Product } from '@/api'

defineProps<{
    product: Product
}>()
</script>

<style scoped>
.panel-content {
    padding: 20px;
}
</style>