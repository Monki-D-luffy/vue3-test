<template>
    <div class="pagination-block" v-if="props.total > 0">
        <el-pagination :total="props.total" :current-page="currentPage" :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            @size-change="emit('size-change', $event)" @current-change="emit('current-change', $event)"
            @update:current-page="emit('update:currentPage', $event)"
            @update:page-size="emit('update:pageSize', $event)" />
    </div>
</template>

<script setup>
import { defineProps, defineEmits, defineModel } from 'vue'

// --- 核心逻辑 ---

// 1. 接收父组件的 v-model 绑定
// (你的 vue 版本 ^3.5.22 支持 defineModel)
const currentPage = defineModel('currentPage')
const pageSize = defineModel('pageSize')

// 2. 接收父组件传入的 'total' 总数
const props = defineProps({
    total: {
        type: Number,
        default: 0
    }
})

// 3. 声明(转发)父组件需要监听的事件
// 我们需要转发 el-pagination 所有的事件，
// 这样父组件才能像直接使用 el-pagination 一样
const emit = defineEmits([
    'size-change',      // 触发 handleSizeChange
    'current-change',   // 触发 handleCurrentChange
    'update:currentPage', // 驱动 v-model:current-page
    'update:pageSize'     // 驱动 v-model:page-size
])

</script>

<style scoped>
/* 我们把 DeviceDashboard.vue 里的所有分页样式
  "剪切" 到这里
*/
.pagination-block {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: center;
}

/* 因为样式是 scoped 的，
  所以 :deep() 在这里是必须的，
  和之前一样
*/
.pagination-block :deep(.el-pagination) {
    --el-font-size-base: 16px;
}

.pagination-block :deep(.el-pager li) {
    min-width: 36px;
    height: 36px;
    line-height: 36px;
    border-radius: 6px;
}

.pagination-block :deep(.el-pager li:not(.is-active):hover) {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9) !important;
}

.pagination-block :deep(.el-pagination button) {
    min-width: 36px;
    height: 36px;
    border-radius: 6px;
}

.pagination-block :deep(.el-pagination__jump .el-input__wrapper) {
    border-radius: 6px;
}
</style>