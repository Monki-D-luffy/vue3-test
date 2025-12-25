import request from '@/utils/request';

// 定义 Gemini API 的精简接口契约
export interface GeminiRequest {
    contents: Array<{
        parts: Array<{ text: string }>
    }>;
}

export interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text: string }>
        }
    }>;
    error?: {
        message: string;
    }
}

// ⚠️ 注意：实际项目中建议通过后端代理调用 Gemini 以隐藏 Key
// 这里为了演示方便，直接在前端调用（需在 .env 中配置 VITE_GEMINI_API_KEY）
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export const aiApi = {
    /**
     * 发送提示词到 Gemini
     */
    async generateContent(prompt: string): Promise<string> {
        // 如果没有 Key，抛出特殊错误以便上层切换 Mock
        if (!API_KEY) {
            throw new Error('NO_API_KEY');
        }

        try {
            // 这里我们使用原生 fetch 而不是 axios，因为 url 是谷歌的，不是我们自己后端的
            const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Gemini API Error');
            }

            const data: GeminiResponse = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error: any) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }
};