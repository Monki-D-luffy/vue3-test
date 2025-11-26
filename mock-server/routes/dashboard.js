import express from 'express';
const router = express.Router();

// 模拟不同区域的基础数据权重
const REGION_WEIGHTS = {
    'CN': 1.0,   // 中国区 (基准 ~500)
    'US': 0.8,   // 美国区 (~400)
    'EU': 0.5,   // 欧洲区 (~250)
    'SG': 0.3    // 新加坡 (~150)
};

// GET /stats
router.get('/stats', (req, res) => {
    try {
        const { dataCenter } = req.query;

        // 🔥🔥 核心修复 1：调整默认基准值
        // 如果没有选数据中心（即全部区域），基准值应该是所有区域之和 (1.0+0.8+0.5+0.3 = 2.6倍)
        // 设定为 1300，这样明显区别于单区 (500)
        let baseTotal = 1300;

        // 如果选了特定区域，则使用特定权重
        if (dataCenter && REGION_WEIGHTS[dataCenter]) {
            baseTotal = Math.floor(500 * REGION_WEIGHTS[dataCenter]);
        }

        // 3. 生成动态数据 (保持原有随机波动逻辑)
        const randomFactor = 0.9 + Math.random() * 0.2;
        const totalDevices = Math.floor(baseTotal * randomFactor);
        const activeDevices = Math.floor(totalDevices * 0.9);
        const onlineDevices = Math.floor(activeDevices * (0.6 + Math.random() * 0.2));

        res.json({
            code: 200,
            message: 'Success',
            data: {
                totalDevices: totalDevices,
                onlineDevices: onlineDevices,
                activeDevices: activeDevices,
                deviceGrowth: 12,
                alertCount: Math.floor(Math.random() * 10)
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ code: 500, message: 'Internal Mock Error' });
    }
});

export default router;