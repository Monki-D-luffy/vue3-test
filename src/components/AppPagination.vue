<!-- 分页功能 -->
<template>
    <div class="fixed bottom-8 right-8 z-[2000] flex flex-col items-end gap-4 pointer-events-none">
        <div v-show="isOpen" class="pointer-events-auto transition-all duration-300 origin-bottom-right"
            :class="isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'">
            <div class="w-[380px] h-[600px] rounded-2xl shadow-2xl overflow-hidden border border-gray-100/50">
                <AiChatPanel />
            </div>
        </div>

        <button @click="toggleOpen"
            class="pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-300/50 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
            :class="{ 'rotate-90 bg-gray-600 hover:bg-gray-700': isOpen }">

            <div class="relative w-6 h-6">
                <el-icon class="absolute inset-0 transition-all duration-300"
                    :class="isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'">
                    <ChatDotRound />
                </el-icon>
                <el-icon class="absolute inset-0 transition-all duration-300"
                    :class="isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'">
                    <Close />
                </el-icon>
            </div>

            <span v-if="status !== 'idle' && !isOpen" class="absolute -top-1 -right-1 flex h-4 w-4">
                <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChatDotRound, Close } from '@element-plus/icons-vue';
// 🟢 引入新组件和 Agent Hook
import { AiChatPanel, useAgent } from '@/ai';

const isOpen = ref(false);
const { status } = useAgent(); // 获取全局 Agent 状态

const toggleOpen = () => {
    isOpen.value = !isOpen.value;
};
</script>

<style scoped>
/* 我们把 DeviceDashboard.vue 里的所有分页样式
  "剪切" 到这里
*/
.pagination-block {
    margin-top: 24px;
    padding-top: 20px;
    padding-bottom: 20px;
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