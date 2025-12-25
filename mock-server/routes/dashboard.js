import express from 'express';
const router = express.Router();

// 辅助工具：生成最近24小时的时间点
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i <= 24; i += 4) {
        slots.push(`${String(i).padStart(2, '0')}:00`);
    }
    return slots;
};

// GET /stats - 全局概览数据
router.get('/stats', (req, res) => {
    // 1. 模拟实时波动
    const baseTotal = 2542;
    const randomFluctuation = Math.floor(Math.random() * 20);
    const currentOnline = Math.floor(baseTotal * 0.92) + randomFluctuation;

    res.json({
        code: 200,
        message: 'Success',
        data: {
            // A. 核心指标卡 (Core Stats)
            overview: {
                totalDevices: baseTotal,
                onlineRate: 92.4,
                activeAlerts: 3, // 红色告警数
                ongoingTasks: 2  // 进行中的固件升级任务
            },

            // B. 产品矩阵 (Product Matrix)
            products: [
                {
                    id: 'p1',
                    name: '智能边缘网关 X1',
                    category: 'Gateway',
                    version: 'v2.4.0',
                    onlineCount: 842,
                    totalCount: 850,
                    status: 'healthy', // healthy, warning, offline
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

            // C. 动态活动流 (Activity Stream)
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
                    // 前端可据此显示 "AI 诊断" 按钮
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

            // D. 图表趋势数据 (Chart Data)
            trafficTrend: {
                categories: generateTimeSlots(),
                series: [2100, 2050, 2300, 2450, 2400, 2500, currentOnline]
            }
        }
    });
});

export default router;