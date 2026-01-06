<template>
    <el-dialog v-model="visible" title="I/O 引脚映射配置 (BSP Configuration)" width="1000px" class="pin-config-modal"
        align-center destroy-on-close :close-on-click-modal="false">
        <div class="modal-layout">
            <div class="workspace-area">

                <div class="toolbar">
                    <div class="left-tools">
                        <el-dropdown @command="handlePreset" trigger="click">
                            <el-button type="primary" plain size="small">
                                <el-icon class="mr-1">
                                    <MagicStick />
                                </el-icon> 智能模版
                                <el-icon class="el-icon--right"><arrow-down /></el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="minimal">最小系统 (Log UART)</el-dropdown-item>
                                    <el-dropdown-item command="uart">通用串口透传</el-dropdown-item>
                                    <el-dropdown-item command="i2c">I2C 传感器模组</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>

                        <div class="import-export-group">
                            <el-button size="small" @click="handleDownloadTemplate">
                                <el-icon class="mr-1">
                                    <Download />
                                </el-icon> 下载模版
                            </el-button>
                            <el-upload class="inline-upload" action="#" :auto-upload="false" :on-change="handleImport"
                                :show-file-list="false" accept=".xlsx,.csv">
                                <el-button size="small">
                                    <el-icon class="mr-1">
                                        <FolderOpened />
                                    </el-icon> 导入表格
                                </el-button>
                            </el-upload>
                        </div>
                    </div>

                    <div class="right-tools">
                        <el-button size="small" type="danger" link @click="store.pinConfiguration = []">清空</el-button>
                        <el-button size="small" type="primary" class="black-gold-btn" @click="addPinRow">
                            <el-icon class="mr-1">
                                <Plus />
                            </el-icon> 新增引脚
                        </el-button>
                    </div>
                </div>

                <div class="table-flex-container">
                    <el-table ref="pinTableRef" :data="store.pinConfiguration" height="100%" style="width: 100%" border
                        class="pin-table">
                        <el-table-column label="引脚 (Pin)" width="130">
                            <template #default="{ row }">
                                <el-select v-model="row.pin" size="small" filterable placeholder="Select"
                                    :class="{ 'is-error': isPinDuplicated(row.pin) }">
                                    <el-option v-for="pin in store.currentModule?.availablePins" :key="pin" :label="pin"
                                        :value="pin" :disabled="isPinUsed(pin, row.id)" />
                                </el-select>
                                <div v-if="isPinDuplicated(row.pin)" class="error-text">引脚冲突</div>
                            </template>
                        </el-table-column>

                        <el-table-column label="功能 (Function)" width="150">
                            <template #default="{ row }">
                                <el-select v-model="row.peripheral" size="small" allow-create filterable
                                    default-first-option placeholder="e.g. GPIO">
                                    <el-option-group label="系统级">
                                        <el-option label="LOG_TX (Debug)" value="LOG_TX" />
                                        <el-option label="LOG_RX (Debug)" value="LOG_RX" />
                                    </el-option-group>
                                    <el-option-group label="通用 I/O">
                                        <el-option label="GPIO Input" value="GPIO_IN" />
                                        <el-option label="GPIO Output" value="GPIO_OUT" />
                                    </el-option-group>
                                    <el-option-group label="通信接口">
                                        <el-option label="UART TX" value="UART_TX" />
                                        <el-option label="UART RX" value="UART_RX" />
                                        <el-option label="I2C SCL" value="I2C_SCL" />
                                        <el-option label="I2C SDA" value="I2C_SDA" />
                                        <el-option label="PWM Output" value="PWM_OUT" />
                                        <el-option label="ADC Input" value="ADC_IN" />
                                    </el-option-group>
                                </el-select>
                            </template>
                        </el-table-column>

                        <el-table-column label="有效电平" width="90" align="center">
                            <template #default="{ row }">
                                <el-switch v-model="row.activeLevel" active-value="high" inactive-value="low"
                                    active-text="高" inactive-text="低" inline-prompt
                                    style="--el-switch-on-color: #1a1a1a; --el-switch-off-color: #909399" />
                            </template>
                        </el-table-column>

                        <el-table-column label="高级属性" width="90" align="center">
                            <template #default="{ row }">
                                <el-popover placement="bottom" title="电气属性配置" :width="240" trigger="click">
                                    <template #reference>
                                        <el-button size="small" circle :type="hasCustomAttr(row) ? 'primary' : ''"
                                            :plain="hasCustomAttr(row)">
                                            <el-icon>
                                                <Operation />
                                            </el-icon>
                                        </el-button>
                                    </template>
                                    <div class="attr-form">
                                        <div class="form-item">
                                            <span class="label">上下拉模式:</span>
                                            <el-radio-group v-model="row.attributes.pullMode" size="small">
                                                <el-radio-button value="none">无</el-radio-button>
                                                <el-radio-button value="up">上拉</el-radio-button>
                                                <el-radio-button value="down">下拉</el-radio-button>
                                            </el-radio-group>
                                        </div>
                                        <div class="form-item">
                                            <span class="label">驱动能力:</span>
                                            <el-select v-model="row.attributes.driveStrength" size="small">
                                                <el-option label="5mA (Standard)" value="5mA" />
                                                <el-option label="10mA (Strong)" value="10mA" />
                                                <el-option label="20mA (Turbo)" value="20mA" />
                                            </el-select>
                                        </div>
                                    </div>
                                </el-popover>
                            </template>
                        </el-table-column>

                        <el-table-column label="说明 (Description)" min-width="120">
                            <template #default="{ row }">
                                <el-input v-model="row.description" size="small" placeholder="输入备注..." />
                            </template>
                        </el-table-column>

                        <el-table-column width="60" align="center" fixed="right">
                            <template #default="{ $index }">
                                <el-button type="danger" link :icon="Delete" @click="removeRow($index)" />
                            </template>
                        </el-table-column>

                    </el-table>
                </div>
            </div>

            <div class="visual-area">
                <div class="area-header">
                    <span>芯片引脚定义图 (Reference)</span>
                    <el-tag size="small" type="info">{{ store.currentModule?.name }}</el-tag>
                </div>

                <div class="image-wrapper">
                    <el-image v-if="store.currentModule?.pinoutUrl" :src="store.currentModule.pinoutUrl"
                        :preview-src-list="[store.currentModule.pinoutUrl]" fit="contain" class="pinout-image"
                        referrer-policy="no-referrer">
                        <template #error>
                            <div class="image-error">
                                <el-icon :size="30">
                                    <Picture />
                                </el-icon>
                                <span>暂无引脚图或加载失败</span>
                                <el-button v-if="store.currentModule?.datasheetUrl" link type="primary" size="small"
                                    @click="openDatasheet">
                                    查看 Datasheet
                                </el-button>
                            </div>
                        </template>
                        <template #placeholder>
                            <div class="image-loading">加载中...</div>
                        </template>
                    </el-image>
                    <div v-else class="image-error">
                        <el-icon :size="30">
                            <Picture />
                        </el-icon>
                        <span>该模组未配置引脚图</span>
                    </div>
                </div>

                <div class="visual-hint">
                    <el-icon>
                        <InfoFilled />
                    </el-icon>
                    点击图片可查看高清大图。请严格参照官方 Datasheet 进行电气设计。
                </div>
            </div>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" class="black-gold-btn" @click="handleSave">
                    保存配置
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { useStudioStore } from '@/stores/studioStore';
import { ElMessage, ElMessageBox, type ElTable } from 'element-plus';
import {
    Plus, Delete, MagicStick, FolderOpened, Operation,
    ArrowDown, InfoFilled, Picture, Download
} from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import type { IPinDefinition } from '@/types/studio';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);
const store = useStudioStore();
const pinTableRef = ref<InstanceType<typeof ElTable>>();

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// === 表格操作 ===

