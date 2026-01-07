<template>
    <el-dialog v-model="visible" title="设置定时 (Set Timer)" width="360px" :show-close="false" append-to-body
        class="noir-dialog">
        <div class="picker-body">
            <div class="time-wheel-area">
                <el-time-picker v-model="internalTime" format="HH:mm" value-format="HH:mm" :clearable="false"
                    class="huge-time-picker" :teleported="false" />
            </div>

            <div class="repeat-section">
                <span class="section-label">重复:</span>
                <div class="tags-group">
                    <span v-for="type in repeatOptions" :key="type.value" class="repeat-tag"
                        :class="{ active: currentRepeat === type.value }" @click="currentRepeat = type.value as any">
                        {{ type.label }}
                    </span>
                </div>
            </div>

            <div v-if="currentRepeat === 'custom'" class="week-selector">
                <div v-for="(day, index) in weekDays" :key="index" class="week-ball"
                    :class="{ active: selectedWeeks.includes(day.val) }" @click="toggleWeek(day.val)">
                    {{ day.label }}
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" class="gold-btn-solid" @click="confirm">确定</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { TimeTarget, RepeatType } from '@/types/timer';

const props = defineProps<{
    modelValue: boolean;
    initialData?: TimeTarget;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const internalTime = ref('08:00');
const currentRepeat = ref<RepeatType>('once');
const selectedWeeks = ref<number[]>([]);

const repeatOptions = [
    { label: '仅一次', value: 'once' },
    { label: '每天', value: 'daily' },
    { label: '工作日', value: 'workday' },
    { label: '周末', value: 'weekend' },
    { label: '自定义', value: 'custom' }
];

const weekDays = [
    { label: '一', val: 1 }, { label: '二', val: 2 }, { label: '三', val: 3 },
    { label: '四', val: 4 }, { label: '五', val: 5 }, { label: '六', val: 6 },
    { label: '日', val: 0 }
];

// 初始化
watch(() => props.modelValue, (val) => {
    if (val && props.initialData) {
        // 解析传入的时间
        internalTime.value = `${String(props.initialData.hour).padStart(2, '0')}:${String(props.initialData.minute).padStart(2, '0')}`;
        currentRepeat.value = props.initialData.repeat;
        selectedWeeks.value = [...props.initialData.weeks];
    }
});

const toggleWeek = (val: number) => {
    const idx = selectedWeeks.value.indexOf(val);
    if (idx > -1) selectedWeeks.value.splice(idx, 1);
    else selectedWeeks.value.push(val);
};

const confirm = () => {
    const [h, m] = internalTime.value.split(':').map(Number);

    // 生成逻辑上的 weeks
    let finalWeeks: number[] = [];
    if (currentRepeat.value === 'daily') finalWeeks = [1, 2, 3, 4, 5, 6, 0];
    else if (currentRepeat.value === 'workday') finalWeeks = [1, 2, 3, 4, 5];
    else if (currentRepeat.value === 'weekend') finalWeeks = [6, 0];
    else if (currentRepeat.value === 'custom') finalWeeks = selectedWeeks.value;
    else finalWeeks = []; // once

    emit('confirm', {
        hour: h,
        minute: m,
        repeat: currentRepeat.value,
        weeks: finalWeeks
    } as TimeTarget);
    visible.value = false;
};
</script>

<style scoped lang="scss">
.picker-body {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
}

/* 巨型时间选择器 Hack */
:deep(.huge-time-picker .el-input__inner) {
    font-size: 32px;
    font-weight: 300;
    text-align: center;
    height: 60px;
    border: none;
    color: #1a1a1a;
    box-shadow: none !important;
}

:deep(.huge-time-picker .el-input__wrapper) {
    box-shadow: none !important;
    background: transparent;
}

.repeat-section {
    width: 100%;
}

.section-label {
    font-size: 12px;
    color: #909399;
    display: block;
    margin-bottom: 8px;
}

.tags-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
}

.repeat-tag {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 12px;
    background: #f4f4f5;
    color: #606266;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;

    &.active {
        background: #1a1a1a;
        color: #d4af37;
        font-weight: 600;
    }
}

.week-selector {
    display: flex;
    gap: 8px;
    margin-top: 4px;
}

.week-ball {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    background: #fff;
    border: 1px solid #dcdfe6;
    color: #606266;
    cursor: pointer;

    &.active {
        border-color: #d4af37;
        background: #fffcf5;
        color: #d4af37;
        font-weight: 700;
    }
}

.gold-btn-solid {
    background: #1a1a1a !important;
    border-color: #1a1a1a !important;
    color: #d4af37 !important;
}
</style>