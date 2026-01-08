<template>
    <el-drawer v-model="visible" :show-close="false" :with-header="false" size="800px" append-to-body
        class="tech-noir-drawer" @closed="handleClosed">

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
import { ref, computed, watch } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { useStudioStore } from '@/stores/studioStore';
import { ElMessage } from 'element-plus'; // 引入 Message

import ProvisioningPanel from './modules/ProvisioningPanel.vue';
import I18nPanel from './modules/I18nPanel.vue';
import TimerPanel from './modules/timer/index.vue';
import OtaPanel from './modules/OtaPanel.vue';
import AlertPanel from './modules/AlertPanel.vue';
import ScenePanel from './modules/ScenePanel.vue';
// 组件映射表
const COMPONENT_MAP: Record<string, any> = {
    'provisioning': ProvisioningPanel,
    'i18n': I18nPanel,
    'timer': TimerPanel,
    'ota': OtaPanel,
    'alert': AlertPanel,
    'scene': ScenePanel,
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

// ✅ 核心修复 1：添加 Key 映射辅助函数
const getDataKey = (moduleKey: string) => {
    // 前端组件叫 'timer'，但数据存储叫 'cloudTimer'
    if (moduleKey === 'timer') return 'cloudTimer';
    // 其他保持一致 ('i18n' -> 'i18n', 'provisioning' -> 'provisioning')
    return moduleKey;
};

watch([() => props.modelValue, () => props.moduleKey], ([isOpen, newKey]) => {
    if (isOpen && newKey) {
        // 重置数据，显示 Loading
        currentModuleData.value = null;

        // 1. 获取正确的数据 Key
        const dataKey = getDataKey(newKey);

        // 2. 从 Store 获取原始数据
        let rawData = store.productMetadata ? (store.productMetadata as any)[dataKey] : null;

        // ✅ 核心修复 2：数据兜底 (Defensive Initialization)
        // 如果 Store 里还没存这个模块的数据（比如新增的 Timer），手动给一个默认值
        if (!rawData && newKey === 'timer') {
            rawData = {
                enabled: false,
                maxSchedules: 30,
                actions: []
            };
            console.log('自动初始化 cloudTimer 默认数据');
        }

        // 3. 赋值给本地状态 (深拷贝)
        if (rawData) {
            currentModuleData.value = JSON.parse(JSON.stringify(rawData));
        } else {
            // 如果实在找不到数据，给个空对象防止 Loading 卡死，并提示
            console.warn(`未找到模块 ${newKey} (Key: ${dataKey}) 的数据`);
            currentModuleData.value = {};
        }
    }
});

const handleSave = async () => {
    saving.value = true;
    try {
        if (store.productMetadata) {
            // ✅ 核心修复 3：保存时也要用映射后的 Key
            const dataKey = getDataKey(props.moduleKey);

            (store.productMetadata as any)[dataKey] = currentModuleData.value;
            await store.saveMetadata();
        }
        emit('saved');
        close();
    } catch (e) {
        console.error(e);
        ElMessage.error('保存失败');
    } finally {
        saving.value = false;
    }
};

const resetToDefault = () => {
    console.log('Reset triggered');
    // TODO: 这里可以根据 getDataKey(props.moduleKey) 重置为初始值
    ElMessage.info('重置功能开发中');
};

const close = () => {
    visible.value = false;
};

const handleClosed = () => {
    currentModuleData.value = null;
};
</script>

<style scoped lang="scss">
/* 既然彻底移除了 header，这里的 :deep 覆盖就不再需要那么复杂了，
  保留这些为了确保 body 布局正常 
*/
:deep(.tech-noir-drawer) {
    .el-drawer__body {
        padding: 0;
        /* 确保无边距 */
        background: #f5f7fa;
        display: flex;
        flex-direction: column;
    }

    .el-drawer__footer {
        border-top: 1px solid #e4e7ed;
        padding: 16px 24px;
        background: #fff;
    }
}

.drawer-body {
    padding: 0;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.drawer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

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