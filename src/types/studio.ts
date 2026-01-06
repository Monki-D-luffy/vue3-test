// src/types/studio.ts

export type DpDataType = 'Boolean' | 'Integer' | 'Enum' | 'String' | 'Json' | 'Raw';
export type DpRwMode = 'rw' | 'ro';

// 核心：功能点定义 (Data Point)
export interface DataPoint {
  id: number | string;
  code: string;
  name: string;
  type: DpDataType;
  mode: DpRwMode;
  desc?: string;
  property: {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    range?: string[];
    maxlen?: number;
  };
  isStandard?: boolean;
}

// Studio 全局状态
export interface StudioState {
  currentStep: number;
  productInfo: any;
  dps: DataPoint[];
  isDirty: boolean;
}

// ==========================================
// 硬件开发相关类型定义 (HAL Layer)
// ==========================================

export type ChipArchitecture = 'RISC-V' | 'Xtensa' | 'ARM' | '8051';
export type ChipSeries = 'Entry' | 'Standard' | 'Performance';

export interface IModule {
  id: string;
  name: string;
  vendor: string;
  architecture: ChipArchitecture;
  series: ChipSeries;
  flashSize: number;
  ramSize: number;
  clockSpeed: number;
  description: string;
  thumbnail?: string;
  recommended?: boolean;
  availablePins: string[];
  pinoutImage?: string;
  datasheetUrl?: string;
  pinoutUrl?: string;
}

export interface IPinAttributes {
  pullMode: 'up' | 'down' | 'none';
  driveStrength: '5mA' | '10mA' | '20mA';
}

/**
 * 引脚配置定义 (BSP Layer)
 * 修正：移除旧的 function/direction 字段，统一使用 peripheral
 */
export interface IPinDefinition {
  id: string;           // 唯一标识 (UUID)
  pin: string;          // 物理引脚名, e.g. "GPIO 5"
  peripheral: string;   // 功能/外设名, e.g. "UART0_TX"
  activeLevel: 'high' | 'low';
  attributes: IPinAttributes;
  description: string;
}

export interface IResourceAnalysis {
  ramUsageKB: number;
  ramPercentage: number;
  flashUsageKB: number;
  flashPercentage: number;
  riskLevel: 'safe' | 'warning' | 'critical';
  details: string[];
}

export type FirmwareSourceType = 'generated' | 'uploaded';

export interface IFirmwareArtifact {
  id: string;
  name: string;
  source: FirmwareSourceType;
  version: string;
  createdAt: number;
  size: number;
  type?: 'debug' | 'release';
  downloadUrl: string;
}