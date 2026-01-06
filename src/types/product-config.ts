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

// 3. 全局产品元数据 (Product Metadata) - 最终存入数据库的 JSON
export interface ProductMetadata {
    provisioning: ProvisioningConfig;
    i18n: I18nConfig;
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
    }
};