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
// MOCK DATA: 模拟的硬件模组数据库
// =============================================================================
const MOCK_MODULES: IModule[] = [
    {
        id: 'mod_c3_mini',
        name: 'ESP32-C3-MINI',
        vendor: 'Espressif (乐鑫)',
        architecture: 'RISC-V',
        series: 'Entry',
        flashSize: 4,     // 4MB
        ramSize: 400,     // 400KB
        clockSpeed: 160,
        description: '高性价比 RISC-V 芯片，适合智能开关、照明等简单控制场景。',
        recommended: true,
        thumbnail: '',
        availablePins: ['GPIO 0', 'GPIO 1', 'GPIO 2', 'GPIO 3', 'GPIO 4', 'GPIO 5', 'GPIO 6', 'GPIO 7', 'GPIO 8', 'GPIO 9', 'GPIO 10', 'GPIO 18', 'GPIO 19'],
        datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf',
        pinoutUrl: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32c3/_images/esp32-c3-mini-1-pinout.png'
    },
    {
        id: 'mod_s3_wroom',
        name: 'ESP32-S3-WROOM',
        vendor: 'Espressif (乐鑫)',
        architecture: 'Xtensa',
        series: 'Performance',
        flashSize: 8,     // 8MB
        ramSize: 512,     // 512KB + PSRAM
        clockSpeed: 240,
        description: '高性能 AIoT 芯片，支持 AI 向量指令加速，适合语音识别与屏显交互。',
        availablePins: Array.from({ length: 20 }, (_, i) => `GPIO ${i + 1}`),
        datasheetUrl: 'https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf',
        pinoutUrl: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/_images/esp32-s3-wroom-1_pinout.png',
    },
    {
        id: 'mod_bl602',
        name: 'BL602-IoT',
        vendor: 'Bouffalo (博流)',
        architecture: 'RISC-V',
        series: 'Entry',
        flashSize: 2,     // 2MB
        ramSize: 276,     // 276KB
        clockSpeed: 192,
        description: '极低功耗 Wi-Fi + BLE 组合，适合电池供电的传感器设备。',
        availablePins: ['GPIO 0', 'GPIO 1', 'GPIO 2', 'GPIO 3', 'GPIO 4', 'GPIO 5', 'GPIO 11', 'GPIO 12', 'GPIO 14'],
        datasheetUrl: '#',
        pinoutUrl: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/_images/esp32-s3-wroom-1_pinout.png'
    }
];

