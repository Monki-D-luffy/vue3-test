/**
 * 仪表盘核心数据结构定义
 * 对应后端 /api/dashboard/stats 接口
 */

// 1. 核心指标概览
export interface DashboardOverview {
    totalDevices: number;
    onlineRate: number;
    activeAlerts: number;
    ongoingTasks: number;
}

// 2. 产品矩阵项
export interface ProductStatusItem {
    id: string;
    name: string;
    category: string;
    version: string;
    onlineCount: number;
    totalCount: number;
    status: 'healthy' | 'warning' | 'offline'; // 严格字面量类型
    icon: string; // Element Plus Icon 名称
}

// 3. 动态日志流
export interface ActivityLogItem {
    id: number;
    type: 'info' | 'warning' | 'success' | 'danger';
    content: string;
    time: string;
    canDiagnose?: boolean; // 是否允许触发 AI 诊断
}

// 4. 图表数据
export interface ChartTrendData {
    categories: string[]; // X轴：时间点
    series: number[];     // Y轴：数值
}

// 5. 聚合根对象 (API 完整响应中的 data 字段)
export interface DashboardData {
    overview: DashboardOverview;
    products: ProductStatusItem[];
    activities: ActivityLogItem[];
    trafficTrend: ChartTrendData;
}

/**
 * AI 全量分析报告结构
 * 对应后端 /api/dashboard/analysis-report
 */
export interface AiAnalysisReport {
    meta: {
        scope: string;
        period: string;
        generatedAt: string;
    };
    statistics: {
        totalDevices: number;
        onlineRate: string;
        criticalAlerts: number;
        avgResponseTime: string;
    };
    firmwareStats: Record<string, number>; // key 是版本号，value 是数量
    topIssues: Array<{
        issue: string;
        count: number;
        affectedProduct: string;
        primaryZone: string;
    }>;
    usagePattern: {
        peakLoginTime: string;
        mostFrequentAction: string;
        recentFailures: string;
    };
}