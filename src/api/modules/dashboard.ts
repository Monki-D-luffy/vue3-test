// src/api/modules/dashboard.ts
import request from '@/utils/request'
import type { DashboardData } from '@/composables/useDashboard'
// 注意：如果 DashboardData 定义在 useDashboard 中，导入它可能会导致循环依赖。
// 建议：将 DashboardData 的类型定义移动到 src/types/index.ts 中。
// 这里暂时使用 any 或泛型来避免报错，或者你可以手动定义返回类型。

export const fetchDashboardData = () => {
    return request.get<any>('/dashboard/stats')
}