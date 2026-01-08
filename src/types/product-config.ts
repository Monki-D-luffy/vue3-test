// src/types/product-config.ts

// 1. 配网引导配置 (Provisioning)
export interface ProvisioningConfig {
    enabled: boolean;
    protocol: 'wifi_ble' | 'wifi_ap'; // ESP32 C3/S3 通常用 wifi_ble
    timeout: number; // 超时时间
    ledPin: number | null; // 关联的 LED GPIO (用于指示配网状态)
    steps: Array<{
        title: string;
        desc: string;
        imageUrl: string; // 引导图 URL
    }>;
}

// 2. 多语言配置 (I18N)
export interface I18nConfig {
    enabled: boolean;
    defaultLang: 'zh' | 'en';
    languages: string[]; // ['zh', 'en', 'jp']
    // 实际的翻译键值对通常太大，不放在这里，而是单独接口加载
}
// 3. 云端定时配置 (Cloud Timer)
export interface TimerActionDef {
    dpId: number;
    code: string;
    name: string;
    type: string; // 'bool', 'enum', 'value'
    selected: boolean; // 开发者是否勾选允许定时
    alias?: string; // (可选) 在定时界面显示的别名，如 "switch" -> "自动开关"
}

export interface TimerConfig {
    enabled: boolean;
    maxSchedules: number; // 限制用户最多创建多少个定时任务 (默认 30)
    // 白名单机制：只有列表里的 DP 才会在 App 定时页面显示
    actions: TimerActionDef[];
}

//  全局产品元数据 (Product Metadata) - 最终存入数据库的 JSON
export interface ProductMetadata {
    provisioning: ProvisioningConfig;
    i18n: I18nConfig;
    cloudTimer: TimerConfig;
    ota: OtaConfig;
    // ... 后续增加 OTA, Timer 等
}

// 默认初始值
export const DEFAULT_METADATA: ProductMetadata = {
    provisioning: {
        enabled: true,
        protocol: 'wifi_ble',
        timeout: 180,
        ledPin: null,
        steps: [
            { title: '进入配网模式', desc: '长按设备复位键 5 秒，直到指示灯闪烁。', imageUrl: '' },
            { title: '连接设备', desc: '打开手机蓝牙，搜索设备名称。', imageUrl: '' }
        ]
    },
    i18n: {
        enabled: false,
        defaultLang: 'zh',
        languages: ['zh', 'en']
    },
    cloudTimer: {
        enabled: false,
        maxSchedules: 30,
        actions: []
    },
    ota: {
        enabled: false,
        policy: {
            autoCheck: true,
            upgradeMode: 'remind',
            checkInterval: 24,
            retryCount: 3
        },
        releases: []
    }
};

// --- 新增：OTA 固件升级配置 ---

export interface OtaPolicy {
    autoCheck: boolean;          // 是否自动检查更新
    upgradeMode: 'force' | 'remind' | 'silent'; // 升级模式：强制/提醒/静默
    checkInterval: number;       // 检查周期 (小时)
    retryCount: number;          // 失败重试次数
}

export interface FirmwareRelease {
    id: string;
    version: string;             // 版本号 e.g., "1.0.2"
    type: 'prod' | 'gray' | 'dev'; // 正式/灰度/开发
    description: string;         // 更新文案
    size: number;                // 字节大小
    createdAt: number;           // 时间戳
    status: 'active' | 'suspended'; // 状态
    grayScale?: number;          // 灰度比例 (1-100)
}

export interface OtaConfig {
    enabled: boolean;
    policy: OtaPolicy;
    releases: FirmwareRelease[];
}




