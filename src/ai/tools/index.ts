// src/ai/tools/index.ts
import { fetchDevices } from '@/api/modules/device';

// ----------------------------------------------------------------------
// 1. 标准化协议定义 (Protocol Definition)
// ----------------------------------------------------------------------

/**
 * AI 工具的标准定义接口
 * 对应架构文档中的 ToolDefinition
 */
export interface ToolDefinition {
    name: string;           // 工具唯一的标识符，如 "search_device"
    description: string;    // 给 AI 看的说明书，解释何时使用
    parameters: string;     // JSON Schema 格式的参数描述，如 '{ "keyword": "string" }'

    // 执行函数：必须返回 Promise<{ success, data, message }>
    execute: (args: any) => Promise<{
        success: boolean;
        data?: any;         // 核心数据，AI 将基于此生成回答
        message?: string;   // 辅助提示，如 "Found 3 items"
    }>;
}

// ----------------------------------------------------------------------
// 2. 工具实现 (Tools Implementation)
// ----------------------------------------------------------------------

export const toolsRegistry: Record<string, ToolDefinition> = {

    // 🛠️ 工具 1: 页面跳转 (导航能力)
    'navigate_to': {
        name: 'navigate_to',
        description: 'Navigate to a specific route page in the application.',
        parameters: JSON.stringify({
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "The target route path, e.g., '/dashboard', '/device/list'"
                }
            },
            required: ["path"]
        }),
        execute: async ({ path }) => {
            try {
                if (!path) throw new Error('Path is required');

                // 动态导入 Router 以避免循环依赖
                const routerModule = await import('@/router') as any;
                const router = routerModule.default || routerModule.router;

                await router.push(path);
                return {
                    success: true,
                    data: { currentPath: path },
                    message: `Successfully navigated to ${path}`
                };
            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
    },

    // 🛠️ 工具 2: 设备搜索 (感知能力 - 新增)
    'search_device': {
        name: 'search_device',
        description: 'Search for devices using a keyword. Returns a list of matching devices with their status.',
        parameters: JSON.stringify({
            type: "object",
            properties: {
                keyword: {
                    type: "string",
                    description: "Search keyword like device name, SN, or IP address"
                }
            },
            required: ["keyword"]
        }),
        execute: async ({ keyword }) => {
            try {
                console.log('[AI Tool] Searching device:', keyword);
                // 调用真实的业务 API
                const res: any = await fetchDevices({
                    _page: 1,
                    _limit: 5,
                    q: keyword // 假设 API 支持 q 模糊查询，或根据实际字段调整
                });

                const list = Array.isArray(res) ? res : (res.items || []);

                // 数据清洗：只保留 AI 关注的字段，减少 Token 消耗
                const simplifiedList = list.map((d: any) => ({
                    name: d.deviceName,
                    sn: d.deviceSn,
                    status: d.status,
                    ip: d.ipAddress,
                    location: d.location || 'Unknown'
                }));

                return {
                    success: true,
                    data: simplifiedList,
                    message: `Found ${simplifiedList.length} devices matching "${keyword}"`
                };
            } catch (e: any) {
                return { success: false, message: `Search failed: ${e.message}` };
            }
        }
    },

    // 🛠️ 工具 3: 全局统计 (分析能力)
    'get_product_distribution': {
        name: 'get_product_distribution',
        description: 'Get the product category statistics for the ENTIRE system.',
        parameters: '{}', // 无参数
        execute: async () => {
            // 模拟延迟
            await new Promise(r => setTimeout(r, 600));

            return {
                success: true,
                data: {
                    total: 192,
                    distribution: {
                        '摄像头': 45,
                        '温湿度计': 50,
                        '智能插座': 40,
                        '智能灯泡': 30,
                        'NB-IoT水表': 27
                    }
                },
                message: 'Retrieved full system statistics.'
            };
        }
    }
};

/**
 * 生成 System Prompt 用的工具描述
 */
export function getToolsDescription(): string {
    return Object.values(toolsRegistry).map(t => {
        return `## Tool: ${t.name}
Description: ${t.description}
Parameters: ${t.parameters}`;
    }).join('\n\n');
}