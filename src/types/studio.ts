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
  availablePins: string[];
  pinoutImage?: string;     // 引脚图 URL
  datasheetUrl?: string;    //规格书下载链接
  pinoutUrl?: string;       // 引脚定义图 (真实图片链接)
}
/**
 * 引脚高级属性
 */
export interface IPinAttributes {
  pullMode: 'up' | 'down' | 'none'; // 上下拉
  driveStrength: '5mA' | '10mA' | '20mA'; // 驱动能力
}

/**
 * 引脚配置定义 (BSP Layer)
 * 顺序: 引脚 - 功能 - 有效电平 - 其他功能 - 说明
 */
export interface IPinDefinition {
  id: string;           // 唯一标识 (UUID)
  pin: string;          // 物理引脚名, e.g. "GPIO 5"
  peripheral: string;   // 功能/外设名, e.g. "UART0_TX", "PWM_1"
  activeLevel: 'high' | 'low';
  attributes: IPinAttributes; // 其他高级功能
  description: string;  // 说明备注
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

// ==========================================
// 新增：引脚配置与固件上传相关
// ==========================================

export interface IPinDefinition {
  pin: string;        // 物理引脚名, e.g. "GPIO 5", "ADC_1"
  function: string;   // 绑定的功能, e.g. "switch_led", "PWM_Output"
  direction: 'input' | 'output' | 'inout';
  activeLevel: 'high' | 'low'; // 有效电平
  isUsed: boolean;
}


export type FirmwareSourceType = 'generated' | 'uploaded';

export interface IFirmwareArtifact {
  id: string;
  name: string;
  source: FirmwareSourceType; // 区分是生成的还是上传的
  version: string;
  createdAt: number;
  size: number;
  downloadUrl: string;
}