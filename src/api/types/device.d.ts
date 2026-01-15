// src/api/types/device.d.ts

// 1. 设备实体 (对应 DevicesInfoDTO)
export interface DeviceModel {
    uuid: string;         // 核心 ID
    productName: string;
    productId: string;
    bindStatus: number;   // 0=未绑定, 1=已绑定
    onlineStatus: number; // 0=离线, 1=在线
    lastSeen?: string;    // ISO 时间字符串
    createAt: string;
    country: string;      // "CN", "GLOBAL" 等
}

// 2. 查询参数 (对应 DevicesQueryRequest)
export interface DeviceQueryParams {
    country?: string;
    uuid?: string;
    productId?: string;

    // 上位机逻辑：C# 中用 0/1 查状态，前端需转换
    onlineStatus?: number;
    bindStatus?: number;

    startTime?: string;
    endTime?: string;

    // ⚠️ 关键：上位机 ViewModels 默认 PageIndex = 1
    pageIndex: number;
    pageSize: number;
}