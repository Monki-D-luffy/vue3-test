<template>
    <div class="firmware-list-container">
        <el-table :data="firmwares" v-loading="isLoading" stripe style="width: 100%" height="calc(100vh - 280px)">
            <el-table-column prop="version" label="固件版本" width="180" />
            <el-table-column prop="productName" label="适用产品" width="180" />
            <el-table-column prop="uploadedAt" label="上传时间" width="200" />

            <el-table-column prop="releaseNotes" label="发布说明">
                <template #default="{ row }">
                    <pre class="release-notes">{{ row.releaseNotes }}</pre>
                </template>
            </el-table-column>
        </el-table>

        <AppPagination :total="pagination.total" :page="pagination._page" :limit="pagination._limit"
            @page-change="onPageChange" />
    </div>
</template>

<script setup lang="ts">
import { type PropType } from 'vue'
import type { Firmware } from '@/api/index'
import AppPagination from '@/components/AppPagination.vue'

// 定义 Props
defineProps({
    firmwares: {
        type: Array as PropType<Firmware[]>,
        required: true,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    pagination: {
        type: Object as PropType<{ _page: number; _limit: number; total: number }>,
        required: true
    }
})

// 定义 Emits
const emit = defineEmits(['page-change'])

// 当分页组件触发页码变更时，我们再向上emit一个 'page-change' 事件
const onPageChange = (newPage: number) => {
    emit('page-change', newPage)
}
</script>

<style scoped>
/* 使用 pre 标签来显示换行，但重置它的默认样式，使其看起来像普通文本 
*/
.release-notes {
    margin: 0;
    font-family: inherit;
    /* 继承表格字体 */
    white-space: pre-wrap;
    /* 保留换行和空格 */
    word-wrap: break-word;
    /* 正常换行 */
}

/* 确保分页组件在表格下方 */
.firmware-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>