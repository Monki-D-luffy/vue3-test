const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()
// 指向我们的 db.json 文件
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

// 设置默认中间件 (logger, static, cors, no-cache)
server.use(middlewares)

// 添加 body-parser 中间件来解析 POST 请求体
server.use(jsonServer.bodyParser)

// --- 自定义路由 1: 登录接口 ---
// 必须在 server.use(router) 之前定义
server.post('/api/auth/login', (req, res) => {
  const { account, password } = req.body
  console.log('收到登录请求:', account, password)

  // 这里做简单的硬编码校验，和您之前的 mock 逻辑一致
  if (account === '1067360038@qq.com' && password === '123456') {
    res.json({
      code: 200,
      message: "登录成功",
      success: true,
      data: {
        // 返回一个固定的 mock token
        token: "mock_token_eyJhbGciOiJIUzI1NiIsInRRqq",
        userId: "mock-user-id-001",
        nickname: "Qin (Mock)",
        email: account
      }
    })
  } else {
    // 返回 401 未授权状态码
    res.status(401).json({
      code: 401,
      message: "账号或密码错误 (From Mock Server)",
      success: false,
      data: null
    })
  }
})

// --- 自定义中间件: Token 校验 ---
// 拦截所有 /api 开头的非登录请求，检查 Authorization 头
server.use('/api', (req, res, next) => {
  // 如果是登录接口，直接放行 (虽然上面已经处理了，加一层保险)
  if (req.path === '/auth/login') {
    next()
    return
  }

  const authHeader = req.headers.authorization
  // 检查 Header 是否存在，并且是否以 'Bearer ' 开头
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 简单的校验：只要有 Bearer Token 就视为通过
    // 您也可以在这里判断 token 是否等于我们上面下发的 mock_token
    next()
  } else {
    // 没有 Token，返回 401
    res.status(401).json({
      code: 401,
      message: "未授权：请先登录 (From Mock Server)",
      success: false
    })
  }
})

// --- 自定义路由 2: 统计数据接口 ---
// 因为 db.json 里很难直接写出动态的统计数据，我们在这里拦截手动返回
server.get('/api/devices/summary', (req, res) => {
  // 获取 db.json 中的 devices 数据
  const db = router.db 
  const devices = db.get('devices').value()

  // 简单的统计逻辑
  const total = devices.length
  const online = devices.filter(d => d.status === '在线').length
  const activated = devices.filter(d => d.status !== '未激活').length

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      total,
      online,
      activated
    }
  })
})

// --- 路由重写 ---
// 我们的 db.json 里是 "devices"，访问路径是 /devices
// 但前端请求的是 /api/devices。
// 我们通过挂载路由到 /api 下来解决这个问题。
server.use('/api', router)

// 启动服务，监听 3000 端口
server.listen(3000, () => {
  console.log('=================================================')
  console.log('zh-CN: Mock 服务器已启动! 接口地址: http://localhost:3000/api')
  console.log('en-US: Mock Server is running at http://localhost:3000/api')
  console.log('=================================================')
})