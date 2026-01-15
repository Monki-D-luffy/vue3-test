import request from '@/api/core/request';
import type { DashboardData, AiAnalysisReport } from '@/types/dashboard';

// 1. 获取仪表盘概览数据 (原有)
export const fetchDashboardData = (params?: { range?: string; productId?: string }) => {
    return request.get<DashboardData>('/dashboard/stats', { params });
};

// 2. [新增] 获取 AI 分析用的全量报告
export const fetchAnalysisReport = () => {
    // 这里的泛型 <AiAnalysisReport> 会让返回值自动获得类型提示
    return request.get<AiAnalysisReport>('/dashboard/analysis-report');
};