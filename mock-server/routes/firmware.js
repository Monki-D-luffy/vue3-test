// mock-server/routes/firmware.js
import Mock from 'mockjs';
import { getNowString } from '../utils.js';

export default function (server, db) {

    // 🔥 0. 自动初始化数据 (防止 db.json 中缺少 firmwares 导致 404)
    if (!db.get('firmwares').value()) {
        db.set('firmwares', []).write();
        console.log('📦 [Mock] 初始化 firmwares 空集合');
    }

    // 1. 固件上传
    // 🔥 修改点：移除 '/api' 前缀，统一为 '/firmwares'
    server.post('/firmwares', (req, res) => {
        const { version, productId, releaseNotes } = req.body;

        // 尝试查找关联产品
        let productName = '未知产品';
        try {
            const product = db.get('products').find({ id: productId }).value();
            if (product) productName = product.name;
        } catch (e) { }

        const newFirmware = {
            id: 'fw_' + Mock.Random.guid(),
            version,
            productId,
            releaseNotes,
            productName,
            fileUrl: `/files/firmware_${version}.bin`,
            uploadedAt: getNowString(),
            verified: false
        };

        db.get('firmwares').push(newFirmware).write();

        res.json({
            code: 200,
            success: true,
            message: "固件上传成功 (Mock)",
            data: newFirmware
        });
    });

    // 2. 固件验证 (Verify)
    server.post('/firmwares/:id/verify', (req, res) => {
        const { id } = req.params;
        const fw = db.get('firmwares').find({ id }).value();

        if (fw) {
            db.get('firmwares')
                .find({ id })
                .assign({ verified: true })
                .write();

            res.json({ code: 200, success: true, message: "验证通过" });
        } else {
            res.status(404).json({ code: 404, success: false, message: "固件不存在" });
        }
    });

    // 3. 删除固件
    server.delete('/firmwares/:id', (req, res) => {
        const { id } = req.params;
        db.get('firmwares').remove({ id }).write();
        res.json({ code: 200, success: true, message: "删除成功" });
    });

    // 注意：GET /firmwares 列表请求会自动通过 server.use(router) 转发到 db.json
    // 只要上面初始化了 firmwares 集合，列表就能正常显示
}