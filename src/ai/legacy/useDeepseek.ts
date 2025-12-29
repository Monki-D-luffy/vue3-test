// src/ai/legacy/useDeepseek.ts
import { ref } from 'vue';
import { aiApi } from '../api'; // ✅ 相对路径引用上层 API

export function useDeepseek() {
    const loading = ref(false);
    const result = ref('');
    const error = ref<string | null>(null);

    /**
     * 执行 AI 指令 (适配 DeepSeek)
     * @param prompt 用户输入
     * @param mode 模式：'chat' | 'diagnosis'
     */
    const askAI = async (prompt: string, mode: 'chat' | 'diagnosis' = 'chat') => {
        if (!prompt.trim()) return;

        loading.value = true;
        error.value = null;
        result.value = '';

        try {
            // 1. 注入系统提示词
            let fullPrompt = prompt;
            if (mode === 'diagnosis') {
                fullPrompt = `(System: 你是一个资深的工业物联网维护专家。请简明扼要地分析日志，使用Markdown格式，列出可能的故障原因和解决方案。) \nUser: ${prompt}`;
            } else {
                fullPrompt = `(System: 你是一个智能中控助手。请用简短的中文回复。) \nUser: ${prompt}`;
            }

            // 2. 调用流式接口
            const stream = aiApi.chatStream(fullPrompt, { source: 'QuickAction' });

            // 3. 实时响应
            for await (const chunk of stream) {
                result.value += chunk;
            }

        } catch (e: any) {
            console.error('AI Error:', e);
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