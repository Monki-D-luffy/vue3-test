<template>
    <el-dialog v-model="dialogVisible" title="Gemini 智能诊断报告" width="600px" destroy-on-close class="ai-diagnosis-modal">
        <div class="modal-content">
            <div v-if="loading" class="flex-col flex-center py-8">
                <div class="typing-indicator mb-4">
                    <span></span><span></span><span></span>
                </div>
                <p class="text-secondary text-sm">Gemini 正在分析设备日志特征...</p>
            </div>

            <div v-else class="markdown-body" v-html="parsedResult"></div>
        </div>

        <template #footer>
            <div class="flex-between">
                <span class="text-xs text-secondary">由 Google Gemini 2.0 提供支持</span>
                <div>
                    <el-button @click="dialogVisible = false">关闭</el-button>
                    <el-button type="primary" @click="handleFix" :disabled="loading">
                        自动生成工单
                    </el-button>
                </div>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useGemini } from '@/composables/useGemini';
import { parseMarkdown } from '@/utils/markdown';

const props = defineProps<{
    modelValue: boolean;
    logContent: string;
}>();

const emit = defineEmits(['update:modelValue', 'fix']);

const { loading, result, askAI } = useGemini();
const parsedResult = computed(() => parseMarkdown(result.value));

// 双向绑定 Dialog 可见性
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// 监听打开动作，自动触发 AI
watch(() => props.modelValue, async (isOpen) => {
    if (isOpen && props.logContent) {
        await askAI(props.logContent, 'diagnosis');
    }
});

const handleFix = () => {
    emit('fix');
    dialogVisible.value = false;
};
</script>

<style scoped>
.text-secondary {
    color: var(--text-secondary);
}

/* 打字机动画的小点点 */
.typing-indicator span {
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: var(--primary-color);
    border-radius: 50%;
    margin: 0 2px;
    animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1);
    }
}

/* Markdown 样式微调 */
.markdown-body {
    background-color: var(--color-slate-50);
    padding: 16px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
    min-height: 100px;
}

:deep(h3) {
    color: var(--primary-color);
    font-weight: bold;
    margin-bottom: 8px;
}

:deep(ul) {
    list-style: disc;
    padding-left: 20px;
}

:deep(li) {
    margin-bottom: 4px;
}
</style>