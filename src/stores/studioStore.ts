// src/stores/studioStore.ts
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
    DataPoint,
    IModule,
    IResourceAnalysis,
    IFirmwareArtifact,
    IPinDefinition
} from '@/types/studio';
import { type ProductMetadata, DEFAULT_METADATA } from '@/types/product-config';
import api from '@/api';
import { updateProduct } from '@/api/modules/product';
import type { SceneRule } from '@/types/automation';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';

// =============================================================================
// MOCK DATA (保持不变)
// =============================================================================
const MOCK_MODULES: IModule[] = [
    {
        id: 'mod_c3_mini',
        name: 'ESP32-C3-MINI',
        vendor: 'Espressif (乐鑫)',
        architecture: 'RISC-V',
        series: 'Entry',
        flashSize: 4,
        ramSize: 400,
        clockSpeed: 160,
        description: '高性价比 RISC-V 芯片，适合智能开关、照明等简单控制场景。',
        recommended: true,
        thumbnail: '',
        availablePins: ['GPIO 0', 'GPIO 1', 'GPIO 2', 'GPIO 3', 'GPIO 4', 'GPIO 5', 'GPIO 6', 'GPIO 7', 'GPIO 8', 'GPIO 9', 'GPIO 10', 'GPIO 18', 'GPIO 19'],
        datasheetUrl: '#',
        pinoutUrl: '#'
    },
    {
        id: 'mod_s3_wroom',
        name: 'ESP32-S3-WROOM',
        vendor: 'Espressif (乐鑫)',
        architecture: 'Xtensa',
        series: 'Performance',
        flashSize: 8,
        ramSize: 512,
        clockSpeed: 240,
        description: '高性能 AIoT 芯片，支持 AI 向量指令加速。',
        availablePins: Array.from({ length: 20 }, (_, i) => `GPIO ${i + 1}`),
        datasheetUrl: '#',
        pinoutUrl: '#',
    },
    {
        id: 'mod_bl602',
        name: 'BL602-IoT',
        vendor: 'Bouffalo (博流)',
        architecture: 'RISC-V',
        series: 'Entry',
        flashSize: 2,
        ramSize: 276,
        clockSpeed: 192,
        description: '极低功耗 Wi-Fi + BLE 组合。',
        availablePins: ['GPIO 0', 'GPIO 1', 'GPIO 2', 'GPIO 11', 'GPIO 12', 'GPIO 14'],
        datasheetUrl: '#',
        pinoutUrl: '#'
    }
];

