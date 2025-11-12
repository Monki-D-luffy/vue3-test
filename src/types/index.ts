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