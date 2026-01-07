import { ref } from 'vue';
import { ElMessage } from 'element-plus';

interface TranslationItem {
    key: string;
    zh: string;
    [lang: string]: string;
}

// 读取环境变量
const API_KEY = import.meta.env.VITE_AI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_AI_MODEL || 'deepseek-ai/DeepSeek-V3.2';

/**
 * 真实的 I18N AI 翻译策略
 * 通过 Vite 代理调用 SiliconFlow / DeepSeek 真实接口
 */
export function useI18nAi() {
    const isTranslating = ref(false);

    const translateMissingItems = async (
        items: TranslationItem[],
        targetLangs: string[]
    ): Promise<TranslationItem[]> => {
        // 0. 基础校验
        if (targetLangs.length === 0) {
            ElMessage.warning('请先选择目标语言 (Target Languages)');
            return items;
        }
        if (!API_KEY) {
            ElMessage.error('未配置 API Key，请检查 .env.local 文件');
            return items;
        }

        // 1. 筛选任务 (只翻译空的)
        const missingTasks: { key: string; source: string; targetLang: string }[] = [];
        const newItems = JSON.parse(JSON.stringify(items)); // Deep Clone

        newItems.forEach((item: TranslationItem) => {
            if (!item.zh) return;
            targetLangs.forEach(lang => {
                if (!item[lang] || item[lang].trim() === '') {
                    missingTasks.push({
                        key: item.key,
                        source: item.zh,
                        targetLang: lang
                    });
                }
            });
        });

        if (missingTasks.length === 0) {
            ElMessage.info('当前没有需要补全的空缺词条');
            return items;
        }

        isTranslating.value = true;

        try {
            // 2. 构造 Prompt (关键修复：要求返回 Root Object)
            const prompt = `
你是一个专业的 I18N 翻译引擎。请处理以下翻译任务。

任务列表 (JSON):
${JSON.stringify(missingTasks)}

【重要要求】：
1. 必须返回一个标准的 JSON 对象，格式为：{ "result": [ ... ] }
2. "result" 数组中包含翻译结果对象，每个对象结构：{"key": "原key", "value": "翻译结果", "targetLang": "目标语言code"}
3. 将 "source" 翻译为 "targetLang" 指定的语言 (en=English, fr=French, jp=Japanese, de=German, es=Spanish, ru=Russian)。
4. 严禁包含 Markdown 格式（如 \`\`\`json），只返回纯文本 JSON。
            `.trim();

            // 3. 发起请求
            const response = await fetch('/ai-proxy/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: [
                        { role: "system", content: "You are a helpful assistant that outputs JSON." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.3,
                    stream: false,
                    // 开启 json_object 模式，配合上面的 prompt 要求返回 root object
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            let aiContent = data.choices?.[0]?.message?.content || '';

            console.log('AI Raw Output:', aiContent); // 调试用

            // 4. 解析结果 (增强容错)
            let translatedList: any[] = [];
            try {
                // 清理可能存在的 Markdown 标记 (虽然 Prompt 禁止了，但防一手)
                aiContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();

                const parsed = JSON.parse(aiContent);

                // 关键：从 result 字段取数组
                if (parsed.result && Array.isArray(parsed.result)) {
                    translatedList = parsed.result;
                } else if (Array.isArray(parsed)) {
                    // 兼容 AI 没听话直接返回数组的情况
                    translatedList = parsed;
                } else {
                    console.warn('AI 返回结构不符合预期', parsed);
                }
            } catch (e) {
                console.error('JSON Parse Error:', e, aiContent);
                ElMessage.error('AI 返回格式解析失败，请查看控制台');
                return items;
            }

            // 5. 回填数据
            let fillCount = 0;
            if (Array.isArray(translatedList)) {
                translatedList.forEach(t => {
                    const targetItem = newItems.find((i: any) => i.key === t.key);
                    // 匹配 key 和 targetLang
                    if (targetItem && t.value && t.targetLang) {
                        targetItem[t.targetLang] = t.value;
                        fillCount++;
                    }
                    // 容错：如果是单语言任务，有时候 AI 会偷懒不返回 targetLang
                    else if (targetItem && t.value && missingTasks.length === 1) {
                        const task = missingTasks[0];
                        if (task && task.targetLang) {
                            targetItem[task.targetLang] = t.value;
                            fillCount++;
                        }
                    }
                });
            }

            if (fillCount > 0) {
                ElMessage.success(`AI 成功补全 ${fillCount} 条翻译`);
            } else {
                ElMessage.warning('AI 返回了结果，但未能匹配到对应条目');
            }

            return newItems;

        } catch (error: any) {
            console.error('AI Request Failed:', error);
            ElMessage.error(`请求失败: ${error.message || '网络错误'}`);
            return items;
        } finally {
            isTranslating.value = false;
        }
    };

    return {
        isTranslating,
        translateMissingItems
    };
}