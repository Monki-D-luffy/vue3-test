<template>
    <Transition name="slide-up">
        <div v-if="selectedCount > 0" class="floating-bar glass-effect">
            <span class="selection-count">已选择 {{ selectedCount }} 项</span>
            <div class="bar-actions">
                <el-button type="danger" text bg icon="Delete" @click="emits('batch-delete')">
                    批量删除
                </el-button>
                <el-button type="primary" text bg icon="RefreshRight" @click="emits('batch-restart')">
                    批量重启
                </el-button>
                <el-button type="success" text bg icon="VideoPlay" @click="emits('batch-enable')">
                    启用
                </el-button>
                <el-divider direction="vertical" />
                <el-button icon="Close" circle @click="emits('clear-selection')" />
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { Delete, RefreshRight, VideoPlay, Close } from '@element-plus/icons-vue'

defineProps<{
    selectedCount: number
}>()

const emits = defineEmits<{
    (e: 'batch-delete'): void
    (e: 'batch-restart'): void
    (e: 'batch-enable'): void
    (e: 'clear-selection'): void
}>()
</script>

<style scoped>
.floating-bar {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99;
    padding: 12px 24px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    gap: 24px;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translate(-50%, 100%);
    opacity: 0;
}

.selection-count {
    font-weight: 600;
    color: var(--text-primary, #303133);
}
</style>