// src/stores/studioStore.ts
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue'; // ✅ 修复：补充 watch 导入
import type {
    DataPoint, // ✅ 修复：使用 DataPoint 而非 IDataPoint
    IModule,
    IResourceAnalysis,
    IFirmwareArtifact
} from '@/types/studio';

// MOCK DATA: 模拟的硬件模组数据库
const MOCK_MODULES: IModule[] = [
    {
        id: 'mod_c3_mini',
        name: 'ESP32-C3-MINI',
        vendor: 'Espressif',
        architecture: 'RISC-V',
        series: 'Entry',
        flashSize: 4,     // 4MB
        ramSize: 400,     // 400KB
        clockSpeed: 160,
        description: '高性价比 RISC-V 芯片，适合简单的开关/照明设备。',
        recommended: true,
        thumbnail: 'https://placeholder.com/chip-c3.png'
    },
    {
        id: 'mod_s3_wroom',
        name: 'ESP32-S3-WROOM',
        vendor: 'Espressif',
        architecture: 'Xtensa',
        series: 'Performance',
        flashSize: 8,     // 8MB
        ramSize: 512,     // 512KB + PSRAM
        clockSpeed: 240,
        description: '高性能 AIoT 芯片，支持 AI 加速指令，适合复杂交互场景。'
    },
    {
        id: 'mod_bl602',
        name: 'BL602-IoT',
        vendor: 'Bouffalo',
        architecture: 'RISC-V',
        series: 'Entry',
        flashSize: 2,     // 2MB
        ramSize: 276,     // 276KB
        clockSpeed: 192,
        description: '极低功耗 Wi-Fi + BLE 组合，适合电池供电设备。'
    }
];

