// src/types/studio.ts

// DP 数据类型枚举
export type DpDataType = 'Boolean' | 'Integer' | 'Enum' | 'String' | 'Json';

// DP 读写模式
export type DpRwMode = 'rw' | 'ro'; // rw=下发和上报, ro=只上报

// 核心：功能点定义 (Data Point)
export interface DataPoint {
  id: number;           // DP ID (e.g., 1, 101)
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