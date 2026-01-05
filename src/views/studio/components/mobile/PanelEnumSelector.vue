<template>
    <div class="enum-selector-wrapper">
        <div class="label" v-if="config.name">{{ config.name }}</div>

        <div v-if="config.style.layout === 'segmented'" class="style-segmented">
            <div v-for="opt in displayOptions" :key="opt.value" class="segment-item"
                :class="{ 'is-active': modelValue === opt.value }" @click.stop="selectOption(opt.value)"
                :style="modelValue === opt.value ? { background: config.style.activeColor || '#1a1a1a', color: '#fff' } : {}">
                {{ opt.label }}
            </div>
        </div>

        <div v-else class="style-grid">
            <div v-for="opt in displayOptions" :key="opt.value" class="grid-item"
                :class="{ 'is-active': modelValue === opt.value }" @click.stop="selectOption(opt.value)"
                :style="modelValue === opt.value ? { borderColor: config.style.activeColor || '#1a1a1a', color: config.style.activeColor || '#1a1a1a' } : {}">
                <div class="icon-box"
                    :style="{ background: modelValue === opt.value ? (config.style.activeColor || '#1a1a1a') : '#f3f4f6' }">
                    <el-icon :style="{ color: modelValue === opt.value ? '#fff' : '#94a3b8' }">
                        <component :is="getIcon(opt.value)" />
                    </el-icon>
                </div>
                <span class="grid-label">{{ opt.label }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStudioStore } from '@/stores/studioStore';
import { Sunny, Moon, Lightning, Refresh } from '@element-plus/icons-vue'; // 示例图标

const props = defineProps<{ config: any; modelValue?: string }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

// 核心逻辑：如果没有自定义 options，就尝试从 DP 定义中自动生成
const displayOptions = computed(() => {
    const customOpts = props.config.style.options;

    // 如果绑定了 DP，尝试读取 DP 的枚举范围
    const dpId = props.config.binding?.dpId;
    if (dpId) {
        const dp = store.dps.find(d => d.id === dpId);
        if (dp && dp.type === 'Enum' && dp.property.range) {
            // 将 DP 的 range (e.g. ['auto', 'sleep']) 映射为选项
            // 如果 config 里有配置 label，优先用 config 的，否则用 raw value
            return dp.property.range.map(val => {
                const exist = customOpts?.find((o: any) => o.value === val);
                return exist || { label: val, value: val };
            });
        }
    }

    // 否则返回默认演示数据
    return customOpts || [];
});

const selectOption = (val: string) => {
    emit('update:modelValue', val);
};

// 简单的图标映射逻辑 (Mock)
const getIcon = (val: string) => {
    if (val.includes('sleep') || val.includes('night')) return Moon;
    if (val.includes('strong') || val.includes('turbo')) return Lightning;
    if (val.includes('auto')) return Refresh;
    return Sunny;
};
</script>

<style scoped>
.enum-selector-wrapper {
    padding: 12px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.label {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 12px;
    margin-left: 4px;
}

/* 风格 A: 分段控制器 */
.style-segmented {
    display: flex;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 8px;
}

.segment-item {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    font-size: 13px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #64748b;
}

.segment-item.is-active {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    font-weight: 500;
}

/* 风格 B: 图标网格 */
.style-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.grid-item:active {
    transform: scale(0.95);
}

.icon-box {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 8px;
    transition: background 0.3s;
}

.grid-label {
    font-size: 12px;
    color: inherit;
}
</style>