// src/ai/core/llm.ts
import { aiApi } from '../api';
import { getToolsDescription } from '../tools';
import type { AiMessage, AiContext } from '../types';

/**
 * 构建发送给 LLM 的完整 Prompt
 * 包含：System Persona + Context + Tool Definitions + History
 */
export function buildAgentPrompt(
    messages: AiMessage[],
    context: AiContext
): string {
    // 1. 工具描述
    const toolsDesc = getToolsDescription();

    // 2. 上下文数据 (将对象扁平化为可读字符串)
    const contextStr = JSON.stringify(context, null, 2);

    // 3. System Prompt (核心指令)
    const systemPrompt = `
[Role Definition]
You are an intelligent IoT System Agent. You manage a device management platform.
Your goal is to assist users by ANALYZING data and EXECUTING actions via tools.

[Current Context]
${contextStr}

[Available Tools]
${toolsDesc}

[Protocol]
1. THINK: Analyze the user's request and current context.
2. ACTION: If you need data or need to perform an action, output a JSON tool command.
   Format: {"tool": "tool_name", "args": { ... }}
   - DO NOT output anything else when calling a tool.
3. OBSERVE: You will receive the tool's output in the next turn.
4. FINAL ANSWER: If you have enough info, answer the user in friendly Chinese.
`.trim();

    // 4. 拼接历史消息
    // 注意：由于我们使用的是流式单接口，这里我们需要手动把 history 拼成一个长 Prompt 
    // 或者，如果你的 aiApi 支持 messages 数组，可以直接传数组。
    // 这里假设我们为了兼容性，仍然采用 "System + User/Assistant History" 的文本拼接方式，
    // 或者让 aiApi 内部去处理 messages 数组。

    // 为了适配之前的 aiApi.chatStream (它接受 prompt 字符串)，
    // 我们这里做一个简化的处理：只取最后一条用户消息，配合 System Prompt。
    // *高级版*：应该修改 aiApi 支持传入完整 messages 数组。

    // 临时策略：构建一个包含上下文的 Prompt
    // 找到最后一条用户消息
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';

    return `${systemPrompt}\n\n[User Request]: ${lastUserMsg}`;
}

/**
 * Agent 专用的 LLM 调用接口
 */
export async function* streamLlmResponse(
    prompt: string,
    context: AiContext
) {
    // 复用底层的流式 API
    const stream = aiApi.chatStream(prompt, context);
    for await (const chunk of stream) {
        yield chunk;
    }
}