export const useStudioStore = defineStore('studio', () => {
    // State
    const activeStep = ref(1);
    const isLoading = ref(false);
    const isDirty = ref(false);
    const dps = ref<DataPoint[]>([]);

    // Hardware State
    const availableModules = ref<IModule[]>(MOCK_MODULES);
    const selectedModuleId = ref<string | null>('mod_c3_mini');
    const pinConfiguration = ref<IPinDefinition[]>([]);
    const firmwareArtifacts = ref<IFirmwareArtifact[]>([]);
    const isGenerating = ref(false);

    const resourceAnalysis = ref<IResourceAnalysis>({
        ramUsageKB: 0, ramPercentage: 0, flashUsageKB: 0, flashPercentage: 0, riskLevel: 'safe', details: []
    });

    // Getters
    const currentModule = computed((): IModule | undefined => {
        return availableModules.value.find(m => m.id === selectedModuleId.value);
    });

    const isHardwareReady = computed(() => {
        return !!selectedModuleId.value && resourceAnalysis.value.riskLevel !== 'critical';
    });

    // Actions

    // ✅ 核心修复：实现初始化逻辑，防止 ProductPanel 报错
    const initStudio = async (productId: string) => {
        console.log('Initializing Studio for Product:', productId);
        await fetchDataPoints(productId);
    };

    const fetchDataPoints = async (productId: string) => {
        isLoading.value = true;
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 600));

        // 仅在数据为空时加载默认 Mock 数据，防止覆盖用户操作
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

    // ✅ 核心修复：实现 upsertDp 逻辑
    const upsertDp = (dp: DataPoint) => {
        // 使用深拷贝断开引用，防止表单修改影响 Store，直到保存
        const newItem = JSON.parse(JSON.stringify(dp));

        const index = dps.value.findIndex(item => item.id === newItem.id);
        if (index > -1) {
            // 更新现有
            dps.value[index] = newItem;
        } else {
            // 新增
            dps.value.push(newItem);
        }
        isDirty.value = true;
        analyzeResources(); // 重新计算资源占用
    };

    // ✅ 核心修复：实现 removeDp 逻辑
    const removeDp = (id: number | string) => {
        const index = dps.value.findIndex(item => item.id === id);
        if (index > -1) {
            dps.value.splice(index, 1);
            isDirty.value = true;
            analyzeResources();
        }
    };

    const saveChanges = async () => {
        isLoading.value = true;
        await new Promise(resolve => setTimeout(resolve, 800)); // Mock API
        isLoading.value = false;
        isDirty.value = false;
        // 这里可以添加 ElMessage 提示，但通常由 UI 层处理
    };

    const analyzeResources = () => {
        const module = currentModule.value;
        if (!module) return;

        // 1. 系统底噪
        const baseRamOverhead = 120;
        const baseFlashOverhead = 900;

        // 2. 动态计算业务开销
        let dpRamCost = 0;
        let dpFlashCost = 0;

        dps.value.forEach(dp => {
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
        const flashTotalKB = module.flashSize * 1024;
        const flashPct = Math.min(100, Math.round((totalFlash / flashTotalKB) * 100));

        let level: IResourceAnalysis['riskLevel'] = 'safe';
        const riskLogs: string[] = [];

        if (ramPct > 90) {
            level = 'critical';
            riskLogs.push('RAM 严重不足：运行时极易发生栈溢出');
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

    /**
     * 应用智能引脚模版 (Method C)
     */
    const applyPinPreset = (type: 'minimal' | 'uart' | 'i2c') => {
        if (!currentModule.value) return;

        // 清空当前
        const newConfig: IPinDefinition[] = [];
        const pins = currentModule.value.availablePins;

        const createPin = (idx: number, func: string, desc: string): IPinDefinition => ({
            id: `pin_${Date.now()}_${idx}`,
            pin: pins[idx] || 'N/A',
            peripheral: func,
            activeLevel: 'high',
            attributes: { pullMode: 'none', driveStrength: '5mA' },
            description: desc
        });

        if (type === 'minimal') {
            newConfig.push(createPin(0, 'LOG_TX', '系统日志输出'));
            newConfig.push(createPin(1, 'LOG_RX', '系统日志输入'));
        } else if (type === 'uart') {
            newConfig.push(createPin(0, 'UART1_TX', '用户串口 TX'));
            newConfig.push(createPin(1, 'UART1_RX', '用户串口 RX'));
            newConfig.push(createPin(2, 'GPIO_OUT', '状态指示灯'));
        } else if (type === 'i2c') {
            newConfig.push(createPin(3, 'I2C_SCL', '传感器时钟'));
            newConfig.push(createPin(4, 'I2C_SDA', '传感器数据'));
        }

        pinConfiguration.value = newConfig;
    };

    /**
     * 模拟解析 Excel/CSV 文件 (Method B)
     */
    const importPinFile = async (file: File) => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                applyPinPreset('uart');
                resolve();
            }, 800);
        });
    };

    const initPinConfiguration = () => {
        // 解耦：保持为空，不自动绑定 DP
        if (pinConfiguration.value.length === 0) {
            pinConfiguration.value = [];
        }
    };

    const selectModule = (moduleId: string) => {
        selectedModuleId.value = moduleId;
        pinConfiguration.value = []; // 切换模组清空配置
        analyzeResources();
    };

    const generateFirmware = async () => {
        if (!selectedModuleId.value) return;
        isGenerating.value = true;
        await new Promise(r => setTimeout(r, 1000));
        isGenerating.value = false;
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const newArtifact: IFirmwareArtifact = {
                    id: `fw_gen_${Date.now()}`,
                    name: `firmware_v1.0.${firmwareArtifacts.value.length + 1}.bin`,
                    source: 'generated',
                    version: `1.0.${firmwareArtifacts.value.length + 1}-beta`,
                    createdAt: Date.now(),
                    size: 1024 * 1024 + Math.floor(Math.random() * 500000),
                    downloadUrl: '#'
                };
                firmwareArtifacts.value.unshift(newArtifact);
                isGenerating.value = false;
                resolve();
            }, 1500);
        });
    };

    const uploadFirmware = async (file: File) => {
        isGenerating.value = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newArtifact: IFirmwareArtifact = {
            id: `fw_up_${Date.now()}`,
            name: file.name,
            source: 'uploaded',
            version: '自定义构建',
            createdAt: Date.now(),
            size: file.size,
            downloadUrl: '#'
        };
        firmwareArtifacts.value.unshift(newArtifact);
        isGenerating.value = false;
    };

    watch(dps, () => {
        analyzeResources();
    }, { deep: true });

    return {
        activeStep, isLoading, isDirty, dps,
        availableModules, selectedModuleId, isGenerating, firmwareArtifacts, resourceAnalysis, pinConfiguration,
        currentModule, isHardwareReady,
        initStudio, // 导出 initStudio
        fetchDataPoints,
        upsertDp,   // 导出 upsertDp
        removeDp,   // 导出 removeDp
        saveChanges,
        selectModule, analyzeResources, generateFirmware, uploadFirmware, initPinConfiguration,
        applyPinPreset, importPinFile
    };
});