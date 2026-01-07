<template>
    <div class="i18n-workspace noir-skin">
        <div class="config-header">
            <div class="config-row">
                <div class="row-left">
                    <span class="label">源语言 (Source):</span>
                    <el-select v-model="modelValue.defaultLang" class="noir-select-sm" :teleported="false">
                        <el-option label="中文 (Zh)" value="zh" />
                        <el-option label="English" value="en" />
                    </el-select>
                </div>
                <div class="row-right">
                    <el-switch v-model="modelValue.enabled" class="noir-switch" inline-prompt active-text="ON"
                        inactive-text="OFF" style="--el-switch-on-color: #d4af37" />
                </div>
            </div>

            <div class="config-row mt-compact">
                <div class="row-left full-width">
                    <span class="label">目标语言 (Target):</span>
                    <el-select v-model="modelValue.languages" multiple collapse-tags collapse-tags-tooltip
                        :max-collapse-tags="5" placeholder="请选择需要翻译的目标语言..." class="noir-select-lg" :teleported="false"
                        popper-class="noir-dropdown-light" @change="handleTargetLangChange">
                        <el-option v-for="lang in allLangs.filter(l => l.value !== 'zh')" :key="lang.value"
                            :label="lang.label" :value="lang.value" />
                    </el-select>
                </div>
            </div>
        </div>

        <div class="workspace-body scrollable-y">
            <div class="toolbar">
                <div class="toolbar-left">
                    <el-button link class="action-btn" @click="addCustomKey">
                        <el-icon>
                            <Plus />
                        </el-icon> 新增
                    </el-button>
                    <el-button link class="action-btn danger" @click="clearCustomKeys">
                        <el-icon>
                            <Delete />
                        </el-icon> 清空
                    </el-button>
                </div>
                <div class="toolbar-right">
                    <el-button class="noir-btn-primary" :loading="isAiTranslating" @click="executeAiTranslation">
                        <el-icon v-if="!isAiTranslating">
                            <MagicStick />
                        </el-icon>
                        <span class="ml-1">{{ isAiTranslating ? '生成中...' : 'AI 智能补全' }}</span>
                    </el-button>
                </div>
            </div>

            <div class="table-wrapper">
                <el-table :data="paginatedData" style="width: 100%;" class="noir-table" stripe border
                    highlight-current-row
                    :header-cell-style="{ background: '#f8f9fb', color: '#606266', height: '36px', padding: '4px 0' }">
                    <el-table-column label="Key" min-width="140" show-overflow-tooltip>
                        <template #default="{ row }">
                            <span class="key-text">{{ row.key }}</span>
                            <el-tag v-if="row.isSystem" type="info" size="small" effect="plain"
                                class="ml-2 sys-tag">SYS</el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column min-width="160">
                        <template #header>
                            <span class="col-head">源文案 ({{ modelValue.defaultLang.toUpperCase() }})</span>
                        </template>
                        <template #default="{ row }">
                            <el-input v-model="row.zh" class="noir-input-ghost" placeholder="输入..." />
                        </template>
                    </el-table-column>

                    <el-table-column min-width="160">
                        <template #header>
                            <el-dropdown trigger="click" @command="(cmd: string) => currentEditLang = cmd"
                                :disabled="!hasTargetLangs" popper-class="noir-dropdown-light">
                                <div class="col-head interactable">
                                    <span class="current-lang">{{ currentEditLangLabel }}</span>
                                    <el-icon class="icon-down ml-1">
                                        <ArrowDown />
                                    </el-icon>
                                </div>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item v-for="lang in activeTargetLangs" :key="lang.value"
                                            :command="lang.value">
                                            {{ lang.label }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </template>
                        <template #default="{ row }">
                            <div v-if="!hasTargetLangs" class="warning-text">请配置目标语言</div>
                            <el-input v-else v-model="row[currentEditLang]" class="noir-input-ghost"
                                placeholder="等待翻译..." />
                        </template>
                    </el-table-column>

                    <el-table-column width="40" align="center">
                        <template #default="{ row }">
                            <el-icon class="del-icon" @click="removeKey(row)">
                                <Close />
                            </el-icon>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="pagination-footer">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50]" layout="total, prev, pager, next" :total="translationData.length"
                    size="small" background class="noir-pagination-light" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { MagicStick, Plus, Delete, ArrowDown, Close } from '@element-plus/icons-vue';
