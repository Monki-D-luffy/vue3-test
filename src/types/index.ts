// src/types/index.ts

// ==========================================
// 1. 基础实体 (User, Device)
// ==========================================

// 用户信息
export interface UserInfo {
    userId: string;
    nickname: string;
    email: string;
    avatar?: string;
}

// 设备对象
export interface Device {
    id: string;
    name: string;
    status: '在线' | '离线' | '故障' | '未激活' | '升级中';
    firmwareVersion: string;
    puuid: string;
    productId: string;
    productName?: string;
    sn: string;
    gmtActive: string;     // ISO 8601 字符串
    gmtLastOnline: string; // ISO 8601 字符串
    isBound: boolean;
    dataCenter: string;
    hasNewFirmware?: boolean;
}

// ==========================================
// 2. 筛选与参数 (Filters, Params)
// ==========================================

// 设备列表筛选参数
export interface DeviceListFilters {
    isBound?: string;
    productId?: string;
    dateRange?: [Date, Date] | null; // Element Plus 返回的是 Date 对象数组
    keyword?: string;
    dataCenter?: string;
}

// 通用分页请求参数
export interface PaginationParams {
    _page: number;
    _limit: number;
    [key: string]: any; // 允许额外的过滤字段
}

// ==========================================
// 3. 产品与固件 (Product, Firmware)
// ==========================================

export interface Product {
    id: string;
    name: string;
    type: string;
}

export interface Firmware {
    id: string;
    version: string;
    productId: string;
    productName: string;
    releaseNotes: string;
    fileUrl: string;
    uploadedAt: string;
    // 标记固件是否已验证通过
    verified?: boolean;
}

export interface FirmwareUploadData {
    version: string;
    productId: string;
    releaseNotes: string;
}

// ==========================================
// 4. 升级任务 (Upgrade Tasks)
// ==========================================

export type UpgradeTaskStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed' | 'idle';

export interface UpgradeTask {
    id: string;
    deviceId: string;
    deviceName?: string;
    firmwareId: string;
    firmwareVersion: string;
    status: UpgradeTaskStatus;
    progress: number;
    errorMessage: string | null;
    startedAt: string;
    finishedAt: string | null;
    // 批量任务特有字段
    targetScope?: 'all' | 'filter';
    successCount?: number;
    totalCount?: number;
}

// ==========================================
// 5. API 响应结构 (Responses)
// ==========================================

// 通用 API 响应
export interface ApiResponse<T> {
    code: number;
    message: string;
    success: boolean;
    data: T;
    total?: number;
}

// 分页响应结构
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
}

// ==========================================
// 6. 常量 (Constants)
// ==========================================

export const STORAGE_KEYS = {
    TOKEN: 'authToken'
} as const;