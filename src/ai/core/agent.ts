// src/ai/core/agent.ts
import { ref, reactive } from 'vue';
import { streamLlmResponse, buildAgentPrompt } from './llm';
import { toolsRegistry } from '../tools';
import type { AiMessage, AiContext } from '../types';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'replying' | 'error';

export function useAgent() {
    const messages = ref<AiMessage[]>([]);
    const status = ref<AgentStatus>('idle');
    const currentTool = ref<string | null>(null);

    /**
     * 核心 ReAct 循环
     * @param userText 用户输入
     * @param contextGetter 上下文获取函数
     */
    const execute = async (userText: string, contextGetter: () => Promise<AiContext>) => {
        if (!userText.trim()) return;

        // 1. 初始化
        messages.value.push({ role: 'user', content: userText });
        status.value = 'thinking';
        let loopCount = 0;
        const MAX_LOOPS = 5; // 防止死循环

        try {
            // 获取一次上下文 (在整个会话周期内可能需要刷新，这里简化为开头获取)
            let context = await contextGetter();

            // ♾️ 进入思考循环
            while (loopCount < MAX_LOOPS) {
                // A. 准备 Prompt
                // 注意：在循环中，我们需要把“上一步工具的结果”也喂给 AI
                // 这里我们简化处理：如果是循环的第 2+ 次，prompt 会包含工具结果

                // 构建当前轮次的 Prompt (这里逻辑稍微复杂，为了保持代码简单，
                // 我们假设 streamLlmResponse 会处理好 system prompt，我们只传当前需要关注的内容)
                // 在真实 Agent 中，通常会维护一个完整的 Messages Window。

                const promptToSend = loopCount === 0
                    ? buildAgentPrompt(messages.value, context) // 第一轮：带完整 System Prompt
                    : `(System: Tool executed. Result: ${JSON.stringify(context.toolResult)}. Please analyze and answer.)`;

                // B. 调用 LLM
                const stream = streamLlmResponse(promptToSend, context);

                // 占位消息
                const msgIndex = messages.value.push({ role: 'assistant', content: '' }) - 1;
                let fullResponse = '';
                status.value = 'replying';

                for await (const chunk of stream) {
                    fullResponse += chunk;
                    if (messages.value[msgIndex]) {
                        messages.value[msgIndex].content = fullResponse;
                    }
                }

                // C. 解析工具调用
                // 尝试匹配 JSON: {"tool": "...", "args": ...}
                // 使用非贪婪匹配找到第一个 JSON 对象
                const jsonMatch = fullResponse.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);

                if (jsonMatch) {
                    try {
                        const command = JSON.parse(jsonMatch[0]);
                        const toolName = command.tool;
                        const toolDef = toolsRegistry[toolName];

                        if (toolDef) {
                            // D. 执行工具
                            status.value = 'executing';
                            currentTool.value = toolDef.description;
                            if (messages.value[msgIndex])
                                messages.value[msgIndex].content += `\n\n> ⚙️ 调用工具: **${toolName}**...`;

                            console.log(`[Agent] Executing ${toolName}`, command.args);
                            const result = await toolDef.execute(command.args);

                            // E. 记录结果并进入下一轮
                            // 将结果存入 context，供下一轮 prompt 使用
                            context = { ...context, toolResult: result.data };

                            // 显示工具结果 (可选，或者作为 system 消息隐藏)
                            messages.value.push({
                                role: 'system',
                                content: `[Tool Output]: ${JSON.stringify(result.data)}`
                            });

                            loopCount++;
                            continue; // 🔄 再次循环，让 AI 解释结果
                        }
                    } catch (e) {
                        console.warn('Tool JSON parse error', e);
                    }
                }

                // 如果没有工具调用，说明 AI 已经输出了最终回答
                break;
            }

        } catch (e) {
            console.error('Agent Loop Error:', e);
            messages.value.push({ role: 'assistant', content: '抱歉，我遇到了一些系统错误。' });
            status.value = 'error';
        } finally {
            status.value = 'idle';
            currentTool.value = null;
        }
    };

    const clear = () => messages.value = [];

    return {
        messages,
        status,
        currentTool,
        execute,
        clear
    };
}