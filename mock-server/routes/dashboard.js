// mock-server/routes/dashboard.js
const Mock = require('mockjs')

module.exports = function (server, db) {
    // 模拟延迟
    const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

    // 获取仪表盘聚合数据
    server.get('/api/dashboard/stats', async (req, res) => {
        await delay(500);

        res.json({
            code: 200,
            message: "success",
            success: true,
            data: {
                // 核心卡片数据
                totalDevices: 128,
                totalTrend: 5.2, // 较昨日增长 %

                onlineCount: 98,
                onlineTrend: 2.1,

                warningCount: 3,
                warningTrend: -15.0, // 较昨日下降（好事）

                pendingUpgrades: 12,
                upgradeTrend: 0,

                // 图表数据 (模拟7天在线趋势)
                chartData: {
                    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    online: [82, 90, 95, 93, 98, 105, 98],
                    total: [120, 122, 125, 125, 126, 128, 128]
                },

                // 最近活动 (Mock 5条)
                recentActivities: Mock.mock({
                    "list|5": [{
                        "id|+1": 1,
                        "time": "@time('HH:mm:ss')",
                        "content": "@pick(['设备上线', '固件升级成功', '触发高温报警', '新设备注册'])",
                        "device": "SN-@string('upper', 5)@integer(100, 999)",
                        "type|1": ["info", "success", "warning", "danger"]
                    }]
                }).list
            }
        })
    })
}