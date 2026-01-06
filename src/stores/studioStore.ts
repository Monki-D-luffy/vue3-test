import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
    DataPoint,
    IModule,
    IResourceAnalysis,
    IFirmwareArtifact,
    IPinDefinition
} from '@/types/studio';

// =============================================================================
// MOCK DATA
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

    // Hardware State
    const availableModules = ref<IModule[]>(MOCK_MODULES);
    const selectedModuleId = ref<string | null>('mod_c3_mini');
    const pinConfiguration = ref<IPinDefinition[]>([]);

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

    // ✅ FIX: 最新固件 Getter
    const latestFirmware = computed(() => {
        return firmwareArtifacts.value.length > 0 ? firmwareArtifacts.value[0] : null;
    });

    // ============================
    // Actions
    // ============================
    const initStudio = async (productId: string) => {
        console.log('Init:', productId);
        await fetchDataPoints(productId);
    };

    const fetchDataPoints = async (productId: string) => {
        isLoading.value = true;
        await new Promise(resolve => setTimeout(resolve, 600));

        if (dps.value.length === 0) {
            dps.value = [
                {
                    id: 1, code: 'switch_led', name: '智能开关', type: 'Boolean', mode: 'rw', isStandard: true, property: {}
                },
                {
                    id: 2, code: 'work_mode', name: '工作模式', type: 'Enum', mode: 'rw', isStandard: true, property: { range: ['auto', 'sleep', 'strong'] }
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

    // ✅ FIX: 删除 Action
    const deleteFirmware = (id: string) => {
        const index = firmwareArtifacts.value.findIndex(item => item.id === id);
        if (index > -1) {
            firmwareArtifacts.value.splice(index, 1);
        }
    };

    const saveChanges = async () => { };
    const recalculateResources = () => analyzeResources();

    watch(dps, () => analyzeResources(), { deep: true });

    // ✅✅✅ CRITICAL FIX: 必须在这里 Return 才能被组件调用
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
        initPinConfiguration, applyPinPreset, importPinFile, recalculateResources
    };
});

/**
 * 产品配置模块元数据接口
 * 用于生成配置页面的卡片矩阵
 */
export interface ConfigModule {
    id: string;
    title: string;       // 模块标题 (e.g., "多语言配置")
    description: string; // 功能描述
    icon: string;        // 图标名称 (ElIcon)
    isEnabled: boolean;  // 开关状态
    isPremium?: boolean; // 是否为高级功能 (用于显示金色角标)
    tags: string[];      // 标签 (e.g., ["云端", "交互"])
    componentName?: string; // 点击后加载的组件名
}