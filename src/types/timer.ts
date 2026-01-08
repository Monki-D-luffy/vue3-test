// src/types/timer.ts

// --- 基础定义 ---
export type RepeatType = 'once' | 'daily' | 'workday' | 'weekend' | 'custom';

export interface TimeTarget {
    hour: number;
    minute: number;
    repeat: RepeatType;
    weeks: number[]; // [1, 2, 3, 4, 5, 6, 0] (0 is Sunday)
    cron?: string;   // 自动生成的 Cron 表达式 (仅展示用)
}

// --- 左侧：策略配置 (白名单) ---
export interface TimerActionDef {
    dpId: number;
    code: string;
    name: string;
    type: string; // 'bool', 'enum', 'value'
    mode: 'rw' | 'ro';
    selected: boolean; // 是否允许定时
    alias?: string;    // App 端显示的名称 (如 "自动开启")
}

// --- 右侧：沙盒模拟任务 ---
export interface MockAction {
    dpId: number;
    code: string;
    value: any;
}

// 右侧：定时任务
export interface MockTimerTask {
    id: number;
    enabled: boolean;
    isExpanded: boolean;
    target: TimeTarget;
    actions: MockAction[]; // 一个定时器可以触发多个动作
    isNew?: boolean;
}

// --- 最终存入 Store 的配置结构 ---
export interface TimerConfig {
    enabled: boolean;
    actions: TimerActionDef[]; // 白名单
    // maxSchedules 已移除
}