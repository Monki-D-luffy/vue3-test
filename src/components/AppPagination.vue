<template>
    <div class="app-pagination">
        <el-pagination v-bind="$attrs" :current-page="currentPage" :page-size="pageSize" :total="total"
            :page-sizes="[10, 20, 50, 100]" :layout="layout" background @update:current-page="handleCurrentChange"
            @update:page-size="handleSizeChange" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    total: {
        type: Number,
        required: true
    },
    currentPage: {
        type: Number,
        default: 1
    },
    pageSize: {
        type: Number,
        default: 20
    },
    layout: {
        type: String,
        default: 'total, sizes, prev, pager, next, jumper'
    }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'size-change', 'current-change'])

// 代理事件，确保双向绑定生效
const handleSizeChange = (val: number) => {
    emit('update:pageSize', val)
    emit('size-change', val)
}

const handleCurrentChange = (val: number) => {
    emit('update:currentPage', val)
    emit('current-change', val)
}
</script>

<style scoped>
.app-pagination {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
    width: 100%;
}
</style>