// mock-server/routes/dashboard.js
module.exports = function (server, db) {
    server.get('/api/devices/summary', (req, res) => {
        const targetDataCenter = req.query.dataCenter
        let devices = db.get('devices').value()
        if (targetDataCenter) {
            devices = devices.filter(d => d.dataCenter === targetDataCenter)
        }
        res.json({
            code: 200, message: '获取成功',
            data: {
                total: devices.length,
                online: devices.filter(d => d.status === '在线').length,
                activated: devices.filter(d => d.status !== '未激活').length
            }
        })
    })
}