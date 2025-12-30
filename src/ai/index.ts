// src/ai/index.ts

// 导出核心 Hook
export { useAiAssistant } from './core/useAiAssistant';
export { useAiContext } from './core/useAiContext';
export { useAgent } from './core/agent';

import AiChatPanel from './components/AiChatPanel.vue';
export { AiChatPanel };

// 导出业务策略 (按需引入)
export { useDeviceListAi } from './strategies/useDeviceAi';

// 导出类型
export type { AiMessage, AiTool, AiContext } from './types';

// 导出工具函数 (如果外界需要手动生成快照)
export { generateAiSnapshot, generateObjectProfile } from './utils/promptUtils';

// ✅ 导出轻量级兼容模块
export { useDeepseek } from './legacy/useDeepseek';