import type { I18nConfig } from '@/types/product-config';
import { useStudioStore } from '@/stores/studioStore';
import { useI18nAi } from '@/ai/strategies/useI18nAi';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps<{ modelValue: I18nConfig }>();
const store = useStudioStore();
const { isTranslating: isAiTranslating, translateMissingItems } = useI18nAi();

const currentEditLang = ref('');
const translationData = ref<any[]>([]);

// 分页逻辑
const currentPage = ref(1);
const pageSize = ref(10);
const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return translationData.value.slice(start, end);
});

// 统一管理语言列表
const allLangs = [
    { label: '简体中文 (Zh)', value: 'zh' },
    { label: 'English (英文)', value: 'en' },
    { label: 'Français (法语)', value: 'fr' },
    { label: '日本語 (日语)', value: 'jp' },
    { label: 'Deutsch (德语)', value: 'de' },
    { label: 'Español (西语)', value: 'es' },
    { label: 'Русский (俄语)', value: 'ru' }
];

const activeTargetLangs = computed(() => allLangs.filter(l => props.modelValue.languages.includes(l.value)));
const hasTargetLangs = computed(() => activeTargetLangs.value.length > 0);
const currentEditLangLabel = computed(() => {
    if (!hasTargetLangs.value) return '目标语言';
    const lang = allLangs.find(l => l.value === currentEditLang.value);
    return lang?.label || currentEditLang.value;
});

const handleTargetLangChange = (val: any) => {
    const vals = val as string[];
    if ((!vals.includes(currentEditLang.value) || !currentEditLang.value) && vals.length > 0) {
        currentEditLang.value = vals[0] ?? '';
    }
};

const executeAiTranslation = async () => {
    if (!hasTargetLangs.value) return ElMessage.warning('请先选择目标语言');
    translationData.value = await translateMissingItems(translationData.value, props.modelValue.languages);
};

onMounted(() => {
    initData();
    if (props.modelValue.languages.length > 0) currentEditLang.value = props.modelValue.languages[0] ?? '';
});

const initData = () => {
    const data: any[] = [
        { key: 'device_name', zh: '智能设备', isSystem: true },
        { key: 'status_online', zh: '在线', isSystem: true },
    ];
    if (store.dps?.length > 0) {
        store.dps.forEach(dp => {
            data.push({ key: `dp_${dp.code}`, zh: dp.name, isSystem: true });
        });
    } else {
        for (let i = 1; i <= 25; i++) data.push({ key: `sample_key_${i}`, zh: `测试文本 ${i}`, isSystem: true });
    }
    translationData.value = data;
};

const addCustomKey = () => {
    translationData.value.unshift({ key: 'custom_' + Date.now(), zh: '', isSystem: false });
    currentPage.value = 1;
};

const removeKey = (row: any) => {
    const idx = translationData.value.findIndex(item => item === row);
    if (idx !== -1) {
        translationData.value.splice(idx, 1);
    }
};

const clearCustomKeys = () => {
    ElMessageBox.confirm('确定要清空所有自定义词条吗？此操作无法撤销。', '清空确认', {
        type: 'warning',
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        customClass: 'noir-message-box-light',
    }).then(() => {
        translationData.value = translationData.value.filter(i => i.isSystem);
        currentPage.value = 1;
        ElMessage.success('已清空');
    });
};
</script>

<style scoped lang="scss">
/* 主容器 */
.i18n-workspace {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
}

/* 头部配置区 */
.config-header {
    flex-shrink: 0;
    padding: 12px 20px;
    border-bottom: 1px solid #e4e7ed;
    background: #fff;
}

.config-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.mt-compact {
    margin-top: 8px;
}

.row-left {
    display: flex;
    align-items: center;
    gap: 8px;

    &.full-width {
        flex: 1;
    }
}

.label {
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    white-space: nowrap;
}

/* 下拉控件 */
:deep(.noir-select-sm .el-select__wrapper) {
    width: 100px;
    height: 28px;
    min-height: 28px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.noir-select-lg .el-select__wrapper) {
    width: 100%;
    height: 28px;
    min-height: 28px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-select__wrapper.is-focused) {
    box-shadow: 0 0 0 1px #d4af37 inset !important;
}

