<template>
    <div class="i18n-workspace noir-skin">
        <div class="strategy-header">
            <div class="header-section start">
                <div class="icon-wrapper">
                    <el-icon :size="20" color="#d4af37">
                        <Notebook />
                    </el-icon>
                </div>
                <div class="title-block">
                    <h3>多语言配置</h3>
                    <p>I18N Configuration</p>
                </div>
            </div>

            <div class="header-section center">
                <div class="control-item">
                    <span class="label">源语言 (Source)</span>
                    <el-select v-model="modelValue.defaultLang" class="noir-select-sm" :teleported="false">
                        <el-option label="中文 (Zh)" value="zh" />
                        <el-option label="English" value="en" />
                    </el-select>
                </div>

                <div class="divider"></div>

                <div class="control-item wide">
                    <span class="label">目标语言 (Target)</span>
                    <el-select v-model="modelValue.languages" multiple collapse-tags collapse-tags-tooltip
                        :max-collapse-tags="2" placeholder="请选择目标语言" class="noir-select-lg" :teleported="false"
                        @change="handleTargetLangChange">
                        <el-option label="English (英文)" value="en" />
                        <el-option label="Français (法语)" value="fr" />
                        <el-option label="日本語 (日语)" value="jp" />
                        <el-option label="Deutsch (德语)" value="de" />
                        <el-option label="Español (西语)" value="es" />
                        <el-option label="Русский (俄语)" value="ru" />
                    </el-select>
                </div>
            </div>

            <div class="header-section end">
                <div class="switch-box">
                    <span class="switch-label" :class="{ active: modelValue.enabled }">
                        {{ modelValue.enabled ? '已启用' : '已停用' }}
                    </span>
                    <el-switch v-model="modelValue.enabled" class="noir-switch" inline-prompt active-text="ON"
                        inactive-text="OFF" />
                </div>
            </div>
        </div>

        <div class="workspace-body">
            <div class="toolbar">
                <div class="toolbar-left">
                    <el-button class="noir-btn-text" @click="addCustomKey">
                        <el-icon>
                            <Plus />
                        </el-icon> 新增 Key
                    </el-button>
                    <el-button class="noir-btn-text danger" @click="clearCustomKeys">
                        <el-icon>
                            <Delete />
                        </el-icon> 清空
                    </el-button>
                </div>

                <div class="toolbar-right">
                    <span class="count-badge" v-if="translationData.length">
                        Total: <b>{{ translationData.length }}</b>
                    </span>
                    <el-button class="noir-btn-primary" :loading="isTranslating" @click="handleAiTask">
                        <el-icon class="icon-spin" v-if="isTranslating">
                            <Loading />
                        </el-icon>
                        <el-icon v-else>
                            <MagicStick />
                        </el-icon>
                        <span class="ml-1">{{ isTranslating ? 'AI 生成中...' : 'AI 智能补全' }}</span>
                    </el-button>
                </div>
            </div>

            <div class="table-container-fix">
                <el-table :data="translationData" style="width: 100%; height: 100%" class="noir-table" stripe border
                    highlight-current-row :header-cell-style="{ background: '#f8f9fb', color: '#606266' }">
                    <el-table-column label="Key (键名)" min-width="160" fixed>
                        <template #default="{ row }">
                            <div class="key-cell">
                                <span class="key-text">{{ row.key }}</span>
                                <el-tag v-if="row.isSystem" type="info" size="small" effect="plain"
                                    class="sys-tag">SYS</el-tag>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column min-width="220">
                        <template #header>
                            <div class="col-header">
                                <span class="dot source"></span>
                                <span>源文案 ({{ modelValue.defaultLang.toUpperCase() }})</span>
                            </div>
                        </template>
                        <template #default="{ row }">
                            <el-input v-model="row.zh" class="noir-input-ghost" placeholder="请输入..." />
                        </template>
                    </el-table-column>

                    <el-table-column min-width="220">
                        <template #header>
                            <el-dropdown trigger="click" @command="cmd => currentEditLang = cmd"
                                :disabled="!hasTargetLangs">
                                <div class="col-header interactable">
                                    <span class="dot target"></span>
                                    <span class="current-lang">{{ currentEditLangLabel }}</span>
                                    <el-icon class="icon-down">
                                        <ArrowDown />
                                    </el-icon>
                                </div>
                                <template #dropdown>
                                    <el-dropdown-menu class="noir-dropdown">
                                        <el-dropdown-item v-for="lang in activeTargetLangs" :key="lang.value"
                                            :command="lang.value" :class="{ active: currentEditLang === lang.value }">
                                            {{ lang.label }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </template>

                        <template #default="{ row }">
                            <div v-if="!hasTargetLangs" class="warning-text">
                                <el-icon>
                                    <Warning />
                                </el-icon> 请先选择目标语言
                            </div>
                            <el-input v-else v-model="row[currentEditLang]" class="noir-input-ghost"
                                :placeholder="isTranslating ? 'AI 生成中...' : '输入翻译...'" />
                        </template>
                    </el-table-column>

                    <el-table-column width="60" align="center" fixed="right">
                        <template #default="{ $index, row }">
                            <el-button v-if="!row.isSystem" class="row-action-btn" link @click="removeKey($index)">
                                <el-icon>
                                    <Close />
                                </el-icon>
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
    Notebook, MagicStick, Plus, Delete, ArrowDown, Close, Warning, Loading
} from '@element-plus/icons-vue';
import type { I18nConfig } from '@/types/product-config';
import { useStudioStore } from '@/stores/studioStore';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps<{
    modelValue: I18nConfig
}>();

