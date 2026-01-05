// src/types/studio.ts

// DP 数据类型枚举
export type DpDataType = 'Boolean' | 'Integer' | 'Enum' | 'String' | 'Json' | 'Raw';

// DP 读写模式
export type DpRwMode = 'rw' | 'ro'; // rw=下发和上报, ro=只上报

// 核心：功能点定义 (Data Point)
export interface DataPoint {
  id: number | string;           // DP ID (e.g., 1, 101)
  code: string;         // 标识符 (e.g., "switch_led")
  name: string;         // 功能名称 (e.g., "开关")
  type: DpDataType;     // 数据类型
  mode: DpRwMode;       // 传输模式
  desc?: string;        // 备注
  // 类型详情定义 (根据 type 不同而不同)
  property: {
    min?: number;       // Integer
    max?: number;       // Integer
    step?: number;      // Integer
    unit?: string;      // Integer
    range?: string[];   // Enum (e.g., ["low", "mid", "high"])
    maxlen?: number;    // String
  };
  isStandard?: boolean; // 是否为标准功能 (Tuya 概念: 标准 vs 自定义)
}

// Studio 全局状态
export interface StudioState {
  currentStep: number;
  productInfo: any; // 简化的产品信息
  dps: DataPoint[]; // 功能点列表
  isDirty: boolean; // 是否有未保存的修改
}
// ==========================================
// 新增：硬件开发相关类型定义
// ==========================================

export type ChipArchitecture = 'RISC-V' | 'Xtensa' | 'ARM' | '8051';
export type ChipSeries = 'Entry' | 'Standard' | 'Performance';

/**
 * 硬件模组定义 (物理实体)
 */
export interface IModule {
  id: string;
  name: string;             // 例如: "ESP32-C3-MINI"
  vendor: string;           // 例如: "Espressif"
  architecture: ChipArchitecture;
  series: ChipSeries;       // 用于UI上的标签分类
  flashSize: number;        // 单位: MB
  ramSize: number;          // 单位: KB
  clockSpeed: number;       // 单位: MHz
  description: string;
  thumbnail?: string;       // 芯片图片URL
  recommended?: boolean;    // 是否为推荐模组
}

/**
 * 资源评估报告 (软硬碰撞结果)
 * 用于驱动 UI 上的 "液压管" 进度条
 */
export interface IResourceAnalysis {
  ramUsageKB: number;       // 预估 RAM 占用 (KB)
  ramPercentage: number;    // RAM 占用百分比 (0-100)
  flashUsageKB: number;     // 预估 Flash 占用 (KB)
  flashPercentage: number;  // Flash 占用百分比 (0-100)
  riskLevel: 'safe' | 'warning' | 'critical'; // 风险等级
  details: string[];        // 具体的分析日志，例如 "DP数量过多导致内存吃紧"
}

/**
 * 交付产物定义
 */
export interface IFirmwareArtifact {
  id: string;
  version: string;          // e.g. "1.0.0-build.20231027"
  createdAt: number;        // Timestamp
  size: number;             // Bytes
  type: 'debug' | 'release';
  downloadUrl: string;      // 模拟的下载链接
}