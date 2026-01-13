// mock-server/routes/product.js
import Mock from 'mockjs';

export default function (server, db) {
    // --- 0. 自动播种 (Auto Seeding) ---
    const existingProducts = db.get('products').value();
    if (!existingProducts || existingProducts.length === 0) {
        console.log('🌱 Seeding Mock Products...');
        const randomProducts = Mock.mock({
            'items|16-24': [{
                'id|+1': 1001,
                'name': () => Mock.Random.pick(['智能', '云端', 'Pro', 'Ultra']) + ' ' + Mock.Random.pick(['Wi-Fi插座', 'Zigbee网关', '温湿度传感器', 'AI摄像头', '氛围灯带']),
                'category': () => Mock.Random.pick(['LIGHT', 'SWITCH', 'SENSOR', 'LOCK', 'GATEWAY', 'OTHER']),
                'protocol': () => Mock.Random.pick(['WIFI', 'BLE', 'WIFI_BLE', 'ZIGBEE', 'NB_IOT']),
                'status': () => Mock.Random.pick(['DEVELOPMENT', 'TESTING', 'RELEASED', 'ALERT']),
                'description': '@cparagraph(1, 2)',
                'activeDeviceCount|0-5000': 100,
                'alertCount|0-10': 0,
                'createTime': () => Date.now() - Mock.Random.integer(100000, 90000000),
                'updateTime': () => Date.now(),
                'latestFirmware': /v[1-3]\.[0-9]\.[0-9]/
            }]
        });
        const finalProducts = randomProducts.items.map(p => ({ ...p, id: `PID-${p.id}` }));
        db.set('products', finalProducts).write();
    }

    // --- 1. 自定义路由 (Custom Routes) ---

    // GET: 获取产品详情
    server.get('/api/products/:id', (req, res, next) => {
        const { id } = req.params;
        const product = db.get('products').find({ id }).value();
        if (product) {
            res.json({ code: 200, message: 'Success', success: true, data: product });
        } else {
            next();
        }
    });

    // ✅ 新增 PATCH: 更新产品详情 (解决 404 问题)
    server.patch('/api/products/:id', (req, res) => {
        const { id } = req.params;
        const updates = req.body; // 获取前端传来的部分数据

        // 1. 查找是否存在
        const product = db.get('products').find({ id }).value();

        if (product) {
            // 2. 合并数据
            const updatedProduct = { ...product, ...updates, updateTime: Date.now() };

            // 3. 写入数据库
            db.get('products').find({ id }).assign(updatedProduct).write();

            console.log(`[Mock] Product ${id} updated.`);

            res.json({
                code: 200,
                message: 'Update Success',
                success: true,
                data: updatedProduct
            });
        } else {
            res.status(404).json({
                code: 404,
                message: 'Product Not Found',
                success: false
            });
        }
    });

    // 高级统计接口
    server.get('/api/products/stats/summary', (req, res) => {
        const products = db.get('products').value();
        const summary = {
            total: products.length,
            development: products.filter(p => p.status === 'DEVELOPMENT').length,
            released: products.filter(p => p.status === 'RELEASED').length,
            alert: products.filter(p => p.alertCount > 0 || p.status === 'ALERT').length,
            totalActiveDevices: products.reduce((acc, p) => acc + (p.activeDeviceCount || 0), 0)
        };
        res.json({ code: 200, success: true, data: summary });
    });
}