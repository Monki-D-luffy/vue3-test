import { marked } from 'marked';

// 配置 marked 选项（这里可以扩展 highlight.js 代码高亮）
marked.setOptions({
    breaks: true, // 支持 GitHub 风格的换行
    gfm: true     // 启用 GitHub Flavor Markdown
});

/**
 * 将 Markdown 文本安全地转换为 HTML
 */
export const parseMarkdown = (text: string): string => {
    if (!text) return '';
    try {
        // marked.parse 返回的是 string | Promise<string>，这里强制转换为 string
        return marked.parse(text) as string;
    } catch (e) {
        console.error('Markdown parse error:', e);
        return text; // 降级为纯文本
    }
};