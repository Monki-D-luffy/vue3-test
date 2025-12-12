// mock-server/routes/campaign.js
import Mock from 'mockjs';
import { getNowString } from '../utils.js';

export default function (server, db) {
    // 创建 Campaign
    server.post('/api/campaigns', (req, res) => {
        const { name, productId, firmwareId, firmwareVersion, targetScope, filters } = req.body;
        let targetDevices = db.get('devices').filter({ productId }).value();
        if (targetScope === 'filter' && filters && filters.dataCenter) {
            targetDevices = targetDevices.filter(d => d.dataCenter === filters.dataCenter);
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
        };
        db.get('campaigns').push(newCampaign).write();
        res.json({ code: 200, message: '批量任务已创建', success: true, data: newCampaign });
    });

    // 获取 Campaign 列表
    server.get('/api/campaigns', (req, res) => {
        let campaigns = db.get('campaigns').value();
        const targetProductId = req.query.productId;

        // 1. 获取前端传来的分页参数 (默认为第一页，每页10条)
        const page = parseInt(req.query._page) || 1;
        const limit = parseInt(req.query._limit) || 10;

        // 2. 筛选产品
        if (targetProductId) {
            campaigns = campaigns.filter(c => c.productId === targetProductId);
        }

        // 3. 模拟进度更新逻辑 (保持原样)
        campaigns.forEach(camp => {
            if (camp.status === 'running') {
                camp.progress += Math.floor(Math.random() * 10) + 5;
                if (camp.progress >= 100) {
                    camp.progress = 100;
                    camp.status = 'success';
                    camp.successCount = camp.totalDevices;
                }
                db.get('campaigns').find({ id: camp.id }).assign({
                    progress: camp.progress, status: camp.status, successCount: camp.successCount
                }).write();
            }
        });

        // 4. 排序 (按开始时间倒序)
        campaigns.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

        // 5. 🔥 计算总数 & 执行分页切片 🔥
        const totalCount = campaigns.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        const pagedItems = campaigns.slice(start, end);

        // 6. 🔥 构造前端需要的结构 { items, total } 🔥
        res.json({
            code: 200,
            message: '获取成功',
            success: true,
            data: {
                items: pagedItems, // 这里放切片后的数组
                total: totalCount  // 这里放总数
            }
        });
    });

    // 删除 Campaign
    server.delete('/api/campaigns/:id', (req, res) => {
        const id = req.params.id;
        const campaign = db.get('campaigns').find({ id }).value();

        if (!campaign) {
            return res.status(404).json({ code: 404, message: "任务不存在", success: false });
        }
        db.get('campaigns').remove({ id }).write();
        res.json({ code: 200, message: '任务已删除', success: true });
    });
}