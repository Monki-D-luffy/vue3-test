<template>
    <div class="config-form">
        <div class="config-group highlight">
            <div class="group-header">
                <span class="icon-dot blue"></span>
                <span class="label">功能点绑定 (Data Binding)</span>
            </div>
            <template v-if="modelValue.type === 'EnumSelector'">
                <el-form-item label="展示风格">
                    <el-radio-group v-model="modelValue.style.layout" size="small">
                        <el-radio-button label="segmented">分段式</el-radio-button>
                        <el-radio-button label="grid">图标网格</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="高亮颜色">
                    <el-color-picker v-model="modelValue.style.activeColor" />
                </el-form-item>

                <el-form-item label="选项映射 (Label)" v-if="modelValue.binding?.dpId">
                    <div class="option-mapper">
                        <div v-for="(opt, idx) in modelValue.style.options" :key="idx" class="mapper-row">
                            <span class="mapper-val">{{ opt.value }}</span>
                            <el-icon>
                                <ArrowRight />
                            </el-icon>
                            <el-input v-model="opt.label" size="small" style="width: 80px" />
                        </div>
                        <div v-if="!modelValue.style.options || modelValue.style.options.length === 0"
                            class="text-xs text-gray-400">
                            自动读取 DP 定义...
                        </div>
                    </div>
                </el-form-item>
            </template>
            <el-form-item v-if="modelValue.binding"> <el-select v-model="modelValue.binding.dpId" placeholder="请选择关联功能"
                    class="tech-select w-full" clearable value-key="id">
                    <template #empty>
                        <div class="custom-empty">
                            <el-icon class="empty-icon">
                                <Warning />
                            </el-icon>
                            <p>无匹配功能点</p>
                            <span class="sub-text">当前组件仅支持 {{ requiredType }} 类型</span>
                        </div>
                    </template>

                    <el-option v-for="dp in availableDps" :key="dp.id" :label="dp.name" :value="dp.id">
                        <div class="dp-option">
                            <span>{{ dp.name }}</span>
                            <el-tag size="small" type="info" effect="plain">{{ dp.type }}</el-tag>
                        </div>
                    </el-option>
                </el-select>

                <div class="field-tip" v-if="!modelValue.binding.dpId">
                    <el-icon>
                        <Warning />
                    </el-icon> 未绑定数据，组件仅演示
                </div>
            </el-form-item>
        </div>

        <div class="config-group">
            <div class="group-header"><span class="icon-dot"></span><span class="label">基础属性</span></div>
            <el-form-item label="组件标题"><el-input v-model="modelValue.name" /></el-form-item>
        </div>

        <div class="config-group">
            <div class="group-header"><span class="icon-dot"></span><span class="label">样式配置</span></div>

            <template v-if="modelValue.type === 'Text'">
                <el-form-item label="默认内容" v-if="!modelValue.binding?.dpId">
                    <el-input v-model="modelValue.style.text" />
                </el-form-item>
                <el-form-item label="字号">
                    <el-input-number v-model="modelValue.style.fontSize" :min="10" :max="48" />
                </el-form-item>
                <el-form-item label="对齐">
                    <el-radio-group v-model="modelValue.style.align" size="small">
                        <el-radio-button label="left">左</el-radio-button>
                        <el-radio-button label="center">中</el-radio-button>
                        <el-radio-button label="right">右</el-radio-button>
                    </el-radio-group>
                </el-form-item>
            </template>

            <template v-if="modelValue.type === 'Dashboard'">
                <el-form-item label="单位"><el-input v-model="modelValue.style.unit" /></el-form-item>
                <el-form-item label="颜色"><el-color-picker v-model="modelValue.style.color" /></el-form-item>
            </template>

            <template v-if="modelValue.type === 'Switch'">
                <el-form-item label="激活颜色"><el-color-picker v-model="modelValue.style.activeColor" /></el-form-item>
            </template>
            <template v-if="modelValue.type === 'Slider'">
                <el-form-item label="轨道颜色"><el-color-picker v-model="modelValue.style.activeColor" /></el-form-item>
            </template>
            <template v-if="modelValue.type === 'Button'">
                <el-form-item label="文案"><el-input v-model="modelValue.style.text" /></el-form-item>
                <el-form-item label="背景"><el-color-picker v-model="modelValue.style.background" /></el-form-item>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Warning } from '@element-plus/icons-vue';
import { useStudioStore } from '@/stores/studioStore';
import type { PanelComponent } from '@/types/panel';

const props = defineProps<{ modelValue: PanelComponent }>();
const store = useStudioStore();

// ✅ 修复 Bug 1: 自动补全 binding 对象，防止报错
watch(() => props.modelValue, (newVal) => {
    if (newVal && !newVal.binding) {
        newVal.binding = { dpId: undefined };
    }
}, { immediate: true, deep: true });

const requiredType = computed(() => {
    const map: any = {
        'Switch': 'Boolean', 'Slider': 'Integer',
        'Dashboard': 'Integer', 'Text': 'String/Value', 'EnumSelector': 'Enum'
    };
    return map[props.modelValue.type] || 'Unknown';
});

const availableDps = computed(() => {
    const compType = props.modelValue.type;
    return store.dps.filter(dp => {
        const t = dp.type.toLowerCase();
        if (compType === 'Switch') return t === 'boolean';
        if (compType === 'Slider' || compType === 'Dashboard') return t === 'integer';
        if (compType === 'Text') return true; // 文本通用
        if (compType === 'Button') return true;
        if (compType === 'EnumSelector') return dp.type === 'Enum';
        return false;
    });
});
</script>

<style scoped>
/* 样式与之前一致，略 */
.config-group {
    margin-bottom: 24px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 20px;
}

.config-group.highlight {
    background: #f8fafc;
    margin: -20px -20px 24px -20px;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
}

.group-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
}

.icon-dot {
    width: 4px;
    height: 14px;
    background: #cbd5e1;
    margin-right: 8px;
    border-radius: 2px;
}

.icon-dot.blue {
    background: #1a1a1a;
}

.label {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
}

.field-tip {
    font-size: 12px;
    color: #d97706;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.custom-empty {
    text-align: center;
    padding: 12px;
}

.empty-icon {
    font-size: 24px;
    color: #cbd5e1;
}

.sub-text {
    font-size: 12px;
    color: #94a3b8;
}

.dp-option {
    display: flex;
    justify-content: space-between;
    width: 100%;
}
</style>