// src/utils/aiService.ts

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * 模拟 AI 的回复逻辑 (Mock Strategy)
 * 用于演示 UI 交互和流式输出效果
 */
const mockChat = async (
    prompt: string,
    contextStr: string,
    onStream: (chunk: string) => void
) => {
    // 1. 解析上下文 (为了获取真实的数据快照)
    let context: any = {};
    try {
        context = JSON.parse(contextStr);
    } catch (e) {
        console.warn('AI Service: Context parse failed', e);
    }

    const { backendReport, currentView } = context;

    // 2. 模拟网络延迟 (0.5秒 - 1.5秒)
    const thinkingTime = 600 + Math.random() * 800;
    await new Promise(r => setTimeout(r, thinkingTime));

    // 3. 关键词匹配逻辑 (规则引擎)
    let responseText = '';

    // 这里的关键词对应 mock-server 返回的数据
    const isAskingStatus = /在线|离线|状态|online|offline/i.test(prompt);
    const isAskingAlert = /告警|异常|错误|故障|alert|error/i.test(prompt);
    const isAskingSuggestion = /建议|分析|怎么|如何|help/i.test(prompt);

    if (isAskingStatus) {
        const rate = backendReport?.statistics?.onlineRate || '92.4%';
        responseText = `### 📊 系统状态分析 (演示)\n\n` +
            `根据全量数据快照，当前系统在线率为 **${rate}**。\n\n` +
            `* **总设备数**: ${backendReport?.statistics?.totalDevices || 2542}\n` +
            `* **离线设备**: 约 185 台\n` +
            `\n主要离线设备集中在 **Zone-B** 区域。这可能与该区域的网络波动有关。`;
    }
    else if (isAskingAlert) {
        const topIssue = backendReport?.topIssues?.[0];
        responseText = `### ⚠️ 告警诊断报告 (演示)\n\n` +
            `审计发现最近 7 天共有 **${backendReport?.statistics?.criticalAlerts || 3}** 次严重告警。\n\n` +
            `**最频繁的问题**: ${topIssue?.issue || '高温异常'}\n` +
            `**受影响区域**: ${topIssue?.primaryZone || 'Zone-B'}\n\n` +
            `> 建议：检查该区域传感器散热情况，或通过固件升级修复误报问题。`;
    }
    else if (isAskingSuggestion) {
        responseText = `### 💡 运维建议 (演示)\n\n` +
            `基于当前系统画像，我有以下建议：\n` +
            `1.  **固件升级**: 仍有 500+ 台设备运行在旧版 v1.0，建议尽快安排批量升级。\n` +
            `2.  **错峰维护**: 您的高频操作时间集中在 ${backendReport?.usagePattern?.peakLoginTime || '09:00'}，请避免在此期间重启核心网关。`;
    }
    else {
        // 🚨 诚实的兜底回答 🚨
        responseText = `🔴 **[未接入真实 AI]**\n\n` +
            `抱歉，我目前只是一个前端演示模块，没有连接到 DeepSeek 或 ChatGPT 大模型，无法理解复杂语义。\n\n` +
            `**您可以尝试输入以下关键词来测试演示效果：**\n` +
            `* "查看在线率"` +
            `\n* "分析最近的告警"` +
            `\n* "给出运维建议"`;
    }

    // 4. 模拟流式输出
    const chunkSize = 3; // 每次吐出3个字
    for (let i = 0; i < responseText.length; i += chunkSize) {
        const chunk = responseText.slice(i, i + chunkSize);
        onStream(chunk);
        await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
    }
};

/**
 * 发送 AI 消息
 */
export const sendAiMessage = async (
    prompt: string,
    contextStr: string,
    onStream: (chunk: string) => void
) => {
    // 可以在这里配置真实的 API Key
    // const API_KEY = import.meta.env.VITE_AI_API_KEY;
    // if (API_KEY) { ... callRealApi ... }

    await mockChat(prompt, contextStr, onStream);
};