const addPinRow = () => {
    const newPin: IPinDefinition = {
        id: `pin_${Date.now()}`,
        pin: '',
        peripheral: '',
        activeLevel: 'high',
        attributes: { pullMode: 'none', driveStrength: '5mA' },
        description: ''
    };
    store.pinConfiguration.push(newPin);

    // 自动滚动到底部
    nextTick(() => {
        if (pinTableRef.value) {
            const wrapper = pinTableRef.value.$el.querySelector('.el-scrollbar__wrap');
            if (wrapper) {
                wrapper.scrollTop = wrapper.scrollHeight;
            }
        }
    });
};

const removeRow = (index: number) => {
    store.pinConfiguration.splice(index, 1);
};

// === 视觉反馈 ===
const hasCustomAttr = (row: IPinDefinition) => {
    return row.attributes.pullMode !== 'none' || row.attributes.driveStrength !== '5mA';
};

const openDatasheet = () => {
    if (store.currentModule?.datasheetUrl) {
        window.open(store.currentModule.datasheetUrl, '_blank');
    }
};

// === 校验逻辑 ===

const isPinUsed = (pinName: string, currentId: string) => {
    return store.pinConfiguration.some(row => row.pin === pinName && row.id !== currentId);
};

const isPinDuplicated = (pinName: string) => {
    if (!pinName) return false;
    return store.pinConfiguration.filter(row => row.pin === pinName).length > 1;
};