export const useStudioStore = defineStore('studio', () => {
    // ============================
    // State
    // ============================
    const activeStep = ref(1);
    const isLoading = ref(false);
    const isDirty = ref(false);
    const dps = ref<DataPoint[]>([]);
    const currentProductId = ref<string>('');
    const lastSavedTime = ref<string>('');
    // Hardware State
    const availableModules = ref<IModule[]>(MOCK_MODULES);
    const selectedModuleId = ref<string | null>('mod_c3_mini');
    const pinConfiguration = ref<IPinDefinition[]>([]);
    const scenes = ref<SceneRule[]>([]);

    // 固件列表 (State)
    const firmwareArtifacts = ref<IFirmwareArtifact[]>([
        {
            id: 'fw_init_001',
            name: 'firmware_v0.9.0.bin',
            source: 'generated',
            version: '0.9.0',
            createdAt: Date.now() - 86400000 * 2,
            size: 450 * 1024,
            description: 'Initial Alpha Build',
            downloadUrl: '#'
        }
    ]);

    const isGenerating = ref(false);

    const resourceAnalysis = ref<IResourceAnalysis>({
        ramUsageKB: 0, ramPercentage: 0, flashUsageKB: 0, flashPercentage: 0, riskLevel: 'safe', details: []
    });

    // ============================
    // Getters
    // ============================
    const currentModule = computed((): IModule | undefined => {
        return availableModules.value.find(m => m.id === selectedModuleId.value);
    });

    const isHardwareReady = computed(() => {
        return !!selectedModuleId.value && resourceAnalysis.value.riskLevel !== 'critical';
    });

    const latestFirmware = computed(() => {
        return firmwareArtifacts.value.length > 0 ? firmwareArtifacts.value[0] : null;
    });

    // ============================
    // Actions
    // ============================
    const initStudio = async (productId: string) => {
        console.log('Init Studio for:', productId);
        currentProductId.value = productId; // ✅ 保存 ID
        await fetchDataPoints(productId);
        // 初始化上次保存时间
        lastSavedTime.value = dayjs().format('HH:mm');
    };

    const fetchDataPoints = async (productId: string) => {
        isLoading.value = true;
        await new Promise(resolve => setTimeout(resolve, 600));

        if (dps.value.length === 0) {
            dps.value = [
                // 原有的 Bool
                {
                    id: 1, code: 'switch_led', name: '智能开关', type: 'Boolean', mode: 'rw', isStandard: true, property: {}
                },
                // 原有的 Enum
                {
                    id: 2, code: 'work_mode', name: '工作模式', type: 'Enum', mode: 'rw', isStandard: true, property: { range: ['auto', 'sleep', 'strong'] }
                },
                // 数值型 DP
                {
                    id: 3,
                    code: 'temp_current',
                    name: '当前温度',
                    type: 'Integer',
                    mode: 'ro',
                    isStandard: true,
                    property: { unit: '℃', min: -20, max: 100, step: 1 }
                },
                // 可写的数值型 DP
                {
                    id: 4,
                    code: 'temp_limit',
                    name: '温度报警阈值',
                    type: 'Integer',
                    mode: 'rw',
                    isStandard: true,
                    property: { unit: '℃', min: 0, max: 100, step: 1 }
                }
            ];
        }
        analyzeResources();
        isLoading.value = false;
        isDirty.value = false;
    };

    const upsertDp = (dp: DataPoint) => {
        const newItem = JSON.parse(JSON.stringify(dp));
        const index = dps.value.findIndex(item => item.id === newItem.id);
        if (index > -1) dps.value[index] = newItem;
        else dps.value.push(newItem);
        isDirty.value = true;
        analyzeResources();
    };

    const removeDp = (id: number | string) => {
        const index = dps.value.findIndex(item => item.id === id);
        if (index > -1) {
            dps.value.splice(index, 1);
            isDirty.value = true;
            analyzeResources();
        }
    };

    const analyzeResources = () => {
        const module = currentModule.value;
        if (!module) return;

        const baseRam = 120;
        const baseFlash = 900;
        let dpRam = 0;
        let dpFlash = 0;

        dps.value.forEach(dp => {
            if (dp.type === 'String' || dp.type === 'Json') {
                dpRam += 4; dpFlash += 3;
            } else {
                dpRam += 1; dpFlash += 1;
            }
        });

        const totalRam = baseRam + dpRam;
        const totalFlash = baseFlash + dpFlash;

        const ramPct = Math.min(100, Math.round((totalRam / module.ramSize) * 100));
        const flashPct = Math.min(100, Math.round((totalFlash / (module.flashSize * 1024)) * 100));

        let level: IResourceAnalysis['riskLevel'] = 'safe';
        const logs: string[] = [];

        if (ramPct > 90) { level = 'critical'; logs.push('RAM Critical'); }
        else if (ramPct > 75) { level = 'warning'; logs.push('RAM Warning'); }

        resourceAnalysis.value = {
            ramUsageKB: Math.round(totalRam),
            ramPercentage: ramPct,
            flashUsageKB: Math.round(totalFlash),
            flashPercentage: flashPct,
            riskLevel: level,
            details: logs
        };
    };

    const applyPinPreset = (type: 'minimal' | 'uart' | 'i2c') => {
        if (!currentModule.value) return;
        const pins = currentModule.value.availablePins;
        const createPin = (idx: number, func: string, desc: string): IPinDefinition => ({
            id: `pin_${Date.now()}_${idx}`,
            pin: pins[idx] || 'N/A',
            peripheral: func,
            activeLevel: 'high',
            attributes: { pullMode: 'none', driveStrength: '5mA' },
            description: desc
        });

        const newConfig: IPinDefinition[] = [];
        if (type === 'uart') {
            newConfig.push(createPin(0, 'UART_TX', 'TX'));
            newConfig.push(createPin(1, 'UART_RX', 'RX'));
        }
        pinConfiguration.value = newConfig;
    };

    const importPinFile = async (file: File) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        applyPinPreset('uart');
    };

    const initPinConfiguration = () => {
        if (pinConfiguration.value.length === 0) pinConfiguration.value = [];
    };

    const selectModule = (id: string) => {
        selectedModuleId.value = id;
        pinConfiguration.value = [];
        analyzeResources();
    };

    const generateFirmware = async (meta?: { version: string; description: string }) => {
        if (!selectedModuleId.value) return;
        isGenerating.value = true;
        await new Promise(r => setTimeout(r, 1000));

        const newArtifact: IFirmwareArtifact = {
            id: `fw_${Date.now()}`,
            name: `firmware_v${meta?.version || '1.0.0'}.bin`,
            source: 'generated',
            version: meta?.version || '1.0.0',
            createdAt: Date.now(),
            size: 1024 * 500,
            description: meta?.description || 'Auto Build',
            downloadUrl: '#'
        };
        firmwareArtifacts.value.unshift(newArtifact);
        isGenerating.value = false;
    };

    const uploadFirmware = async (file: File, meta?: { version: string; description: string }) => {
        await new Promise(r => setTimeout(r, 500));
        const newArtifact: IFirmwareArtifact = {
            id: `up_${Date.now()}`,
            name: file.name,
            source: 'uploaded',
            version: meta?.version || 'custom',
            createdAt: Date.now(),
            size: file.size,
            description: meta?.description || 'Upload',
            downloadUrl: '#'
        };
        firmwareArtifacts.value.unshift(newArtifact);
    };

    const deleteFirmware = (id: string) => {
        const index = firmwareArtifacts.value.findIndex(item => item.id === id);
        if (index > -1) {
            firmwareArtifacts.value.splice(index, 1);
        }
    };

    const saveChanges = async () => { };
    const recalculateResources = () => analyzeResources();

    watch(dps, () => analyzeResources(), { deep: true });

    // ============================
    // Product Config Metadata
    // ============================
    const productMetadata = ref<ProductMetadata>(JSON.parse(JSON.stringify(DEFAULT_METADATA)));

    const saveMetadata = async () => {
        // 模拟保存
        console.log('Saving Metadata to Backend:', JSON.stringify(productMetadata.value));
        await new Promise(r => setTimeout(r, 800)); // Mock delay
        return true;
    };
    // ✅ 新增：获取场景列表
    const fetchScenes = async () => {
        try {
            const res = await api.scene.getScenes();
            scenes.value = res.data.data || [];
        } catch (e) {
            console.error('Fetch scenes failed', e);
        }
    };

    // ✅ 新增：保存场景 (自动判断 Create/Update)
    const saveScene = async (scene: SceneRule) => {
        isLoading.value = true;
        try {
            if (scene.id && scenes.value.some(s => s.id === scene.id)) {
                await api.scene.updateScene(scene.id, scene);
            } else {
                await api.scene.createScene(scene);
            }
            await fetchScenes(); // 重新拉取
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            isLoading.value = false;
        }
    };

    // ✅ 新增：删除场景
    const deleteScene = async (id: string) => {
        await api.scene.deleteScene(id);
        await fetchScenes();
    };

    // ✅ 新增：执行场景 (返回执行结果供 UI 展示)
    const runScene = async (id: string) => {
        const res = await api.scene.executeScene(id);
        await fetchScenes(); // 更新 lastTriggered 时间
        return res.data; // 返回日志数据
    };

    // ✅✅✅ NEW: 新增 fetchMetadata Action
    const fetchMetadata = async () => {
        isLoading.value = true;
        // 从后端获取数据
        await fetchScenes();
        // 模拟数据校验和补全：防止后端数据缺失导致前端报错
        // 尤其是 scene 和 cloudTimer 这类新加的模块
        if (!productMetadata.value.scene) {
            productMetadata.value.scene = { enabled: false, rules: [] };
        }
        if (!productMetadata.value.cloudTimer) {
            productMetadata.value.cloudTimer = { enabled: false, maxSchedules: 30, actions: [] };
        }

        isLoading.value = false;
    };
    // ✅ 修复：保存草稿
    const saveDraft = async () => {
        if (!currentProductId.value) {
            ElMessage.error('无法保存：未找到产品 ID');
            return;
        }

        isLoading.value = true;
        try {
            // 构造符合 ProductDetail 接口的 Payload
            // 此时 dps, hardware, metadata 已经是 ProductDetail 的一部分了（见 types/product.ts）
            const payload = {
                dps: dps.value,
                metadata: productMetadata.value,
                hardware: {
                    module: selectedModuleId.value,
                    pins: pinConfiguration.value,
                    resourceAnalysis: resourceAnalysis.value
                },
                // status: 'DEVELOPMENT' // 保持状态不变
            };

            console.log('正在保存草稿...', payload);

            // 调用 API
            // 注意：TS 可能会提示 updateProduct 的第二个参数类型不匹配，
            // 只要 api/modules/product.ts 定义的是 (id, data: Partial<ProductDetail> & Record<string, any>) 即可兼容
            await updateProduct(currentProductId.value, payload);

            lastSavedTime.value = dayjs().format('HH:mm');
            isDirty.value = false;
            ElMessage.success('草稿保存成功');
        } catch (error) {
            console.error('Save Draft Error:', error);
            ElMessage.error('保存失败，请检查网络或后端服务');
        } finally {
            isLoading.value = false;
        }
    };

    // ✅ 修复：发布产品
    const publishProduct = async (version: string, note: string) => {
        if (!currentProductId.value) return false;

        isLoading.value = true;
        try {
            const payload = {
                status: 'RELEASED' as const,
                releaseVersion: version,
                releaseNote: note,
                releaseTime: Date.now()
            };

            await updateProduct(currentProductId.value, payload);
            ElMessage.success(`产品 V${version} 发布成功！`);
            return true;
        } catch (error) {
            console.error(error);
            ElMessage.error('发布失败');
            return false;
        } finally {
            isLoading.value = false;
        }
    };
    // ============================
    // Return (Exports)
    // ============================
    return {
        // State
        activeStep, isLoading, isDirty, dps,
        availableModules, selectedModuleId, isGenerating,
        firmwareArtifacts, resourceAnalysis, pinConfiguration,
        // Getters
        currentModule, isHardwareReady, latestFirmware,
        // Actions
        initStudio, fetchDataPoints, upsertDp, removeDp, saveChanges,
        selectModule, analyzeResources, generateFirmware, uploadFirmware, deleteFirmware,
        initPinConfiguration, applyPinPreset, importPinFile, recalculateResources,
        scenes, // State
        fetchScenes, saveScene, deleteScene, runScene, // Actions
        productMetadata,
        saveMetadata,
        fetchMetadata, saveDraft, publishProduct
    };
});