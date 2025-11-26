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

server.use(middlewares);
server.use(jsonServer.bodyParser);

// --- 挂载自定义路由 ---
server.use('/api/dashboard', dashboardRoutes);
// 传入 server 和 db 实例
authRoutes(server, router.db);
firmwareRoutes(server, router.db);
campaignRoutes(server, router.db);

// --- 🔥🔥 核心修复：自定义 json-server 的返回格式 ---
// 这一步会将 json-server 的默认返回结果（数组或对象）包装进 { code: 200, data: ... }
router.render = (req, res) => {
  // res.locals.data 包含了 json-server 查询到的原始数据
  res.json({
    code: 200,
    message: 'Success',
    success: true,
    data: res.locals.data
  });
};

// 默认路由
server.use('/api', router);

server.listen(3000, () => {
  console.log('JSON Server is running on port 3000');
});