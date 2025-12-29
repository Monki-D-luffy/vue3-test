// src/ai/index.ts

// 导出核心 Hook
export { useAiAssistant } from './core/useAiAssistant';
export { useAiContext } from './core/useAiContext';

// 导出业务策略 (按需引入)
export { useDeviceListAi } from './strategies/useDeviceAi';

// 导出类型
export type { AiMessage, AiTool, AiContext } from './types';

// 导出工具函数 (如果外界需要手动生成快照)
export { generateAiSnapshot, generateObjectProfile } from './utils/promptUtils';