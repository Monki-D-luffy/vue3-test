// src/types/index.ts

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
    productName?: string; //以此类推
    sn: string;
    gmtActive: string;     // 建议保持后端传回的字符串格式
    gmtLastOnline: string;
    isBound: boolean;
    dataCenter: string;
    hasNewFirmware?: boolean;
}

// 列表筛选参数接口
export interface DeviceListFilters {
    isBound?: string;
    productId?: string;
    dateRange?: [Date, Date] | null; // Element Plus DatePicker 返回的是 Date 对象数组
    keyword?: string;
    dataCenter?: string;
}

// 常量定义：避免魔术字符串
export const STORAGE_KEYS = {
    TOKEN: 'authToken'
} as const;

// ---产品与固件相关类型 ---

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
    verified?: boolean; // 验证状态
}

export interface FirmwareUploadData {
    version: string;
    productId: string;
    releaseNotes: string;
}
export interface ApiResponse<T> {
    code: number
    message: string
    success: boolean
    data: T
}


export interface Firmware {
    id: string
    version: string
    productId: string
    productName: string;
    releaseNotes: string
    fileUrl: string
    uploadedAt: string
    // ✨ [修复] 补全 verified 属性，用于标记固件是否已验证通过
    verified?: boolean
}

export interface FirmwareUploadData {
    version: string
    productId: string
    releaseNotes: string
}

export type UpgradeTaskStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed' | 'idle'

export interface UpgradeTask {
    id: string
    deviceId: string // 注意：mock-server 中的结构可能需要适配
    deviceName?: string
    firmwareId: string
    firmwareVersion: string
    status: UpgradeTaskStatus
    progress: number
    errorMessage: string | null
    startedAt: string
    finishedAt: string | null
}

export interface PaginationParams {
    _page: number
    _limit: number
    [key: string]: any
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
}


// 通用分页响应结构 (可选，建议加上)
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
}