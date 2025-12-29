// src/ai/core/useAiAssistant.ts
import { ref } from 'vue';
import { aiApi } from '../api';
import { toolsRegistry } from '../tools';
import type { AiMessage } from '../types';

export function useAiAssistant() {
    const messages = ref<AiMessage[]>([
        {
            role: 'assistant',
            content: '你好！我是全局智能助手。我可以帮您分析数据，甚至帮您操作页面。'
        }
    ]);

    const isTyping = ref(false);

    /**
     * 核心对话逻辑 (支持递归调用)
     * @param userText 用户输入
     * @param contextGetter 上下文获取器
     * @param toolResult 如果是工具执行后的回调，会传入结果
     */
    const ask = async (userText: string, contextGetter?: () => Promise<any>, toolResult?: any) => {
        // 如果是工具回调，不需要用户重复输入，也不需要重新 push 用户消息
        if (!toolResult) {
            if (!userText.trim() || isTyping.value) return;
            messages.value.push({ role: 'user', content: userText });
        }

        isTyping.value = true;

        // 准备 AI 消息占位
        const aiMsgIndex = messages.value.push({ role: 'assistant', content: '' }) - 1;
        const currentMsg = messages.value[aiMsgIndex];

        try {
            // 获取上下文
            const context = contextGetter ? await contextGetter() : {};

            // 如果有工具结果，把它拼接到上下文里，告诉 AI 这是它刚才干活的结果
            if (toolResult) {
                context['toolExecutionResult'] = toolResult;
            }

            // 发送请求
            // 如果是工具回调，我们将 userText 设为空或特定提示，引导 AI 总结
            const promptToSend = toolResult
                ? `(System: Tool executed. Result provided in context. Please summarize for user.)`
                : userText;

            const stream = aiApi.chatStream(promptToSend, context);

            let fullResponse = '';

            for await (const chunk of stream) {
                fullResponse += chunk;
                // 实时上屏
                if (currentMsg)
                    currentMsg.content = fullResponse;
            }

            // --- 🧠 核心：判断是否触发了工具调用 ---
            // 尝试解析 JSON (简单的正则匹配，防止 AI 加了 Markdown 代码块)
            const jsonMatch = fullResponse.match(/\{[\s\S]*"tool"[\s\S]*\}/);

            if (jsonMatch) {
                try {
                    const command = JSON.parse(jsonMatch[0]);

                    // 🔍 获取工具
                    const tool = toolsRegistry[command.tool];

                    if (command.tool && tool) {
                        // 1. 识别到工具，通知用户
                        if (currentMsg)
                            currentMsg.content = `🔄 正在执行操作: ${tool.name}...`;

                        // 2. 执行工具
                        console.log(`[AI Agent] Executing ${tool.name} with args:`, command.args);

                        const result = await tool.execute?.(command.args || {});

                        // 3. 将结果展示给用户 (可选，或者直接让 AI 总结)
                        // 这里我们移除刚才那个 "正在执行..." 的消息，或者保留它作为历史记录取决于 UI 偏好
                        // 暂时策略：移除它，让 AI 的新回答作为最新消息
                        messages.value.pop();

                        // 🔄 递归调用 ask，把结果喂回去
                        await ask('', contextGetter, result);
                    } else {
                        console.warn(`[AI Agent] AI tried to call unknown tool: ${command.tool}`);
                    }
                } catch (e) {
                    console.warn('AI 尝试调用工具但 JSON 解析失败', e);
                }
            }

        } catch (err) {
            console.error('AI Error:', err);
            if (currentMsg)
                currentMsg.content += "\n[系统错误] AI 服务暂时不可用。";
        } finally {
            // 只有在没有递归调用时才结束 Loading
            if (!toolResult) isTyping.value = false;
        }
    };

    const clearChat = () => {
        messages.value = [{ role: 'assistant', content: '对话已清空。' }];
    };

    return {
        messages,
        isTyping,
        ask,
        clearChat
    };
}