import { ref } from 'vue';
import { ElMessage } from 'element-plus';

interface TranslationItem {
    key: string;
    zh: string;
    [lang: string]: string; // 动态语言键值
}

/**
 * I18N AI 翻译策略 Hook
 * 模拟调用 LLM 对空缺的词条进行补全
 */
export function useI18nAi() {
    const isTranslating = ref(false);

    // 模拟 AI 翻译请求
    const translateMissingItems = async (
        items: TranslationItem[],
        targetLangs: string[]
    ): Promise<TranslationItem[]> => {
        if (targetLangs.length === 0) {
            ElMessage.warning('请先选择目标语言 (Target Languages)');
            return items;
        }

        isTranslating.value = true;

        // 1. 识别需要翻译的空缺 (Mock Analysis)
        let missingCount = 0;
        const newItems = JSON.parse(JSON.stringify(items)); // Deep Clone

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 2. 模拟 LLM 生成逻辑
        newItems.forEach((item: TranslationItem) => {
            targetLangs.forEach(lang => {
                // 如果该语言为空，则进行“AI 生成”
                if (!item[lang]) {
                    missingCount++;
                    item[lang] = mockAiGenerate(item.zh || item.key, lang);
                }
            });
        });

        isTranslating.value = false;

        if (missingCount > 0) {
            ElMessage.success(`AI 已智能补全 ${missingCount} 个缺失词条`);
        } else {
            ElMessage.info('当前没有需要补全的词条');
        }

        return newItems;
    };

    return {
        isTranslating,
        translateMissingItems
    };
}

// 私有 Mock 生成器
function mockAiGenerate(source: string, lang: string): string {
    const prefixMap: Record<string, string> = {
        en: '[En] ',
        fr: '[Fr] ',
        jp: '[Jp] ',
        de: '[De] '
    };
    // 简单模拟翻译结果，保留 [En] 前缀让人知道这是 AI 生成的
    return `${prefixMap[lang] || ''}${source}`;
}