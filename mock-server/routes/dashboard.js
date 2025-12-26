import express from 'express';
const router = express.Router();

// 辅助工具：生成最近24小时的时间点
const generate24HSlots = () => {
    const slots = [];
    for (let i = 0; i <= 24; i += 4) {
        slots.push(`${String(i).padStart(2, '0')}:00`);
    }
    return slots;
};

// 辅助工具：生成最近7天
const generate7DSlots = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}

// 辅助工具：生成随机数组
const generateSeries = (count, min, max) => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

// GET /stats - 全局概览数据
router.get('/stats', (req, res) => {
    const { range, productId } = req.query; // 获取前端传来的参数

    // 1. 模拟实时波动
    const baseTotal = 2542;
    const randomFluctuation = Math.floor(Math.random() * 20);
    const currentOnline = Math.floor(baseTotal * 0.92) + randomFluctuation;

    // 2. 根据 range 决定 X 轴和 数据量
    let categories = [];
    let seriesData = [];

    // 基础流量基数：如果选了特定产品，流量变小
    let baseTraffic = productId ? 300 : 2000;
    let maxTraffic = productId ? 500 : 2500;

    // 如果选了特定产品，让图表看起来有点个性（模拟不同产品特征）
    if (productId === 'p2') { // 假设 p2 是个不稳定的产品
        baseTraffic = 100;
        maxTraffic = 800;
    }

    if (range === '7D') {
        categories = generate7DSlots();
        seriesData = generateSeries(7, baseTraffic, maxTraffic);
    } else {
        // 默认为 24H
        categories = generate24HSlots(); // 7个点 (0, 4, 8... 24)
        seriesData = generateSeries(7, baseTraffic, maxTraffic);
        // 强制最后一个点为当前值（如果是总览模式）
        if (!productId) {
            seriesData[seriesData.length - 1] = currentOnline;
        }
    }

    res.json({
        code: 200,
        message: 'Success',
        data: {
            // A. 核心指标卡 (保持不变，实际项目中这些也会随筛选变化)
            overview: {
                totalDevices: baseTotal,
                onlineRate: 92.4,
                activeAlerts: productId ? 1 : 3, // 选产品时告警变少
                ongoingTasks: 2
            },

            // B. 产品矩阵
            products: [
                {
                    id: 'p1',
                    name: '智能边缘网关 X1',
                    category: 'Gateway',
                    version: 'v2.4.0',
                    onlineCount: 842,
                    totalCount: 850,
                    status: 'healthy',
                    icon: 'Cpu'
                },
                {
                    id: 'p2',
                    name: '温湿度传感器 Pro',
                    category: 'Sensor',
                    version: 'v1.2.5',
                    onlineCount: 1205,
                    totalCount: 1400,
                    status: 'warning',
                    icon: 'Odometer'
                },
                {
                    id: 'p3',
                    name: '工业控制器 PLC-5',
                    category: 'Control',
                    version: 'v3.0.1',
                    onlineCount: 290,
                    totalCount: 292,
                    status: 'healthy',
                    icon: 'Connection'
                }
            ],

            // C. 动态活动流
            activities: [
                {
                    id: 101,
                    type: 'info',
                    content: '产品 [智能网关] 自动发布了新补丁 v2.4.1',
                    time: '10分钟前'
                },
                {
                    id: 102,
                    type: 'warning',
                    content: '设备 [Sensor-A01] 上报温度异常 (85°C)',
                    time: '32分钟前',
                    canDiagnose: true
                },
                {
                    id: 103,
                    type: 'success',
                    content: '批量任务 [Task-2023] 固件升级完成 (50/50)',
                    time: '2小时前'
                },
                {
                    id: 104,
                    type: 'info',
                    content: '新设备 [Gateway-X99] 已自动注册并上线',
                    time: '5小时前'
                }
            ],

            // D. 动态图表趋势数据
            trafficTrend: {
                categories: categories,
                series: seriesData
            }
        }
    });
});

// ==========================================
// [新增] AI 全量数据聚合分析接口
// 用于生成 "Context Snapshot" 喂给 AI
// ==========================================
router.get('/analysis-report', (req, res) => {
    // 模拟：后台执行了复杂的 SQL 聚合查询
    // SELECT count(*) FROM logs GROUP BY type...
    // SELECT avg(duration) FROM sessions...

    const aiReport = {
        // 1. 审计范围与时间 (Context Scope)
        meta: {
            scope: "Global System Audit",
            period: "Last 7 Days",
            generatedAt: new Date().toISOString()
        },

        // 2. 关键统计指标 (Key Metrics)
        statistics: {
            totalDevices: 2542,
            onlineRate: "92.4%",  // 稍微偏低，这是个很好的分析点
            criticalAlerts: 3,    // 具体的红色告警数
            avgResponseTime: "45ms"
        },

        // 3. 固件版本分布 (Firmware Distribution)
        // AI 可以据此建议：“大部分设备还在旧版本，建议升级”
        firmwareStats: {
            "v1.0 (Legacy)": 520,
            "v2.0 (Stable)": 1180,
            "v2.4 (Latest)": 842
        },

        // 4. Top 故障归因 (Root Cause Analysis)
        // 这是 AI 分析的核心素材
        topIssues: [
            {
                issue: "High Temperature (>80°C)",
                count: 320,
                affectedProduct: "Sensor-Pro",
                primaryZone: "Zone-B (Warehouse)"
            },
            {
                issue: "Network Timeout",
                count: 150,
                affectedProduct: "Gateway-X1",
                primaryZone: "Zone-A"
            }
        ],

        // 5. 用户行为画像 (User Behavior)
        // 用于 AI 建议：“您通常在上午 9 点进行操作...”
        usagePattern: {
            peakLoginTime: "09:00 - 10:30",
            mostFrequentAction: "Firmware Update Task",
            recentFailures: "Failed to push update to 5 devices in Zone-C"
        }
    };

    res.json({
        code: 200,
        message: 'Analysis report generated successfully',
        data: aiReport
    });
});

export default router;