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
// ✅ 修复 1: 使用 import 替代 require
import sceneRoutes from './routes/scene.js';

server.use(middlewares);
server.use(jsonServer.bodyParser);

// --- 挂载自定义路由 ---
server.use('/api/dashboard', dashboardRoutes);

// 传入 server 和 db 实例 (针对函数式导出的路由)
authRoutes(server, router.db);
firmwareRoutes(server, router.db);
campaignRoutes(server, router.db);
productRoutes(server, router.db);

// ✅ 修复 2: 这里的变量名必须是 server，而不是 app
server.use('/api/scenes', sceneRoutes);

// --- 🔥🔥 核心修复：自定义 json-server 的返回格式 ---
router.render = (req, res) => {
  const data = res.locals.data;
  const totalHeader = res.get('X-Total-Count');

  // 1. 如果有 Total Header 且数据是数组，说明是分页列表
  if (Array.isArray(data) && totalHeader) {
    return res.json({
      code: 200,
      message: 'Success',
      success: true,
      data: {
        list: data,
        total: parseInt(totalHeader, 10),
        page: parseInt(req.query._page || 1, 10),
        pageSize: parseInt(req.query._limit || 10, 10)
      }
    });
  }

  // 2. 如果数据本身已经包含了 code (说明是自定义路由返回的)，直接返回
  if (data && data.code !== undefined) {
    return res.json(data);
  }

  // 3. 默认情况：包装标准数据
  return res.json({
    code: 200,
    message: 'Success',
    success: true,
    data: data
  });
};

server.use(router);

// 启动服务
server.listen(3000, () => {
  console.log('JSON Server is running on http://localhost:3000');
});