const store = useStudioStore();
const isTranslating = ref(false);

const currentEditLang = ref('');
const translationData = ref<any[]>([]);

const allLangs = [
    { label: '简体中文', value: 'zh' },
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
    { label: '日本語', value: 'jp' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Español', value: 'es' },
    { label: 'Русский', value: 'ru' }
];

const activeTargetLangs = computed(() => {
    return allLangs.filter(l => props.modelValue.languages.includes(l.value));
});

const hasTargetLangs = computed(() => activeTargetLangs.value.length > 0);

const currentEditLangLabel = computed(() => {
    if (!hasTargetLangs.value) return '请选择语言';
    const lang = allLangs.find(l => l.value === currentEditLang.value);
    return lang?.label || currentEditLang.value;
});

const handleTargetLangChange = (vals: string[]) => {
    if ((!vals.includes(currentEditLang.value) || !currentEditLang.value) && vals.length > 0) {
        currentEditLang.value = vals[0];
    }
};

onMounted(() => {
    initData();
    if (props.modelValue.languages.length > 0) {
        currentEditLang.value = props.modelValue.languages[0];
    }
});

const initData = () => {
    // 生成足够多的数据以测试滚动
    const data: any[] = [
        { key: 'device_name', zh: '智能设备', isSystem: true },
        { key: 'status_online', zh: '在线', isSystem: true },
        { key: 'confirm', zh: '确定', isSystem: true },
        { key: 'cancel', zh: '取消', isSystem: true },
    ];

    if (store.dps && store.dps.length > 0) {
        store.dps.forEach(dp => {
            data.push({ key: `dp_${dp.code}`, zh: dp.name, isSystem: true });
            if (dp.type === 'Enum' && dp.property?.range) {
                dp.property.range.forEach((val: string) => {
                    data.push({ key: `dp_${dp.code}_${val}`, zh: val, isSystem: true });
                });
            }
        });
    } else {
        // 默认 Mock 数据，多生成几条测试滚动
        for (let i = 1; i <= 15; i++) {
            data.push({ key: `mock_key_${i}`, zh: `测试文案 ${i}`, isSystem: true });
        }
    }
    translationData.value = data;
};

const addCustomKey = () => {
    translationData.value.unshift({
        key: 'custom_key_' + Math.floor(Math.random() * 10000),
        zh: '',
        isSystem: false
    });
};

const removeKey = (index: number) => {
    translationData.value.splice(index, 1);
};

const clearCustomKeys = () => {
    ElMessageBox.confirm('确定要清空自定义词条吗？', '提示', { type: 'warning' })
        .then(() => {
            translationData.value = translationData.value.filter(item => item.isSystem);
            ElMessage.success('已清空');
        });
};

// --- 内置 AI 逻辑 (确保功能可用) ---
const handleAiTask = async () => {
    if (activeTargetLangs.value.length === 0) {
        ElMessage.warning('请先在顶部选择目标语言');
        return;
    }

    isTranslating.value = true;
    let count = 0;

    // 模拟网络延迟
    await new Promise(r => setTimeout(r, 1500));

    translationData.value.forEach(item => {
        activeTargetLangs.value.forEach(lang => {
            const langKey = lang.value;
            // 只有为空时才补全
            if (!item[langKey]) {
                // 模拟 AI 翻译结果：[En] SourceText
                const prefix = `[${langKey.toUpperCase()}]`;
                item[langKey] = `${prefix} ${item.zh || item.key}`;
                count++;
            }
        });
    });

    isTranslating.value = false;
    if (count > 0) {
        ElMessage.success(`AI 已补全 ${count} 条缺失文案`);
    } else {
        ElMessage.info('没有检测到需要补全的空缺文案');
    }
};
</script>

<style scoped lang="scss">
/* --- 布局容器 --- */
.noir-skin {
    /* 关键：限制父容器高度为 100%，配合 flex 实现内部滚动 */
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    overflow: hidden;
    /* 防止最外层出现滚动条 */
}

/* --- 1. 顶部策略栏 (Flex 左右布局) --- */
.strategy-header {
    flex-shrink: 0;
    /* 禁止被压缩 */
    height: 72px;
    padding: 0 24px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}

.header-section {
    display: flex;
    align-items: center;
    gap: 16px;

    &.start {
        flex: 0 0 auto;
    }

    &.center {
        flex: 1;
        justify-content: center;
        background: #f8f9fb;
        padding: 8px 16px;
        border-radius: 8px;
        gap: 24px;
    }

    &.end {
        flex: 0 0 auto;
    }
}

.icon-wrapper {
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.title-block h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
}

.title-block p {
    margin: 2px 0 0 0;
    font-size: 11px;
    color: #909399;
}

/* 中间控制区 */
.control-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.control-item.wide {
    flex: 1;
    max-width: 400px;
}

.control-item .label {
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    white-space: nowrap;
}

.divider {
    width: 1px;
    height: 20px;
    background: #dcdfe6;
}

/* 开关区 */
.switch-box {
    display: flex;
    align-items: center;
    gap: 8px;
}

.switch-label {
    font-size: 12px;
    font-weight: 600;
    color: #909399;

    &.active {
        color: #d4af37;
    }
}

/* --- 2. 工作区 (关键修复) --- */
.workspace-body {
    flex: 1;
    /* 占据剩余所有高度 */
    display: flex;
    flex-direction: column;
    padding: 20px 24px;
    min-height: 0;
    /* 允许 flex 子项缩小，防止溢出 */
    background-color: #fff;
}

.toolbar {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.noir-btn-text {
    color: #606266;

    &:hover {
        color: #000;
    }

    &.danger:hover {
        color: #f56c6c;
    }
}

.count-badge {
    font-size: 12px;
    color: #909399;
    margin-right: 12px;

    b {
        color: #303133;
    }
}

.noir-btn-primary {
    background-color: #1a1a1a !important;
    color: #d4af37 !important;
    border: 1px solid #1a1a1a !important;
    padding: 8px 16px;

    &:hover {
        opacity: 0.9;
    }
}

/* --- 表格容器修复 --- */
.table-container-fix {
    flex: 1;
    /* 撑满剩余高度 */
    height: 100%;
    /* 必须显式设置高度，el-table 才能计算滚动 */
    overflow: hidden;
    /* 防止外泄 */
    border-radius: 8px;
    border: 1px solid #e4e7ed;
}

/* --- 样式覆盖 (黑金风) --- */
:deep(.noir-select-sm .el-select__wrapper) {
    width: 100px;
    background-color: #fff;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.noir-select-lg .el-select__wrapper) {
    width: 100%;
    background-color: #fff;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-select__wrapper.is-focused) {
    box-shadow: 0 0 0 1px #d4af37 inset !important;
}

:deep(.noir-switch.el-switch) {
    --el-switch-on-color: #d4af37;
}

/* 表格内样式 */
.key-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.key-text {
    font-family: monospace;
    font-size: 12px;
    font-weight: 500;
}

.sys-tag {
    border: none;
    background: #f2f3f5;
    color: #909399;
    font-weight: 700;
    height: 20px;
    padding: 0 6px;
}

.col-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #606266;
}

.col-header.interactable {
    cursor: pointer;
    color: #1a1a1a;
    font-weight: 600;
}

.col-header.interactable:hover {
    color: #d4af37;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.dot.source {
    background: #c0c4cc;
}

.dot.target {
    background: #d4af37;
}

.warning-text {
    font-size: 12px;
    color: #e6a23c;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* 隐形输入框 */
:deep(.noir-input-ghost .el-input__wrapper) {
    box-shadow: none !important;
    background: transparent;
    padding: 0;
}

:deep(.noir-input-ghost .el-input__wrapper.is-focus),
:deep(.noir-input-ghost:hover .el-input__wrapper) {
    background: #fff;
    box-shadow: 0 0 0 1px #d4af37 inset !important;
    padding: 0 8px;
    border-radius: 4px;
}
</style>