/* 工作区内容 */
.workspace-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 20px;
    overflow-y: auto;
}

.toolbar {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

/* 按钮 */
.noir-btn-primary {
    background: #1a1a1a;
    color: #d4af37;
    border: none;
    height: 28px;
    padding: 0 16px;
    font-size: 12px;
    border-radius: 4px;

    &:hover {
        opacity: 0.9;
    }
}

.action-btn {
    font-size: 12px;
    color: #606266;

    &:hover {
        color: #1a1a1a;
    }
}

.action-btn.danger:hover {
    color: #f56c6c;
}

/* 表格容器 */
.table-wrapper {
    border: 1px solid #eee;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
}

.key-text {
    font-family: monospace;
    font-size: 12px;
    color: #1a1a1a;
}

.sys-tag {
    transform: scale(0.85);
}

.col-head {
    font-size: 12px;
    font-weight: 600;
    color: #333;
}

.col-head.interactable {
    cursor: pointer;
    color: #1a1a1a;
    display: flex;
    align-items: center;

    &:hover {
        color: #d4af37;
    }
}

.warning-text {
    font-size: 12px;
    color: #e6a23c;
}

.del-icon {
    cursor: pointer;
    color: #c0c4cc;

    &:hover {
        color: #f56c6c;
    }
}

:deep(.noir-input-ghost .el-input__wrapper) {
    box-shadow: none;
    background: transparent;
    padding: 0 4px;
    font-size: 12px;
}

:deep(.noir-input-ghost .el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #d4af37 inset;
    background: #fff;
}

/* 分页器 */
.pagination-footer {
    flex-shrink: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}
</style>

<style lang="scss">
/* 1. 亮色版下拉菜单 */
.noir-dropdown-light {

    &.el-popper,
    &.el-select__popper {
        background: #fff !important;
        border: 1px solid #e4e7ed !important;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
    }

    .el-popper__arrow::before {
        background: #fff !important;
        border: 1px solid #e4e7ed !important;
    }

    .el-select-dropdown__item,
    .el-dropdown-menu__item {
        color: #606266 !important;

        &.hover,
        &:hover {
            background-color: #f5f7fa !important;
            color: #1a1a1a !important;
        }

        &.selected,
        &:not(.is-disabled):focus {
            color: #d4af37 !important;
            font-weight: 600;
            background-color: transparent !important;
        }
    }
}

/* 2. 亮色版黑金分页器 */
.noir-pagination-light.el-pagination.is-background {

    .btn-prev,
    .btn-next {
        background-color: #f4f4f5 !important;
        color: #606266 !important;
        border: none !important;

        &:hover {
            color: #d4af37 !important;
        }

        &:disabled {
            color: #c0c4cc !important;
            background-color: #f4f4f5 !important;
        }
    }

    .el-pager li {
        background-color: #f4f4f5 !important;
        color: #606266 !important;
        border: none !important;
        font-weight: 500;

        &.is-active {
            background-color: #1a1a1a !important;
            color: #d4af37 !important;
            font-weight: 700;
        }

        &:hover:not(.is-active) {
            color: #d4af37 !important;
        }
    }
}

/* 3. 亮色版删除弹框 */
.noir-message-box-light {
    background-color: #fff !important;
    border: 1px solid #ebeef5 !important;
    border-radius: 8px !important;
    padding-bottom: 20px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;

    .el-message-box__title {
        color: #1a1a1a !important;
        font-weight: 600;
    }

    .el-message-box__message p {
        color: #606266 !important;
    }

    .el-message-box__headerbtn .el-message-box__close {
        color: #909399 !important;

        &:hover {
            color: #d4af37 !important;
        }
    }

    .el-button--primary {
        background-color: #1a1a1a !important;
        border-color: #1a1a1a !important;
        color: #d4af37 !important;
        font-weight: 600;

        &:hover {
            opacity: 0.9;
        }
    }

    .el-button:not(.el-button--primary) {
        background: #fff !important;
        border: 1px solid #dcdfe6 !important;
        color: #606266 !important;

        &:hover {
            border-color: #d4af37 !important;
            color: #d4af37 !important;
            background-color: #fff !important;
        }
    }
}
</style>