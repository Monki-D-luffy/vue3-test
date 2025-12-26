import { ref } from 'vue';
import { sendAiMessage, type ChatMessage } from '@/utils/aiService';
import { useExpDashboard } from '@/composables/useExpDashboard';

export function useAiAssistant() {
    // 聊天记录列表
    const messages = ref<ChatMessage[]>([
        {
            role: 'assistant',
            content: '你好！我是您的 IoT 智能分析师。我已经连接到系统后台，您可以问我任何关于设备状态、故障趋势或运维建议的问题。'
        }
    ]);

    const isTyping = ref(false); // 是否正在输出中

    // 获取 Dashboard 的数据获取能力
    const { getAnalysisContext } = useExpDashboard();

    /**
     * 发送问题
     * @param userText 用户输入的文本
     */
    const ask = async (userText: string) => {
        if (!userText.trim() || isTyping.value) return;

        // 1. 立即上屏用户消息
        messages.value.push({ role: 'user', content: userText });
        isTyping.value = true;

        // 2. 预先放入一条空的 AI 消息，用于接收流式数据
        const aiMsgIndex = messages.value.push({ role: 'assistant', content: '' }) - 1;
        const currentMsg = messages.value[aiMsgIndex];
        try {
            // 3. 关键步骤：获取“全量数据体检报告”
            // 这会调用后端 API，并结合当前页面状态
            const contextSnapshot = await getAnalysisContext();

            // 4. 调用 AI 服务
            await sendAiMessage(
                userText,
                contextSnapshot,
                (chunk) => {
                    // 5. 实时更新 UI：将新字符追加到最后一条消息中

                    if (currentMsg) {
                        currentMsg.content += chunk;
                    }
                }
            );
        } catch (err) {
            console.error('AI Error:', err);
            if (currentMsg)
                currentMsg.content += "\n[系统错误] 无法连接到 AI 分析服务，请检查网络。";
        } finally {
            isTyping.value = false;
        }
    };

    /**
     * 清空上下文/重置对话
     */
    const clearChat = () => {
        messages.value = [{
            role: 'assistant',
            content: '对话已重置。我已重新同步最新的系统数据，随时待命。'
        }];
    };

    return {
        messages,
        isTyping,
        ask,
        clearChat
    };
}