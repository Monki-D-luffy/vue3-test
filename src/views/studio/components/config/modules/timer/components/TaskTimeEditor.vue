<template>
    <div class="task-time-editor">
        <div class="inline-settings">
            <div class="setting-item time-item">
                <span class="sub-label">执行时间 (Time)</span>
                <el-time-picker :model-value="timeDate" @update:model-value="handleTimeChange" format="HH:mm"
                    placeholder="选择时间" :clearable="false" class="noir-time-picker-inline" :prefix-icon="Clock" />
            </div>

            <div class="setting-item repeat-item">
                <span class="sub-label">重复规则 (Repeat)</span>
                <el-select v-model="target.repeat" class="noir-select-inline" size="default">
                    <el-option label="仅一次 (Once)" value="once" />
                    <el-option label="每天 (Daily)" value="daily" />
                    <el-option label="工作日 (Mon-Fri)" value="workday" />
                    <el-option label="周末 (Sat-Sun)" value="weekend" />
                    <el-option label="自定义 (Custom)" value="custom" />
                </el-select>
            </div>
        </div>

        <transition name="el-zoom-in-top">
            <div v-if="target.repeat === 'custom'" class="week-selector-area">
                <div v-for="(day, index) in weekDays" :key="index" class="week-dot"
                    :class="{ active: target.weeks.includes(day.val) }" @click="toggleWeek(day.val)">
                    {{ day.label }}
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { TimeTarget } from '@/types/timer';

// 接收整个 target 对象，利用对象的引用特性直接修改，或通过 v-model 更新
const props = defineProps<{
    modelValue: TimeTarget
}>();

const emit = defineEmits(['update:modelValue']);

// 使用计算属性代理，方便 v-model 绑定
const target = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const weekDays = [
    { label: '日', val: 0 },
    { label: '一', val: 1 },
    { label: '二', val: 2 },
    { label: '三', val: 3 },
    { label: '四', val: 4 },
    { label: '五', val: 5 },
    { label: '六', val: 6 },
];

// --- 逻辑封装：Dayjs 转换 ---
const timeDate = computed(() => {
    return dayjs().hour(target.value.hour).minute(target.value.minute).toDate();
});

const handleTimeChange = (val: any) => {
    if (!val) return;
    const d = dayjs(val);
    // 直接修改对象属性
    target.value.hour = d.hour();
    target.value.minute = d.minute();
};

// --- 逻辑封装：周切换 ---
const toggleWeek = (dayVal: number) => {
    const idx = target.value.weeks.indexOf(dayVal);
    if (idx > -1) {
        target.value.weeks.splice(idx, 1);
    } else {
        target.value.weeks.push(dayVal);
    }
};
</script>

<style scoped lang="scss">
.task-time-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.inline-settings {
    display: flex;
    gap: 16px;
}

.setting-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.sub-label {
    font-size: 12px;
    color: #909399;
    font-weight: 500;
}

.week-selector-area {
    display: flex;
    justify-content: space-between;
    background: #f8f9fa;
    padding: 8px 12px;
    border-radius: 8px;
    margin-top: 4px;
}

.week-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #909399;
    border: 1px solid #e4e7ed;
    cursor: pointer;
    transition: all 0.2s;
    background: #fff;

    &:hover {
        border-color: #d4af37;
        color: #d4af37;
    }

    &.active {
        background: #d4af37;
        border-color: #d4af37;
        color: #fff;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(212, 175, 55, 0.3);
    }
}

/* 复用黑金样式 */
:deep(.noir-time-picker-inline) {
    width: 100%;

    .el-input__wrapper {
        box-shadow: 0 0 0 1px #dcdfe6 inset !important;
        border-radius: 6px;
        background: #fcfcfc;
    }

    .el-input__wrapper.is-focus {
        box-shadow: 0 0 0 1px #d4af37 inset !important;
    }
}

:deep(.noir-select-inline) {
    width: 100%;

    .el-input__wrapper {
        box-shadow: 0 0 0 1px #dcdfe6 inset !important;
        border-radius: 6px;
        background: #fcfcfc;
    }

    .el-input__wrapper.is-focus {
        box-shadow: 0 0 0 1px #d4af37 inset !important;
    }
}
</style>