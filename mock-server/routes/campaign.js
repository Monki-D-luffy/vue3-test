// mock-server/routes/campaign.js
const Mock = require('mockjs')
const { getNowString, formatTimestamp } = require('../utils')

module.exports = function (server, db) {
    // 创建 Campaign
    server.post('/api/campaigns', (req, res) => {
        const { name, productId, firmwareId, firmwareVersion, targetScope, filters } = req.body
        let targetDevices = db.get('devices').filter({ productId }).value()
        if (targetScope === 'filter' && filters && filters.dataCenter) {
            targetDevices = targetDevices.filter(d => d.dataCenter === filters.dataCenter)
        }

        const newCampaign = {
            id: 'camp_' + Mock.Random.guid().substring(0, 8),
            name: name || `批量升级-${firmwareVersion}`,
            productId, firmwareId, firmwareVersion,
            status: 'running', progress: 0,
            totalDevices: targetDevices.length,
            successCount: 0, failureCount: 0,
            targetScope, filters,
            startedAt: getNowString()
        }
        db.get('campaigns').push(newCampaign).write()
        res.json({ code: 200, message: '批量任务已创建', success: true, data: newCampaign })
    })

    // 获取 Campaign 列表 (带进度模拟)
    server.get('/api/campaigns', (req, res) => {
        let campaigns = db.get('campaigns').value()
        campaigns.forEach(camp => {
            if (camp.status === 'running') {
                camp.progress += Math.floor(Math.random() * 10) + 5
                if (camp.progress >= 100) {
                    camp.progress = 100
                    camp.status = 'success'
                    camp.successCount = camp.totalDevices
                }
                db.get('campaigns').find({ id: camp.id }).assign({
                    progress: camp.progress, status: camp.status, successCount: camp.successCount
                }).write()
            }
        })
        campaigns.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        res.json({ code: 200, message: '获取成功', success: true, data: campaigns })
    })

    // 删除 Campaign
    server.delete('/api/campaigns/:id', (req, res) => {
        const id = req.params.id
        const campaign = db.get('campaigns').find({ id }).value()

        if (!campaign) {
            return res.status(404).json({ code: 404, message: "任务不存在", success: false })
        }

        // 执行删除
        db.get('campaigns').remove({ id }).write()

        res.json({ code: 200, message: '任务已删除', success: true })
    })
}