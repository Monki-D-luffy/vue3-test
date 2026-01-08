<template>
    <div class="alert-layout">
        <div class="header-bar">
            <div class="header-info">
                <span class="module-title">告警配置 (Alerts)</span>
                <span class="module-status" :class="{ 'is-active': modelValue.enabled }">
                    {{ modelValue.enabled ? '服务已启用' : '服务已禁用' }}
                </span>
            </div>
            <el-switch v-model="modelValue.enabled" class="noir-switch" inline-prompt active-text="ON"
                inactive-text="OFF" />
        </div>

        <div class="content-body" :class="{ 'is-disabled': !modelValue.enabled }">
            <div v-if="!modelValue.rules || modelValue.rules.length === 0" class="empty-stage">
                <div class="empty-icon-box"><el-icon>
                        <Bell />
                    </el-icon></div>
                <p class="empty-text">暂无告警规则</p>
                <el-button type="primary" class="gold-btn-solid" icon="Plus"
                    @click="openEditor(null)">新建告警规则</el-button>
            </div>

            <div v-else class="rule-grid">
                <div class="add-card" @click="openEditor(null)">
                    <el-icon>
                        <Plus />
                    </el-icon><span>新建规则</span>
                </div>
                <div v-for="(rule, index) in modelValue.rules" :key="rule.id" class="alert-card">
                    <div class="card-header">
                        <div class="header-left-group">
                            <span class="rule-name text-ellipsis">{{ rule.name }}</span>
                            <el-tooltip v-if="rule.bindTargetDpId" content="已开启设备参数同步" placement="top">
                                <el-icon class="sync-icon-small">
                                    <Connection />
                                </el-icon>
                            </el-tooltip>
                        </div>
                        <el-switch v-model="rule.enabled" size="small" class="noir-switch-xs" />
                    </div>
                    <div class="condition-box">
                        <div class="tag-row">
                            <el-tag type="info" size="small" effect="plain" class="dp-tag">DP {{ rule.dpId }}</el-tag>
                            <span class="logic-text text-ellipsis">当 {{ rule.dpName }}</span>
                        </div>
                        <div class="logic-expression">
                            <span class="operator">{{ getOperatorLabel(rule.operator) }}</span>
                            <span class="threshold">{{ formatThreshold(rule) }}</span>
                        </div>
                    </div>
                    <div class="action-preview">
                        <el-icon>
                            <Message />
                        </el-icon><span class="msg-text text-ellipsis">{{ rule.message }}</span>
                    </div>
                    <div class="card-actions">
                        <el-button type="primary" link icon="Edit" @click="openEditor(rule)">编辑</el-button>
                        <el-button type="danger" link icon="Delete" @click="deleteRule(index)">删除</el-button>
                    </div>
                </div>
            </div>
        </div>

        <AlertRuleEditor v-model="editorVisible" :rule-data="currentEditingRule" :available-dps="availableDps"
            :writable-dps="writableDps" @save="handleSaveRule" />

    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Bell, Plus, Edit, Delete, Message, Connection } from '@element-plus/icons-vue';
import { useStudioStore } from '@/stores/studioStore';
import type { AlertConfig, AlertRule } from '@/types/product-config';
import { ElMessage } from 'element-plus';
// 引入新组件
import AlertRuleEditor from './alert/AlertRuleEditor.vue';

const props = defineProps<{ modelValue: AlertConfig }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();

// --- DP 数据源 ---
// 过滤出适合做告警的 DP
const availableDps = computed(() => store.dps.filter(dp => ['Boolean', 'Integer', 'Value', 'Enum'].includes(dp.type)));
// 过滤出可写的数值型 DP (作为同步目标)
const writableDps = computed(() => store.dps.filter(dp => ['Integer', 'Value'].includes(dp.type) && dp.mode === 'rw'));

// --- 状态管理 ---
const editorVisible = ref(false);
const currentEditingRule = ref<AlertRule | null>(null); // 当前正在编辑的规则数据

// --- 交互逻辑 ---
const openEditor = (rule: AlertRule | null) => {
    currentEditingRule.value = rule; // null 表示新建
    editorVisible.value = true;
};

