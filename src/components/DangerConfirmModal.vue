<template>
    <el-dialog v-model="visible" width="420px" :show-close="false" :close-on-click-modal="!loading"
        :close-on-press-escape="!loading" class="danger-modal-wrapper" destroy-on-close align-center append-to-body>
        <div class="danger-content">
            <div class="icon-wrapper">
                <div class="danger-bg">
                    <el-icon class="danger-icon" :size="36">
                        <component :is="iconComponent" />
                    </el-icon>
                </div>
                <div class="pulse-ring"></div>
            </div>

            <h3 class="title">{{ title }}</h3>

            <div class="description" v-if="description || $slots.description">
                <slot name="description">{{ description }}</slot>
            </div>

            <div class="content-slot" v-if="$slots.default">
                <slot />
            </div>

            <div class="actions">
                <el-button class="cancel-btn" @click="handleClose" :disabled="loading">
                    {{ cancelText }}
                </el-button>
                <el-button type="danger" class="confirm-btn" :loading="loading" @click="handleConfirm">
                    {{ confirmText }}
                </el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { DeleteFilled } from '@element-plus/icons-vue'

// 定义 Props
const props = withDefaults(defineProps<{
    modelValue: boolean
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    loading?: boolean
    // 允许自定义图标，默认为垃圾桶
    iconComponent?: Component
}>(), {
    title: '确认删除?',
    confirmText: '确认删除',
    cancelText: '取消',
    loading: false,
    iconComponent: DeleteFilled as any
})

// 定义事件
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
    (e: 'close'): void
}>()

// v-model 双向绑定代理
const visible = computed({
    get: () => props.modelValue,
    set: (val) => {
        emit('update:modelValue', val)
        if (!val) emit('close')
    }
})

// 操作处理
const handleClose = () => {
    visible.value = false
}

const handleConfirm = () => {
    emit('confirm')
}
</script>

<style scoped>
/* 注意：由于 el-dialog 的结构特性，部分样式需要穿透 (:deep) 
  或者配合 append-to-body + 自定义 class 使用
*/

:deep(.danger-modal-wrapper) {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 0;
    background: transparent;
    /* 关键：让内容背景接管 */
}

:deep(.danger-modal-wrapper .el-dialog__header) {
    display: none;
}

:deep(.danger-modal-wrapper .el-dialog__body) {
    padding: 0;
    background: #fff;
}

.danger-content {
    padding: 40px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: #fff;
}

/* --- 图标动画区 (红色系) --- */
.icon-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.danger-bg {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #fee2e2;
    /* Red-100 */
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ef4444;
    /* Red-500 */
}

.pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid #fca5a5;
    /* Red-300 */
    animation: pulse-red 2s infinite;
    z-index: 1;
}

@keyframes pulse-red {
    0% {
        width: 100%;
        height: 100%;
        opacity: 1;
    }

    100% {
        width: 160%;
        height: 160%;
        opacity: 0;
    }
}

/* --- 文本样式 --- */
.title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px 0;
}

.description {
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 24px 0;
    max-width: 320px;
}

/* 插槽容器，如果有内容则增加底部间距 */
.content-slot {
    width: 100%;
    margin-bottom: 32px;
}

.content-slot:empty {
    margin-bottom: 0;
    display: none;
}

/* --- 按钮区 --- */
.actions {
    width: 100%;
    display: flex;
    gap: 12px;
}

.cancel-btn {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    color: #64748b;
    background: transparent;
    font-weight: 500;
}

.cancel-btn:hover {
    background: #f1f5f9;
    color: #334155;
    border-color: #cbd5e1;
}

.confirm-btn {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    background: #ef4444;
    border-color: #ef4444;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
}

.confirm-btn:hover {
    background: #dc2626;
    border-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.confirm-btn:active {
    transform: translateY(0);
}
</style>