const jsonServer = require('json-server')
const path = require('path')
const fs = require('fs')
const Mock = require('mockjs')

const dbPath = path.join(__dirname, 'db.json')

// =========================================
// 辅助函数: 时间格式化
// =========================================
function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const Y = date.getFullYear() + '-'
  const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
  const D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' '
  const h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':'
  const m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':'
  const s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + '.'
  const ms = (date.getMilliseconds() < 100 ? (date.getMilliseconds() < 10 ? '00' : '0') : '') + date.getMilliseconds()
  return Y + M + D + h + m + s + ms
}

// =========================================
// 核心功能 1: 提前自动造数据 (Pre-Seeding)
// =========================================
function preSeedDatabase() {
  // 1. 初始化 DB 结构
  let dbData = {
    devices: [],
    deviceLogs: [] // <-- ✨ 新增 deviceLogs 数组
  }

  // (我们不再读取旧的 db.json, 而是每次都重新生成)

  console.log('--- [Mock Server] 正在重新生成所有模拟数据... ---')

  // --- 2. 生成设备 (沿用旧逻辑) ---
  const dataCenters = ['CN', 'US-WEST', 'EU-CENTRAL', 'IN', 'US-EAST', 'EU-WEST', 'SG']
  const deviceTypes = ["智能插座", "温湿度计", "摄像头", "智能灯泡", "NB-IoT水表"]
  const minTime = new Date('2022-01-01 00:00:00').getTime()
  const maxTime = new Date('2025-12-31 23:59:59').getTime()

  for (let i = 0; i < 202; i++) { // (沿用你之前的202条设备)
    const activeTs = minTime + Math.random() * (maxTime - minTime)
    const lastOnlineTs = activeTs + Math.random() * (maxTime - activeTs)

    dbData.devices.push(Mock.mock({
      'id': '@guid',
      'name': '@ctitle(3, 7)',
      'status|1': ["在线", "离线", "未激活", "故障"],
      'puuid': /PU-202[3-5][0-9]{4}/,
      'productInfo': '@ctitle(2, 4) / PID_@string("upper", 8)',
      'deviceType|1': deviceTypes,
      'sn': /SN_[A-Z0-9]{12}/,
      'isBound|1-2': true,
      'dataCenter|1': dataCenters,
      'gmtActive': formatTimestamp(activeTs).split(' ')[0] + ' ' + formatTimestamp(activeTs).split(' ')[1].split('.')[0], // 格式化为 YYYY-MM-DD HH:mm:ss
      'gmtLastOnline': formatTimestamp(lastOnlineTs).split(' ')[0] + ' ' + formatTimestamp(lastOnlineTs).split(' ')[1].split('.')[0]
    }))
  }
  console.log(`--- [Mock Server] ${dbData.devices.length} 条设备数据生成完毕 ---`)


  // --- 3. ✨✨✨ (新功能) 生成设备日志 ✨✨✨ ---
  const logEvents = ['设备上报', '平台下发', '设备在线', '设备离线', '设备告警']
  const logTypes = ['数据转换', '状态通知', '云端处理', 'OTA升级', '告警事件']
  const logSources = ['设备本身', '平台下发', '云端规则']
  // 定义一个生成 Base64 风格字符串的 Mockjs 模板
  const detailsTemplate = /TkkAilQ[A-Za-z0-9+/=]{60,100}/

  let logIdCounter = 1

  // 为每个设备生成一些日志
  dbData.devices.forEach(device => {
    // 为每个设备生成 5 到 20 条日志
    const logCount = Mock.Random.integer(5, 20);
    for (let i = 0; i < logCount; i++) {
      const logTimeTs = minTime + Math.random() * (maxTime - minTime)

      const newLog = Mock.mock({
        id: logIdCounter++,
        deviceId: device.id, // 关联设备ID
        time: formatTimestamp(logTimeTs),
        'event|1': logEvents,
        'type|1': logTypes,
        'details': detailsTemplate, // <-- 使用你想要的格式
        'source|1': logSources,
        'switch|1-2': true
      })
      dbData.deviceLogs.push(newLog)
    }
  });

  // ✨ (优化) 按时间倒序排序，模拟真实日志查询
  dbData.deviceLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  console.log(`--- [Mock Server] ${dbData.deviceLogs.length} 条日志数据生成完毕 ---`)

  // --- 4. 写入文件 (覆盖) ---
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8')
  console.log('--- [Mock Server] db.json 文件已成功覆盖 ---')
}


// (启动时自动执行)
preSeedDatabase()

// =========================================
// 核心功能 2: 启动服务
// =========================================
const server = jsonServer.create()
const router = jsonServer.router(dbPath)
const middlewares = jsonServer.defaults()

server.use(middlewares)
// 解决CORS问题，暴露 X-Total-Count 响应头
server.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'X-Total-Count')
  next()
})
server.use(jsonServer.bodyParser)

// 登录接口
server.post('/api/auth/login', (req, res) => {
  const { account, password } = req.body
  if ((account === '1067360038@qq.com' && password === '123456') || (account === 'admin' && password === '123456')) {
    res.json({
      code: 200, message: "登录成功", success: true,
      data: { token: "mock_token_" + Mock.Random.string(32), userId: Mock.Random.guid(), nickname: "Admin", email: account }
    })
  } else {
    res.status(401).json({ code: 401, message: "账号或密码错误", success: false, data: null })
  }
})

// Token 校验 (暂时放行所有)
server.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') return next()
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    next()
  } else {
    // 方便调试，暂时放行
    console.warn(`[Mock Server] WARN: /api${req.path} 请求未携带 Token，已放行`)
    next()
  }
})

// 统计接口
server.get('/api/devices/summary', (req, res) => {
  const db = router.db
  const targetDataCenter = req.query.dataCenter
  let devices = db.get('devices').value()
  if (targetDataCenter) {
    devices = devices.filter(d => d.dataCenter === targetDataCenter)
  }
  res.json({
    code: 200, message: '获取成功',
    data: {
      total: devices.length,
      online: devices.filter(d => d.status === '在线').length,
      activated: devices.filter(d => d.status !== '未激活').length
    }
  })
})

// 统一返回格式
router.render = (req, res) => {
  // ✨ (新逻辑) 对 /api/devices 和 /api/deviceLogs 的 GET 请求进行分页处理
  if (req.method === 'GET' && (req.path === '/devices' || req.path === '/deviceLogs')) {
    // json-server 默认会处理 _page 和 _limit, 我们只需要把 data 包裹起来
    res.json({
      code: 200,
      message: '操作成功',
      success: true,
      data: res.locals.data
    })
  } else {
    // 其他请求 (如 POST, PUT, DELETE, 或 GET /devices/:id)
    res.json({
      code: 200,
      message: '操作成功',
      success: true,
      data: res.locals.data
    })
  }
}

server.use('/api', router)
server.listen(3000, () => {
  console.log('Mock Server running at http://localhost:3000/api')
})