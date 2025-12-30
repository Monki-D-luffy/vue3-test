// src/types/product.ts

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
    // 这里可以扩展 dashboardConfig, dpList 等复杂字段
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