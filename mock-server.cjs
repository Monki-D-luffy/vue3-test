// mock-server.js
const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

// 1. 使用标准中间件（logger, static, cors, no-cache）
server.use(middlewares)

// 2. 使用 body-parser 来解析 POST, PUT, PATCH 请求
server.use(jsonServer.bodyParser)

// 3. ✨✨✨ 自定义中间件：检查 Token（解决您的核心问题）✨✨✨
server.use((req, res, next) => {
  // 登录请求不需要 Token，直接放行
  if (req.url === '/api/auth/login') {
    next()
    return
  }

  // 检查所有其他请求的请求头 (注意：headers 自动转为全小写)
  const token = req.headers.authorization
  
  if (token) {
    console.log('✅ [Mock Server] Token 验证通过:', token.substring(0, 20) + '...')
    next() // Token 存在，放行
  } else {
    // 没有 Token，返回 401
    console.warn(`❌ [Mock Server] 拦截到未授权请求: ${req.method} ${req.url}`)
    res.status(401).json({
      code: 401,
      message: '未授权：请先登录 (来自 json-server)',
      data: null,
      success: false
    })
  }
})

// 4. ✨✨✨ 自定义路由：处理登录 (POST /api/auth/login) ✨✨✨
server.post('/api/auth/login', (req, res) => {
  const { account, password } = req.body
  console.log(`[Mock Server] 收到登录请求:`, { account, password })

  if (account === '1067360038@qq.com' && password === '123456') {
    // 登录成功，返回您在 "格式.json" 中定义的格式
    res.status(200).json({
      "code": 200,
      "message": "登录成功",
      "data": {
        "expired": 1799999999,
        "nickname": "Qin (From json-server)",
        "userId": "c09e98c1-e353-48be-82eb-c209b42f180a",
        "email": "1067360038@qq.com",
        "token": "eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiJjMDllOThjMS1lMzUzLTQ4YmUtODJlYi1jMjA5YjQyZjE4MGEiLCJleHAiOjE3NjIyNDg5ODksImlzcyI6ImlkZW50aXR5LXNlcnZpY2UiLCJhdWQiOiJpZGVudGl0eS1jbGllbnRzIn0.As6xzctjQyvNE4GcGUH3uAJWlh9BaG3fTIyy2GWEvnc"
      },
      "success": true
    })
  } else {
    // 登录失败
    res.status(401).json({
      code: 401,
      message: '账号或密码错误 (来自 json-server)',
      data: null,
      success: false
    })
  }
})

// 5. ✨✨✨ 自定义路由：处理统计 (GET /api/devices/summary) ✨✨✨
server.get('/api/devices/summary', (req, res) => {
  // 从 db.json 读取数据
  const db = router.db
  const devices = db.get('devices').value() 
  
  const total = devices.length
  const online = devices.filter(item => item.status === '在线').length
  
  res.status(200).json({
    code: 200,
    message: '获取成功',
    data: {
      total: total,
      activated: total,
      online: online
    }
  })
})

// 6. 将 /api/devices 映射到 /devices，让 json-server 自动处理
//    这样 GET /api/devices 会自动获取 db.json 中的 "devices" 列表
//    POST /api/devices 会自动在 db.json 的 "devices" 中新增一条
server.use(jsonServer.rewriter({
  '/api/devices': '/devices',
  '/api/devices/:id': '/devices/:id'
}))

// 7. 使用 json-server 默认的路由
server.use(router)

// 8. 启动服务器，监听 3001 端口
server.listen(3001, () => {
  console.log('🚀 JSON Server is running at http://localhost:3001')
})