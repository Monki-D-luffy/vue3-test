import { ref } from 'vue';
// ✅ 修复导入路径：指向新的 AI 模块 API
import { aiApi } from '@/ai/api';

export function useGemini() {
    const loading = ref(false);
    const result = ref('');
    const error = ref<string | null>(null);

    /**
     * 执行 AI 指令
     * 现在直接复用 src/ai/api.ts 中的 DeepSeek 流式能力
     * @param prompt 用户输入
     * @param mode 模式：'chat' | 'diagnosis'
     */
    const askAI = async (prompt: string, mode: 'chat' | 'diagnosis' = 'chat') => {
        if (!prompt.trim()) return;

        loading.value = true;
        error.value = null;
        result.value = ''; // 清空上一条

        try {
            // 1. 简易的 Prompt 增强 (System Prompt Injection)
            // 根据模式注入不同的“人设”指令
            let fullPrompt = prompt;
            if (mode === 'diagnosis') {
                fullPrompt = `(System: 你是一个资深的工业物联网维护专家。请简明扼要地分析日志，使用Markdown格式，列出可能的故障原因和解决方案。) \nUser: ${prompt}`;
            } else {
                fullPrompt = `(System: 你是一个智能中控助手。请用简短的中文回复。) \nUser: ${prompt}`;
            }

            // 2. 调用新的统一流式接口
            // 注意：这里我们传入一个空的 context 对象，因为 useGemini 通常用于独立的小组件
            const stream = aiApi.chatStream(fullPrompt, { source: 'QuickAction' });

            // 3. 实时处理流式响应 (不再需要手写的“打字机”效果，流本身就是逐字出来的)
            for await (const chunk of stream) {
                result.value += chunk;
            }

        } catch (e: any) {
            console.error('Gemini/DeepSeek Error:', e);
            error.value = e.message || 'AI 服务暂时不可用';
            result.value = '🔌 连接中断：无法触达神经网络中心。';
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        result,
        error,
        askAI
    };
}