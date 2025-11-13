const jsonServer = require('json-server')
const path = require('path')
const seeder = require('./seeder')

const dbPath = path.join(__dirname, 'db.json')

// 1. 核心功能: 自动造数据 (启动时执行)
seeder(dbPath)

// 2. 启动 Server
const server = jsonServer.create()
const router = jsonServer.router(dbPath)
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// 3. 注册模块化路由 (按顺序加载)
// 注意：router.db 是 LowDB 实例，传给子模块使用
require('./routes/auth')(server, router.db)
require('./routes/dashboard')(server, router.db)
require('./routes/firmware')(server, router.db)
require('./routes/campaign')(server, router.db)

// 4. 路由重写 (支持 /api 前缀)
server.use(jsonServer.rewriter({
  '/api/*': '/$1'
}))

// 5. 统一响应格式拦截器
router.render = (req, res) => {
  const pagedRoutes = ['/devices', '/deviceLogs', '/firmwares', '/upgradeTasks', "/campaigns"]

  if (req.method === 'GET' && pagedRoutes.includes(req.path)) {
    res.json({
      code: 200, message: '操作成功', success: true,
      data: res.locals.data,
      total: res.get('X-Total-Count') ? Number(res.get('X-Total-Count')) : res.locals.data.length
    })
  } else if (!res.headersSent) {
    res.json({
      code: 200, message: '操作成功', success: true,
      data: res.locals.data
    })
  }
}

server.use(router)
server.listen(3000, () => {
  console.log('✨ Mock Server Modularized Running at http://localhost:3000/api')
})