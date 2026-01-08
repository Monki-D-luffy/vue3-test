// src/types/automation.ts

// --- 基础枚举 ---

// 触发源类型
export type TriggerType = 'device_dp' | 'timer' | 'weather' | 'manual';

// 动作类型
export type ActionType = 'device_write' | 'delay' | 'notify' | 'scene_trigger';

// 逻辑门 (后续用于 TriggerGroup)
export type LogicType = 'AND' | 'OR';

// --- 核心接口 ---

// 触发器实体
export interface SceneTrigger {
    id: string;
    type: TriggerType;
    // 用于 UI 展示的简述 (如: "客厅灯 打开")
    displayText: string;
    // 具体配置参数 (针对不同类型有不同结构，使用 Record<string, any> 保持灵活性)
    params: {
        deviceId?: string;
        dpId?: string;
        operator?: string; // >, <, ==
        value?: any;
        cron?: string; // 定时任务表达式
        [key: string]: any;
    };
}

// 动作实体
export interface SceneAction {
    id: string;
    type: ActionType;
    displayText: string;
    params: {
        targetDeviceId?: string;
        dpId?: string;
        value?: any;
        delaySeconds?: number;
        message?: string; // 通知内容
        [key: string]: any;
    };
}

// 场景规则 (主实体)
export interface SceneRule {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    matchType: LogicType; // 满足所有条件 vs 满足任一条件
    icon?: string; // UI 展示用图标
    color?: string; // UI 展示用颜色主题
    lastTriggered?: string; // ISO Date String

    triggers: SceneTrigger[];
    actions: SceneAction[];
}