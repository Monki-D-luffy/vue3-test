// src/ai/types.ts

/**
 * 统一的对话消息接口
 * 替代原 aiService.ts 和 api/modules/ai.ts 中的定义
 */
export interface AiMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * AI 工具定义接口
 * 替代原 aiTools.ts 中的定义
 */
export interface AiTool {
    name: string;
    description: string;
    parameters?: string; // JSON Schema 描述字符串
    execute: (args: any) => Promise<any>;
}

/**
 * AI 上下文结构
 */
export interface AiContext {
    system?: any;      // 系统级信息 (时间、环境、操作员)
    activeView?: any;  // 当前页面数据快照
    toolExecutionResult?: any; // 工具执行结果 (用于回传给 AI)
    [key: string]: any;
}