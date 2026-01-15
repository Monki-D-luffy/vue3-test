// mock-server/routes/device.js
import { fileURLToPath } from 'url';

export default function (server, db) {
    // 1. 模拟 C# 的 GetDevices 接口 (POST 查询列表)
    server.post('/Devices/GetDevices', (req, res) => {
        const { pageIndex = 1, pageSize = 10, uuid, productId, country } = req.body;

        // 获取原始数据
        let items = db.get('devices').value();

        // --- 模拟筛选逻辑 ---
        if (uuid) {
            items = items.filter(d => d.id.includes(uuid) || d.name.includes(uuid));
        }
        if (productId) {
            items = items.filter(d => d.productId === productId);
        }
        if (country) {
            items = items.filter(d => d.dataCenter === country);
        }

        // --- 模拟分页 (C# pageIndex 从1开始) ---
        const start = (pageIndex - 1) * pageSize;
        const end = start + pageSize;
        const pagedItems = items.slice(start, end);

        // 返回 C# 风格的数据结构
        res.json({
            code: 200,
            message: 'Success',
            success: true,
            data: pagedItems.map(item => ({
                // 确保字段映射匹配 DTO
                uuid: item.id,
                productName: item.productInfo?.split(' / ')[0] || '未知产品',
                productId: item.productId,
                bindStatus: item.isBound ? 1 : 0,
                onlineStatus: item.status === '在线' ? 1 : 0,
                lastSeen: item.gmtLastOnline,
                createAt: item.gmtActive,
                country: item.dataCenter
            }))
        });
    });

    // 2. 模拟 C# 的 GetDevicesTotalCount 接口
    server.post('/Devices/GetDevicesTotalCount', (req, res) => {
        const { country } = req.query; // 注意：前端是通过 Query String 传的

        let items = db.get('devices').value();

        if (country) {
            items = items.filter(d => d.dataCenter === country);
        }

        // 返回 DeviceRegionCountDTO 结构
        res.json({
            code: 200,
            message: 'Success',
            success: true,
            data: {
                region: country || 'All',
                totalCount: items.length,
                bindCount: items.filter(i => i.isBound).length,
                onlineCount: items.filter(i => i.status === '在线').length
            }
        });
    });
}