export const useStudioStore = defineStore('studio', () => {
    // =========================================================================
    // State: 基础与 DP 定义
    // =========================================================================
    const activeStep = ref(3);
    const isLoading = ref(false);
    const isDirty = ref(false);

    // ✅ 修复：使用 DataPoint[] 类型
    const dps = ref<DataPoint[]>([]);

    // =========================================================================
    // State: 硬件开发 (Step 3: Hardware Dev)
    // =========================================================================
    const availableModules = ref<IModule[]>(MOCK_MODULES);
    const selectedModuleId = ref<string | null>('mod_c3_mini');
    const isGenerating = ref(false);

    const firmwareArtifacts = ref<IFirmwareArtifact[]>([]);

    const resourceAnalysis = ref<IResourceAnalysis>({
        ramUsageKB: 0,
        ramPercentage: 0,
        flashUsageKB: 0,
        flashPercentage: 0,
        riskLevel: 'safe',
        details: []
    });

    // =========================================================================
    // Getters
    // =========================================================================

    const currentModule = computed((): IModule | undefined => {
        return availableModules.value.find(m => m.id === selectedModuleId.value);
    });

    const isHardwareReady = computed(() => {
        return !!selectedModuleId.value && resourceAnalysis.value.riskLevel !== 'critical';
    });

    // =========================================================================
    // Actions: 核心业务逻辑 (定义在上方以便调用)
    // =========================================================================

    /**
     * 核心算法：静态资源评估
     */
    const analyzeResources = () => {
        const module = currentModule.value;
        if (!module) return;

        // 1. 系统底噪
        const baseRamOverhead = 120; // KB
        const baseFlashOverhead = 900; // KB

        // 2. 动态计算业务开销
        let dpRamCost = 0;
        let dpFlashCost = 0;

        dps.value.forEach(dp => {
            // ✅ 修复：case 匹配你 DataPoint 中的 'Boolean' (首字母大写)
            switch (dp.type) {
                case 'Boolean':
                case 'Enum':
                case 'Integer':
                    dpRamCost += 0.8;
                    dpFlashCost += 1.5;
                    break;
                case 'String':
                    dpRamCost += 4.0;
                    dpFlashCost += 3.0;
                    break;
                case 'Raw':
                    dpRamCost += 12.0;
                    dpFlashCost += 5.0;
                    break;
                default:
                    dpRamCost += 1.0;
                    dpFlashCost += 1.0;
            }
        });

        const totalRam = baseRamOverhead + dpRamCost;
        const totalFlash = baseFlashOverhead + dpFlashCost;

        const ramPct = Math.min(100, Math.round((totalRam / module.ramSize) * 100));
        // module.flashSize 是 MB，需要转为 KB
        const flashTotalKB = module.flashSize * 1024;
        const flashPct = Math.min(100, Math.round((totalFlash / flashTotalKB) * 100));

        // 风险评级
        let level: IResourceAnalysis['riskLevel'] = 'safe';
        const riskLogs: string[] = [];

        if (ramPct > 90) {
            level = 'critical';
            riskLogs.push('RAM 严重不足：运行时极易发生 Stack Overflow');
        } else if (ramPct > 75) {
            level = 'warning';
            riskLogs.push('RAM 占用较高：建议优化数据结构或升级模组');
        }

        if (flashPct > 98) {
            level = 'critical';
            riskLogs.push('Flash 空间溢出：固件体积超过分区限制');
        }

        if (level === 'safe') {
            riskLogs.push('资源评估通过：当前配置运行在安全范围内');
        }

        resourceAnalysis.value = {
            ramUsageKB: Math.round(totalRam),
            ramPercentage: ramPct,
            flashUsageKB: Math.round(totalFlash),
            flashPercentage: flashPct,
            riskLevel: level,
            details: riskLogs
        };
    };

    const selectModule = (moduleId: string) => {
        selectedModuleId.value = moduleId;
        analyzeResources();
    };

    const generateFirmware = async () => {
        if (!selectedModuleId.value) return;

        isGenerating.value = true;
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const newArtifact: IFirmwareArtifact = {
                    id: `fw_${Date.now()}`,
                    version: `1.0.${firmwareArtifacts.value.length + 1}-beta`,
                    createdAt: Date.now(),
                    size: 1024 * 1024 + Math.floor(Math.random() * 500000),
                    type: 'release',
                    downloadUrl: '#'
                };
                firmwareArtifacts.value.unshift(newArtifact);
                isGenerating.value = false;
                resolve();
            }, 1500);
        });
    };

    // =========================================================================
    // Actions: DP 管理 (兼容原有逻辑)
    // =========================================================================

    const fetchDataPoints = async (productId: string) => {
        isLoading.value = true;
        await new Promise(resolve => setTimeout(resolve, 600));

        // 保留你的 Mock 数据初始化逻辑
        if (dps.value.length === 0) {
            dps.value = [
                {
                    id: 1, code: 'switch_led', name: '智能开关', type: 'Boolean', mode: 'rw', isStandard: true,
                    property: {}
                },
                {
                    id: 2, code: 'work_mode', name: '工作模式', type: 'Enum', mode: 'rw', isStandard: true,
                    property: { range: ['auto', 'sleep', 'strong'] }
                }
            ];
        }

        analyzeResources(); // 数据加载后初次计算
        isLoading.value = false;
        isDirty.value = false;
    };

    const upsertDp = (dp: DataPoint) => {
        const index = dps.value.findIndex(item => item.id === dp.id);
        if (index > -1) {
            dps.value[index] = dp;
        } else {
            dps.value.push(dp);
        }
        isDirty.value = true;
        analyzeResources(); // ✅ 变更时重算
    };

    const removeDp = (id: number | string) => {
        dps.value = dps.value.filter(dp => dp.id !== id);
        isDirty.value = true;
        analyzeResources(); // ✅ 变更时重算
    };

    const saveChanges = async () => {
        isLoading.value = true;
        await new Promise(resolve => setTimeout(resolve, 800));
        isDirty.value = false;
        isLoading.value = false;
    };

    // 监听 DPs 变化，确保拖拽排序等操作也能触发计算
    watch(dps, () => {
        analyzeResources();
    }, { deep: true });

    return {
        // State
        activeStep,
        isLoading,
        isDirty,
        dps,
        availableModules,
        selectedModuleId,
        isGenerating,
        firmwareArtifacts,
        resourceAnalysis,

        // Getters
        currentModule,
        isHardwareReady,

        // Actions
        fetchDataPoints,
        upsertDp,
        removeDp,
        saveChanges,
        selectModule,
        analyzeResources,
        generateFirmware
    };
});