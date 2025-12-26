// src/composables/useAiAssistant.ts
import { ref } from 'vue';
import { aiApi, type AiMessage } from '@/api/modules/ai';

export function useAiAssistant() {
    const messages = ref<AiMessage[]>([
        {
            role: 'assistant',
            content: '你好！我是全局智能助手。点击右下角悬浮窗或在 Dashboard 中输入指令，我随时为您服务。'
        }
    ]);

    const isTyping = ref(false);

    /**
     * 发送消息
     * @param userText 用户输入的文本
     * @param contextGetter 一个异步函数，用于获取当前页面的“上下文数据”
     */
    const ask = async (userText: string, contextGetter?: () => Promise<any>) => {
        if (!userText.trim() || isTyping.value) return;

        // 1. 用户消息上屏
        messages.value.push({ role: 'user', content: userText });
        isTyping.value = true;

        // 2. 准备 AI 消息占位
        const aiMsgIndex = messages.value.push({ role: 'assistant', content: '' }) - 1;
        const currentMsg = messages.value[aiMsgIndex];

        try {
            // 3. 动态获取上下文 (Dependency Injection)
            // 如果没传 getter，就给一个空对象
            const context = contextGetter ? await contextGetter() : {};

            // 4. 调用流式 API
            const stream = aiApi.chatStream(userText, context);

            for await (const chunk of stream) {
                if (currentMsg)
                    currentMsg.content += chunk;
            }

        } catch (err) {
            console.error('AI Error:', err);
            if (currentMsg)
                currentMsg.content += "\n[系统错误] AI 服务暂时不可用。";
        } finally {
            isTyping.value = false;
        }
    };

    /**
     * 清空对话
     */
    const clearChat = () => {
        messages.value = [{
            role: 'assistant',
            content: '对话已清空。您可以开始新的提问。'
        }];
    };

    return {
        messages,
        isTyping,
        ask,
        clearChat
    };
}