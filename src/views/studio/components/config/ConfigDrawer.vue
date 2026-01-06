<template>
    <el-drawer v-model="visible" :show-close="false" size="800px" append-to-body class="tech-noir-drawer"
        @closed="handleClosed">
        <template #header>
            <div class="drawer-header">
                <div class="header-left">
                    <div class="icon-box">
                        <el-icon :size="20" color="#ffd700">
                            <component :is="icon" />
                        </el-icon>
                    </div>
                    <div class="header-titles">
                        <h3 class="title">{{ title }}</h3>
                        <span class="subtitle">模块配置 (Module Configuration)</span>
                    </div>
                </div>
                <div class="header-actions">
                    <el-button circle icon="Close" class="close-btn" @click="close" />
                </div>
            </div>
        </template>

        <div class="drawer-body">
            <component v-if="currentModuleData" :is="moduleComponent" v-model="currentModuleData" />
            <div v-else class="loading-state">
                <el-icon class="is-loading">
                    <Loading />
                </el-icon> 正在读取配置...
            </div>
        </div>

        <template #footer>
            <div class="drawer-footer">
                <div class="footer-left">
                    <el-button link type="info" @click="resetToDefault">恢复默认设置</el-button>
                </div>
                <div class="footer-right">
                    <el-button @click="close">取消</el-button>
                    <el-button type="primary" :loading="saving" class="gold-btn-solid" @click="handleSave">
                        保存并应用
                    </el-button>
                </div>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue';
import { Close, Loading } from '@element-plus/icons-vue';
import { useStudioStore } from '@/stores/studioStore';

import ProvisioningPanel from './modules/ProvisioningPanel.vue';

const COMPONENT_MAP: Record<string, any> = {
    'provisioning': ProvisioningPanel,
};

const props = defineProps<{
    modelValue: boolean;
    moduleKey: string;
    title: string;
    icon: any;
}>();

const emit = defineEmits(['update:modelValue', 'saved']);
const store = useStudioStore();

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const saving = ref(false);
const currentModuleData = ref<any>(null);

const moduleComponent = computed(() => {
    return COMPONENT_MAP[props.moduleKey] || null;
});

watch(() => props.modelValue, (isOpen) => {
    if (isOpen && props.moduleKey) {
        const rawData = store.productMetadata ? store.productMetadata[props.moduleKey as keyof typeof store.productMetadata] : null;
        if (rawData) {
            currentModuleData.value = JSON.parse(JSON.stringify(rawData));
        }
    }
});

const handleSave = async () => {
    saving.value = true;
    try {
        if (store.productMetadata) {
            (store.productMetadata as any)[props.moduleKey] = currentModuleData.value;
            await store.saveMetadata();
        }
        emit('saved');
        close();
    } catch (e) {
        console.error(e);
    } finally {
        saving.value = false;
    }
};

const resetToDefault = () => {
    console.log('Reset triggered');
};

const close = () => {
    visible.value = false;
};

const handleClosed = () => {
    currentModuleData.value = null;
};
</script>

<style scoped lang="scss">
:deep(.tech-noir-drawer) {

    /* 这里的样式会影响整个抽屉 */
    .el-drawer__header {
        margin: 0;
        padding: 0;
        height: 64px;
        background: #1f1f1f;
    }

    .el-drawer__body {
        padding: 0;
        background: #f5f7fa;
    }

    .el-drawer__footer {
        border-top: 1px solid #e4e7ed;
        padding: 16px 24px;
        background: #fff;
    }
}

.drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 100%;
    color: #fff;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.icon-box {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-titles {
    display: flex;
    flex-direction: column;

    .title {
        font-size: 16px;
        font-weight: 600;
        line-height: 1.2;
        margin: 0;
    }

    .subtitle {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
    }
}

.close-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    transition: all 0.3s;

    &:hover {
        background: #fff;
        color: #000;
        border-color: #fff;
    }
}

.drawer-body {
    padding: 24px;
    height: 100%;
    overflow-y: auto;
}

.drawer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 底部主按钮样式覆盖 */
.gold-btn-solid {
    background-color: #1f1f1f !important;
    border-color: #1f1f1f !important;
    color: #d4af37 !important;
    font-weight: 600;

    &:hover {
        background-color: #000 !important;
        border-color: #000 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
        background-color: #000 !important;
    }
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #909399;
    gap: 8px;
}
</style>