// ✅ 处理子组件保存事件
const handleSaveRule = async (finalRule: AlertRule, isSyncEnabled: boolean) => {

    // 1. 处理下发逻辑 (演示)
    if (isSyncEnabled && finalRule.bindTargetDpId) {
        console.log(`[Device Sync] Sending Command: DP ${finalRule.bindTargetDpId} = ${finalRule.threshold}`);
        // 模拟网络延迟
        await new Promise(r => setTimeout(r, 500));
        ElMessage.success({
            message: `云端规则已保存，并下发阈值至设备 (DP${finalRule.bindTargetDpId})`,
            duration: 3000
        });
    } else {
        ElMessage.success('云端规则已保存');
    }

    // 2. 更新本地数据
    const newRules = [...(props.modelValue.rules || [])];
    // 判断是编辑还是新建
    const existingIndex = newRules.findIndex(r => r.id === finalRule.id);

    if (existingIndex !== -1) {
        // 编辑模式：替换原规则
        newRules[existingIndex] = finalRule;
    } else {
        // 新建模式：追加
        newRules.push(finalRule);
    }

    emit('update:modelValue', { ...props.modelValue, rules: newRules });
    // editorVisible 会在子组件触发 update:modelValue 后自动变为 false
};

const deleteRule = (index: number) => {
    const newRules = [...props.modelValue.rules];
    newRules.splice(index, 1);
    emit('update:modelValue', { ...props.modelValue, rules: newRules });
};

// 辅助显示
const getOperatorLabel = (op: string) => ({ '>': '大于', '<': '小于', '==': '等于' }[op] || op);
const formatThreshold = (rule: AlertRule) => rule.dpType === 'Boolean' ? (rule.threshold ? 'ON' : 'OFF') : rule.threshold;
</script>

<style scoped lang="scss">
/* 保持原有基础布局样式... */
.alert-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
    font-family: 'Inter', sans-serif;
}

.header-bar {
    flex-shrink: 0;
    padding: 16px 24px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
}

.module-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    margin-right: 12px;
}

.module-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f4f4f5;
    color: #909399;

    &.is-active {
        color: #d4af37;
        background: rgba(212, 175, 55, 0.1);
    }
}

.content-body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: #fcfcfc;

    &.is-disabled {
        opacity: 0.5;
        pointer-events: none;
        filter: grayscale(1);
    }
}

/* 复用列表样式 */
.empty-stage {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .empty-icon-box {
        width: 64px;
        height: 64px;
        background: #f5f7fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #d4af37;
        font-size: 32px;
        margin-bottom: 16px;
    }

    .empty-text {
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 8px;
    }
}

.rule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.add-card {
    border: 1px dashed #dcdfe6;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    cursor: pointer;
    transition: all 0.2s;
    color: #909399;
    gap: 8px;

    &:hover {
        border-color: #d4af37;
        color: #d4af37;
        background: #fffdf5;
    }
}

.alert-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: all 0.2s;
    position: relative;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
        border-color: #dcdfe6;
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-left-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    overflow: hidden;
}

.rule-name {
    font-weight: 600;
    font-size: 15px;
    color: #1a1a1a;
}

.sync-icon-small {
    color: #10b981;
    font-size: 14px;
}

.condition-box {
    background: #f8f9fb;
    padding: 12px;
    border-radius: 8px;

    .tag-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
    }

    .logic-text {
        font-size: 12px;
        color: #606266;
        flex: 1;
    }

    .logic-expression {
        font-family: monospace;
        font-weight: 700;
        color: #d4af37;
        font-size: 16px;
        display: flex;
        gap: 8px;
    }
}

.action-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #909399;
    font-size: 12px;

    .msg-text {
        flex: 1;
    }
}

:deep(.noir-switch.el-switch .el-switch__core) {
    border-color: #dcdfe6;
    background: #dcdfe6;
}

:deep(.noir-switch.el-switch.is-checked .el-switch__core) {
    border-color: #d4af37;
    background: #d4af37;
}

.card-actions {
    margin-top: auto;
    border-top: 1px solid #f2f3f5;
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

:deep(.gold-btn-solid) {
    background: #1f1f1f;
    border-color: #1f1f1f;
    color: #d4af37;
    font-weight: 600;
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>