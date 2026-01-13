// src/types/product.ts
import type { DataPoint, IPinDefinition, IResourceAnalysis } from './studio'; // 引入必要类型
import type { ProductMetadata } from './product-config'; // 引入元数据类型
export type ProtocolType = 'WIFI' | 'BLE' | 'WIFI_BLE' | 'ZIGBEE' | 'NB_IOT' | 'ETHERNET';
export type DeviceType = 'LIGHT' | 'SWITCH' | 'SENSOR' | 'LOCK' | 'GATEWAY' | 'OTHER';
export type ProductStatus = 'DEVELOPMENT' | 'TESTING' | 'RELEASED' | 'ALERT';

// 产品列表项 (L3 Matrix 用)
export interface ProductListItem {
    id: string;             // PID
    name: string;           // 产品名称
    icon?: string;          // 自定义图片URL
    category: DeviceType;   // 品类
    protocol: ProtocolType; // 协议
    status: ProductStatus;  // 状态

    // 指标数据
    activeDeviceCount: number; // 激活设备数
    alertCount: number;        // 报警数

    // 版本信息
    latestFirmware?: string;
    lastUpdateTime: number;
}

// 产品详情 (Full Context)
export interface ProductDetail extends ProductListItem {
    description?: string;
    createTime: number;
    currentFirmwareVersion?: string;

    // --- Studio 编辑数据 (可选，因为列表页不需要加载这些) ---
    dps?: DataPoint[];
    metadata?: ProductMetadata;
    hardware?: {
        module: string | null;
        pins: IPinDefinition[];
        resourceAnalysis?: IResourceAnalysis;
    };

    // --- 发布相关 ---
    releaseVersion?: string;
    releaseNote?: string;
    releaseTime?: number;
}

// 搜索筛选参数
export interface ProductQueryParams {
    keyword?: string;
    category?: DeviceType[];
    status?: ProductStatus[];
    protocol?: ProtocolType[];
    page: number;
    pageSize: number;
}