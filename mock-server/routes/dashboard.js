import express from 'express'; // 🔥 修改点1: 使用 import
const router = express.Router();

// 模拟不同区域的基础数据权重
const REGION_WEIGHTS = {
    'CN': 1.0,
    'US': 0.8,
    'EU': 0.5,
    'SG': 0.3
};

// GET /stats
router.get('/stats', (req, res) => {
    try {
        // 1. 获取前端传来的参数
        const { dataCenter } = req.query;

        // 2. 确定基础数量级
        let baseTotal = 500;
        // 安全访问对象属性
        if (dataCenter && REGION_WEIGHTS[dataCenter]) {
            baseTotal = Math.floor(500 * REGION_WEIGHTS[dataCenter]);
        }

        // 3. 生成动态数据
        const randomFactor = 0.9 + Math.random() * 0.2;
        const totalDevices = Math.floor(baseTotal * randomFactor);
        const activeDevices = Math.floor(totalDevices * 0.9);
        const onlineDevices = Math.floor(activeDevices * (0.6 + Math.random() * 0.2));

        // 4. 返回数据
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

export default router; // 🔥 修改点2: 使用 export default