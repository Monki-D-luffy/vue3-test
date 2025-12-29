// src/api/modules/ai.ts
import { getToolsDescription } from '@/utils/aiTools';

// 1. 从环境变量读取配置
const API_KEY = import.meta.env.VITE_AI_API_KEY || '';
const BASE_URL = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com';
const MODEL_NAME = import.meta.env.VITE_AI_MODEL || 'deepseek-chat';

export interface AiMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * 真实的 OpenAI 兼容流式请求
 * 适用于 DeepSeek, Moonshot, ChatGPT 等
 */
async function* realOpenAIStream(prompt: string, context: any): AsyncGenerator<string, void, unknown> {
    if (!API_KEY) throw new Error('NO_API_KEY');

    // 1. 构建包含工具说明的 System Prompt
    const toolsDesc = getToolsDescription();

    const systemPrompt = `
        你是一个专业的物联网(IoT)系统智能专家。
        你正在协助运维人员管理一个大型设备网络。

        【当前页面上下文】:
        ${JSON.stringify(context, null, 2)}

        【可用工具 (Available Tools)】:
        你可以调用以下前端函数来获取更多数据或控制界面。
        如果需要调用工具，请**只返回**如下 JSON 格式的指令，不要包含其他文字：
        {"tool": "工具名称", "args": { ...参数... }}

        ${toolsDesc}

        【回答规则】:
        1. 如果用户的问题可以通过【当前页面上下文】直接回答，请直接回答。
        2. 如果数据不全（例如上下文只有前 100 条，但用户问全局统计），或者需要跳转页面，请返回 JSON 工具指令。
        3. 收到工具运行结果后，请基于结果生成最终回答。
    `.trim();

    // 2. 发起 Fetch 请求
    // 注意：这里直接拼接 /chat/completions，如果你的 BASE_URL 已经包含了，请自行调整
    const url = BASE_URL.endsWith('/') ? `${BASE_URL}chat/completions` : `${BASE_URL}/chat/completions`;
    console.log('🔗 Connecting to AI:', url);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: true, // 开启流式传输
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        if (!response.body) throw new Error('No response body');

        // 3. 处理流式响应 (SSE Parsing)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留未完整的行

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;

                const dataStr = trimmed.slice(6); // 去掉 'data: ' 前缀

                if (dataStr === '[DONE]') return; // 结束标志

                try {
                    const data = JSON.parse(dataStr);
                    // OpenAI 格式: choices[0].delta.content
                    const contentDelta = data.choices?.[0]?.delta?.content;

                    if (contentDelta) {
                        yield contentDelta;
                    }
                } catch (e) {
                    console.warn('AI Stream Parse Error:', e);
                }
            }
        }

    } catch (e: any) {
        console.error('AI Service Error:', e);
        yield `\n\n**[连接失败]** 无法连接到 AI 服务。\n错误信息: ${e.message}`;
    }
}

/**
 * 模拟流式输出 (当没有 Key 或测试时使用)
 */
async function* mockStreamGenerator(prompt: string, context: any): AsyncGenerator<string, void, unknown> {
    await new Promise(r => setTimeout(r, 600));
    const responseText = `[模拟模式] 我收到了你的消息：“${prompt}”。\n当前 context 中有 ${context?.overview?.totalDevices || 0} 台设备。\n\n请在 .env.local 中配置真实的 VITE_AI_API_KEY 来激活我。`;

    const chunkSize = 2;
    for (let i = 0; i < responseText.length; i += chunkSize) {
        yield responseText.slice(i, i + chunkSize);
        await new Promise(r => setTimeout(r, 30));
    }
}

export const aiApi = {
    /**
     * 统一对话接口
     */
    async *chatStream(prompt: string, context: any = {}): AsyncGenerator<string, void, unknown> {
        // 如果环境变量里有 Key，就走真实接口
        if (API_KEY && !API_KEY.includes('YOUR_KEY')) {
            yield* realOpenAIStream(prompt, context);
        } else {
            yield* mockStreamGenerator(prompt, context);
        }
    }
};