// === 模版与导入/导出 ===

const handlePreset = (type: string) => {
    store.applyPinPreset(type as any);
    ElMessage.success('已应用模组推荐配置');
};

const handleDownloadTemplate = () => {
    const headers = ['Pin Name', 'Function', 'Active Level (high/low)', 'Description'];
    const exampleRow = ['GPIO 5', 'PWM_OUT', 'high', 'Controls the LED brightness'];

    const csvContent = [
        headers.join(','),
        exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'pin_config_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const handleImport = async (file: UploadFile) => {
    if (file.raw) {
        await store.importPinFile(file.raw);
        ElMessage.success('配置导入成功 (Mock)');
    }
};

const handleSave = () => {
    const invalidRows = store.pinConfiguration.filter(r => !r.pin || !r.peripheral);
    if (invalidRows.length > 0) {
        ElMessage.warning('请补全所有引脚的【物理引脚】和【功能】定义');
        return;
    }

    const hasLog = store.pinConfiguration.some(r =>
        r.peripheral.toUpperCase().includes('LOG') ||
        r.peripheral.toUpperCase().includes('UART')
    );

    if (!hasLog) {
        ElMessageBox.confirm(
            '当前配置未检测到系统日志引脚 (Log UART/TX)。这可能导致设备无法调试或烧录失败。确定要继续吗？',
            '风险提示',
            {
                confirmButtonText: '强制保存',
                cancelButtonText: '返回修改',
                type: 'warning',
            }
        ).then(() => {
            commitSave();
        }).catch(() => { });
        return;
    }

    commitSave();
};

const commitSave = () => {
    visible.value = false;
    ElMessage.success('BSP 配置已保存');
};
</script>

<style scoped lang="scss">
.modal-layout {
    display: flex;
    gap: 24px;
    height: 520px;
}

.workspace-area {
    flex: 3;
    display: flex;
    flex-direction: column;
    /* 🔥 关键：加上 overflow: hidden，防止子元素撑大容器导致覆盖右侧 */
    overflow: hidden;
    /* 增加最小宽度保护 */
    min-width: 0;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-shrink: 0;

    .left-tools {
        display: flex;
        gap: 12px;
    }

    .import-export-group {
        display: flex;
        gap: 8px;
    }

    .inline-upload {
        display: inline-block;
    }
}

/* 🔥 核心修复：表格容器 
   使用标准的 Flex 垂直自适应，不使用 absolute 
*/
.table-flex-container {
    flex: 1;
    /* 占据剩余垂直空间 */
    min-height: 0;
    /* 允许 shrinking 以触发滚动 */
    display: flex;
    flex-direction: column;
}

.visual-area {
    flex: 2;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    border: 1px solid #ebeef5;
    /* 防止图片区域被挤压 */
    min-width: 320px;
}

.area-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-weight: 700;
    color: #606266;
    margin-bottom: 12px;
}

.image-wrapper {
    flex: 1;
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e4e7ed;

    .pinout-image {
        width: 100%;
        height: 100%;
        max-height: 400px;
    }

    .image-error,
    .image-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: #909399;
        font-size: 12px;
        gap: 8px;
        text-align: center;
    }
}

.visual-hint {
    margin-top: 12px;
    font-size: 12px;
    color: #909399;
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.4;
}

.is-error :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset;
}

.error-text {
    font-size: 10px;
    color: #f56c6c;
    margin-top: 2px;
}

.attr-form {
    padding: 4px;

    .form-item {
        margin-bottom: 12px;

        &:last-child {
            margin-bottom: 0;
        }

        .label {
            display: block;
            font-size: 12px;
            color: #606266;
            margin-bottom: 4px;
        }
    }
}

.black-gold-btn {
    background: #1a1a1a;
    border-color: #1a1a1a;
    color: #d4a72c;

    &:hover {
        opacity: 0.9;
    }
}

.mr-1 {
    margin-right: 4px;
}
</style>