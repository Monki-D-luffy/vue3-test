// mock-server/server.js
import jsonServer from 'json-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 手动构建 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// 引入所有路由文件
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import firmwareRoutes from './routes/firmware.js';
import campaignRoutes from './routes/campaign.js';
import productRoutes from './routes/product.js';
import sceneRoutes from './routes/scene.js';
import deviceRoutes from './routes/device.js';

server.use(middlewares);
server.use(jsonServer.bodyParser);

// 挂载路由 (移除 /api 前缀，保持与前端请求路径一致)
server.use('/dashboard', dashboardRoutes);
server.use('/scenes', sceneRoutes);

// 传入 server 和 db 实例
authRoutes(server, router.db);
firmwareRoutes(server, router.db);
campaignRoutes(server, router.db);
productRoutes(server, router.db);
deviceRoutes(server, router.db);

// --- 自定义 json-server 的返回格式 ---
router.render = (req, res) => {
  const data = res.locals.data;
  const totalHeader = res.get('X-Total-Count');

  // 1. 分页列表
  if (Array.isArray(data) && totalHeader) {
    return res.json({
      code: 200,
      message: 'Success',
      success: true,
      data: {
        // 🔥🔥 核心修复：将 'list' 改为 'items' 以匹配前端 PaginatedResponse 接口 🔥🔥
        items: data,
        total: parseInt(totalHeader, 10),
        page: parseInt(req.query._page || 1, 10),
        pageSize: parseInt(req.query._limit || 10, 10)
      }
    });
  }

  // 2. 自定义路由返回 (如果路由中已经手动构造了 res.json)
  if (data && data.code !== undefined) {
    return res.json(data);
  }

  // 3. 默认包装 (详情页/操作响应)
  return res.json({
    code: 200,
    message: 'Success',
    success: true,
    data: data
  });
};

server.use(router);

server.listen(3000, () => {
  console.log('JSON Server is running on http://localhost:3000');
  console.log('  - Devices:   http://localhost:3000/devices');
  console.log('  - Firmware:  http://localhost:3000/firmwares');
});