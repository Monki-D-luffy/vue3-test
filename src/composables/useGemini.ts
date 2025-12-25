import { ref } from 'vue';
import { aiApi } from '@/api/modules/ai';

// 预设的 Mock 回复（当没有 API Key 时使用）
const MOCK_RESPONSES: Record<string, string> = {
    'default': `**系统诊断报告**\n\n经过对全域节点的扫描，系统运行状态**良好**。\n\n* **网络延迟**: 12ms (优)\n* **异常节点**: 0\n* **建议**: 暂无维护建议，请继续保持监控。`,
    'diagnosis': `### ⚠️ 异常日志分析\n\n针对设备 **[Sensor-A01]** 的高温告警，分析如下：\n\n1.  **散热受阻**: 设备可能被异物覆盖。\n2.  **传感器漂移**: 建议执行 \`calib --temp\` 指令校准。\n3.  **环境因素**: 当前环境温度可能确实过高。\n\n建议立即派遣巡检员前往 **Zone-B** 区域核查。`
};

export function useGemini() {
    const loading = ref(false);
    const result = ref('');
    const error = ref<string | null>(null);

    /**
     * 模拟打字机效果 (Typewriter Effect)
     * 让文字一个字一个字蹦出来，增加科技感
     */
    const streamText = async (text: string) => {
        result.value = '';
        const chars = text.split('');
        // 动态调整打字速度：长文本快一点，短文本慢一点
        const speed = chars.length > 100 ? 10 : 30;

        for (const char of chars) {
            result.value += char;
            // 使用 Promise 延迟来阻塞循环
            await new Promise(r => setTimeout(r, speed));
        }
    };

    /**
     * 执行 AI 指令
     * @param prompt 用户输入
     * @param mode 模式：'chat' | 'diagnosis'
     */
    const askAI = async (prompt: string, mode: 'chat' | 'diagnosis' = 'chat') => {
        if (!prompt.trim()) return;

        loading.value = true;
        error.value = null;
        result.value = ''; // 清空上一条

        try {
            // 1. 尝试调用真实 API
            let rawText = '';
            try {
                // 系统提示词注入 (System Prompt Injection)
                const systemPrompt = mode === 'diagnosis'
                    ? '你是一个资深的工业物联网维护专家。请简明扼要地分析日志，使用Markdown格式（列表、加粗）。'
                    : '你是一个智能中控助手。请用简短的中文回复，模拟执行用户的指令。';

                rawText = await aiApi.generateContent(`${systemPrompt}\nUser: ${prompt}`);
            } catch (e: any) {
                // 2. 智能降级：如果没 Key，使用 Mock 数据
                if (e.message === 'NO_API_KEY' || e.message === 'Failed to fetch') {
                    console.warn('Gemini API不可用，切换至演示模式');
                    // 模拟网络延迟
                    await new Promise(r => setTimeout(r, 1500));
                    rawText = (mode === 'diagnosis' ? MOCK_RESPONSES['diagnosis'] : MOCK_RESPONSES['default']) ?? '';
                } else {
                    throw e;
                }
            }

            // 3. 开始打字机输出
            await streamText(rawText);

        } catch (e: any) {
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