const jsonServer = require('json-server')
const path = require('path')
const fs = require('fs')
const Mock = require('mockjs')

const dbPath = path.join(__dirname, 'db.json')

// =========================================
// 辅助函数: 生成指定范围内的随机时间
// =========================================
function getRandomTimeStr(startYear, endYear) {
  const startDate = new Date(`${startYear}-01-01 00:00:00`).getTime()
  const endDate = new Date(`${endYear}-12-31 23:59:59`).getTime()
  const randomTime = startDate + Math.random() * (endDate - startDate)
  const date = new Date(randomTime)

  // 手动格式化为 "YYYY-MM-DD HH:mm:ss"
  const Y = date.getFullYear() + '-'
  const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
  const D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' '
  const h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':'
  const m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':'
  const s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())

  return Y + M + D + h + m + s
}

// =========================================
// 核心功能 1: 提前自动造数据 (Pre-Seeding)
// =========================================
function preSeedDatabase() {
  let dbData = { devices: [] }
  if (fs.existsSync(dbPath)) {
    try {
      dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    } catch (e) { /* ignore */ }
  }

  if (!dbData.devices || dbData.devices.length < 100) {
    console.log('--- [Mock Server] 正在生成 2022-2025 年间的 500 条数据... ---')
    const dataCenters = ['CN', 'US-WEST', 'EU-CENTRAL', 'IN', 'US-EAST', 'EU-WEST', 'SG']
    const deviceTypes = ["智能插座", "温湿度计", "摄像头", "智能灯泡", "NB-IoT水表"]

    const newDevices = []
    for (let i = 0; i < 500; i++) {
      // 使用我们自定义的函数生成时间
      const randomTime1 = getRandomTimeStr(2022, 2025)
      const randomTime2 = getRandomTimeStr(2022, 2025)
      newDevices.push(Mock.mock({
        'id': '@guid',
        'name': '@ctitle(3, 7)',
        'status|1': ["在线", "离线", "未激活", "故障"],
        'puuid': /PU-202[3-5][0-9]{4}/,
        'productInfo': '@ctitle(2, 4) / PID_@string("upper", 8)',
        'deviceType|1': deviceTypes,
        'sn': /SN_[A-Z0-9]{12}/,
        'isBound|1-2': true,
        'dataCenter|1': dataCenters,
        'gmtActive': randomTime1,      // 使用生成的固定时间
        'gmtLastOnline': randomTime2   // 简单起见，最近上线时间设为和激活时间一样
      }))
    }
    dbData.devices = newDevices;
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8')
    console.log('--- [Mock Server] 数据生成完毕 ---')
  }
}

preSeedDatabase()

// =========================================
// 核心功能 2: 启动服务
// =========================================
const server = jsonServer.create()
const router = jsonServer.router(dbPath)
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

// 登录接口
server.post('/api/auth/login', (req, res) => {
  const { account, password } = req.body
  if (account === '1067360038@qq.com' && password === '123456') {
    res.json({
      code: 200, message: "登录成功", success: true,
      data: { token: "mock_token_" + Mock.Random.string(32), userId: Mock.Random.guid(), nickname: "Admin", email: account }
    })
  } else {
    res.status(401).json({ code: 401, message: "账号或密码错误", success: false, data: null })
  }
})

// Token 校验
server.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') return next()
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    next()
  } else {
    next() // 暂且放行，方便调试
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
  res.json({ code: 200, message: '操作成功', success: true, data: res.locals.data })
}

server.use('/api', router)
server.listen(3000, () => {
  console.log('Mock Server running at http://localhost:3000/api')
})