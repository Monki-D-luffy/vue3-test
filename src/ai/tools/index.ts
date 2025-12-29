// src/ai/tools/index.ts
import type { AiTool } from '../types';

export const toolsRegistry: Record<string, AiTool> = {
    // 🛠️ 工具 1: 页面跳转
    'navigate_to': {
        name: 'navigate_to',
        description: 'Navigate to a specific route page. Use this when user asks to go somewhere.',
        parameters: '{ path: string }',
        execute: async ({ path }) => {
            try {
                if (!path) throw new Error('Path is required');

                // ✅ 修复：使用 (as any) 绕过 TS 类型检查
                // 这样无论 router 是 default export 还是 named export 都能读取
                const routerModule = await import('@/router') as any;
                const router = routerModule.default || routerModule.router;

                if (!router) throw new Error('Router instance not found');

                await router.push(path);
                return { success: true, message: `Mapsd to ${path}` };
            } catch (e: any) {
                console.error('Tool Execution Failed:', e);
                return { success: false, error: e.message };
            }
        }
    },

    // 🛠️ 工具 2: 获取全量设备统计
    'get_product_distribution': {
        name: 'get_product_distribution',
        description: 'Get the precise count of devices grouped by product type for the ENTIRE system (not just the visible list).',
        parameters: '{}',
        execute: async () => {
            // 模拟延迟
            await new Promise(r => setTimeout(r, 800));

            return {
                total: 192,
                distribution: {
                    '摄像头': 45,
                    '温湿度计': 50,
                    '智能插座': 40,
                    '智能灯泡': 30,
                    'NB-IoT水表': 27
                },
                source: 'Database Full Scan (Mocked)'
            };
        }
    }
};

/**
 * 生成给 AI 看的工具描述文档
 */
export function getToolsDescription() {
    return Object.values(toolsRegistry).map(t => {
        return `- Function: ${t.name}\n  Description: ${t.description}\n  Parameters: ${t.parameters || 'None'}`;
    }).join('\n\n');
}