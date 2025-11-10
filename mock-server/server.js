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
  const m = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()) + ':'
  const s = (date.getSeconds() < 10 ? '0' + (date.getSeconds()) : date.getSeconds()) + '.'
  const ms = (date.getMilliseconds() < 100 ? (date.getMilliseconds() < 10 ? '00' : '0') : '') + date.getMilliseconds()
  return Y + M + D + h + m + s + ms
}

// =========================================
// 核心功能 1: 提前自动造数据 (Pre-Seeding)
// =========================================
function preSeedDatabase() {
  // 1. 初始化 DB 结构 (✨ 新增 products, firmwares, upgradeTasks)
  let dbData = {
    devices: [],
    deviceLogs: [],
    products: [],
    firmwares: [],
    upgradeTasks: []
  }

  console.log('--- [Mock Server] 正在重新生成所有模拟数据... ---')

  // --- 2. ✨ (新增) 生成产品 ---
  const products = [
    { id: 'prod_light_01', name: '智能灯泡', type: '智能灯泡' },
    { id: 'prod_socket_01', name: '智能插座', type: '智能插座' },
    { id: 'prod_sensor_th', name: '温湿度计', type: '温湿度计' },
    { id: 'prod_cam_01', name: '摄像头', type: '摄像头' },
    { id: 'prod_water_meter', name: 'NB-IoT水表', type: 'NB-IoT水表' }
  ]
  dbData.products = products
  console.log(`--- [Mock Server] ${dbData.products.length} 条产品数据生成完毕 ---`)

  // --- 3. ✨ (新增) 生成固件 ---
  dbData.firmwares.push(
    {
      id: 'fw_001',
      version: '1.1.0',
      productId: 'prod_light_01',
      productName: '智能灯泡',
      releaseNotes: '1. 修复了低功耗模式下的连接 Bug \n2. 优化了配网速度',
      fileUrl: '/files/firmware_1.1.0.bin',
      uploadedAt: formatTimestamp(new Date('2024-10-26T10:00:00Z').getTime()).split('.')[0]
    },
    {
      id: 'fw_002',
      version: '1.0.1',
      productId: 'prod_socket_01',
      productName: '智能插座',
      releaseNotes: '1. 紧急修复安全漏洞',
      fileUrl: '/files/firmware_1.0.1.bin',
      uploadedAt: formatTimestamp(new Date('2024-10-25T14:30:00Z').getTime()).split('.')[0]
    },
    {
      id: 'fw_003',
      version: '2.0.0',
      productId: 'prod_cam_01',
      productName: '摄像头',
      releaseNotes: '1. 增加 AI 人形检测 \n2. 优化夜视模式',
      fileUrl: '/files/firmware_2.0.0.bin',
      uploadedAt: formatTimestamp(new Date('2024-10-27T11:00:00Z').getTime()).split('.')[0]
    }
  )
  console.log(`--- [Mock Server] ${dbData.firmwares.length} 条固件数据生成完毕 ---`)

  // --- 4. ✨ (修改) 生成设备 (集成产品和固件逻辑) ---
  const dataCenters = ['CN', 'US-WEST', 'EU-CENTRAL', 'IN', 'US-EAST', 'EU-WEST', 'SG']
  const minTime = new Date('2022-01-01 00:00:00').getTime()
  const maxTime = new Date('2025-12-31 23:59:59').getTime()

  const productMap = {}
  products.forEach(p => { productMap[p.type] = p })

  for (let i = 0; i < 202; i++) {
    const activeTs = minTime + Math.random() * (maxTime - minTime)
    const lastOnlineTs = activeTs + Math.random() * (maxTime - activeTs)

    // 随机选择一个产品类型
    const randomProduct = Mock.Random.pick(products)

    // 决定此设备的固件版本
    let firmwareVersion = '1.0.0' // 默认旧版本
    let hasNewFirmware = false

    // 检查是否有适用于此产品的固件
    const latestFirmware = dbData.firmwares.find(f => f.productId === randomProduct.id)
    if (latestFirmware) {
      // 50% 的几率让设备处于旧版本
      if (Math.random() < 0.5) {
        hasNewFirmware = true
      } else {
        firmwareVersion = latestFirmware.version
        hasNewFirmware = false
      }
    }

    dbData.devices.push(Mock.mock({
      'id': '@guid',
      'name': '@ctitle(3, 7)',
      'status|1': ["在线", "离线", "未激活", "故障"],
      'puuid': /PU-202[3-5][0-9]{4}/,
      'productInfo': `${randomProduct.name} / ${randomProduct.id}`,
      'deviceType': randomProduct.type,
      'productId': randomProduct.id, // ⬅️ ✨ 新增
      'firmwareVersion': firmwareVersion, // ⬅️ ✨ 新增
      'hasNewFirmware': hasNewFirmware, // ⬅️ ✨ 新增
      'sn': /SN_[A-Z0-9]{12}/,
      'isBound|1-2': true,
      'dataCenter|1': dataCenters,
      'gmtActive': formatTimestamp(activeTs).split(' ')[0] + ' ' + formatTimestamp(activeTs).split(' ')[1].split('.')[0], // 格式化为 YYYY-MM-DD HH:mm:ss
      'gmtLastOnline': formatTimestamp(lastOnlineTs).split(' ')[0] + ' ' + formatTimestamp(lastOnlineTs).split(' ')[1].split('.')[0]
    }))
  }
  console.log(`--- [Mock Server] ${dbData.devices.length} 条设备数据生成完毕 ---`)


  // --- 5. ✨ (新增) 生成一些已完成的升级任务 (用于历史) ---
  dbData.upgradeTasks.push({
    id: 'task_' + Mock.Random.guid(),
    deviceId: dbData.devices[0].id,
    deviceName: dbData.devices[0].name,
    firmwareId: 'fw_001',
    firmwareVersion: '1.1.0',
    status: 'success', // 'pending', 'downloading', 'installing', 'success', 'failed'
    progress: 100,
    errorMessage: null,
    startedAt: formatTimestamp(new Date('2024-10-27T11:00:00Z').getTime()).split('.')[0],
    finishedAt: formatTimestamp(new Date('2024-10-27T11:05:00Z').getTime()).split('.')[0]
  })
  dbData.upgradeTasks.push({
    id: 'task_' + Mock.Random.guid(),
    deviceId: dbData.devices[1].id,
    deviceName: dbData.devices[1].name,
    firmwareId: 'fw_002',
    firmwareVersion: '1.0.1',
    status: 'failed',
    progress: 40,
    errorMessage: '设备意外离线',
    startedAt: formatTimestamp(new Date('2024-10-26T11:00:00Z').getTime()).split('.')[0],
    finishedAt: formatTimestamp(new Date('2024-10-26T11:02:00Z').getTime()).split('.')[0]
  })
  console.log(`--- [Mock Server] ${dbData.upgradeTasks.length} 条历史升级任务生成完毕 ---`)

  // --- 6. (沿用) 生成设备日志 ---
  const logEvents = ['设备上报', '平台下发', '设备在线', '设备离线', '设备告警']
  const logTypes = ['数据转换', '状态通知', '云端处理', 'OTA升级', '告警事件']
  const logSources = ['设备本身', '平台下发', '云端规则']
  const detailsTemplate = /TkkAilQ[A-Za-z0-9+/=]{60,100}/
  let logIdCounter = 1

  dbData.devices.forEach(device => {
    const logCount = Mock.Random.integer(5, 20);
    for (let i = 0; i < logCount; i++) {
      const logTimeTs = minTime + Math.random() * (maxTime - minTime)
      const newLog = Mock.mock({
        id: logIdCounter++,
        deviceId: device.id,
        time: formatTimestamp(logTimeTs),
        'event|1': logEvents,
        'type|1': logTypes,
        'details': detailsTemplate,
        'source|1': logSources,
        'switch|1-2': true
      })
      dbData.deviceLogs.push(newLog)
    }
  });
  dbData.deviceLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  console.log(`--- [Mock Server] ${dbData.deviceLogs.length} 条日志数据生成完毕 ---`)

  // --- 7. 写入文件 (覆盖) ---
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
server.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'X-Total-Count')
  next()
})
server.use(jsonServer.bodyParser)

// 登录接口 (沿用)
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

// Token 校验 (沿用)
server.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') return next()
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    next()
  } else {
    console.warn(`[Mock Server] WARN: /api${req.path} 请求未携带 Token，已放行`)
    next()
  }
})

// 统计接口 (沿用)
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

// =========================================
// ✨✨✨ 阶段一 (步骤 2): 新增自定义 API 路由 ✨✨✨
// =========================================

// 1. (新增) 模拟固件上传
server.post('/api/firmwares', (req, res) => {
  const db = router.db
  const { version, productId, releaseNotes } = req.body

  // 找到产品名称
  const product = db.get('products').find({ id: productId }).value()
  if (!product) {
    return res.status(404).json({ code: 404, message: "产品不存在", success: false })
  }

  const newFirmware = {
    id: 'fw_' + Mock.Random.guid(),
    version,
    productId,
    productName: product.name,
    releaseNotes,
    fileUrl: `/files/firmware_${version}.bin`,
    uploadedAt: formatTimestamp(Date.now()).split('.')[0]
  }

  db.get('firmwares').push(newFirmware).write()

  // (模拟) 找到所有使用这个产品的设备，并设置 hasNewFirmware = true
  // (注意: 这是一个简化的模拟，没有做版本对比，实际应由后端完成)
  const devicesToUpdate = db.get('devices').filter({ productId: productId }).value()
  devicesToUpdate.forEach(device => {
    db.get('devices').find({ id: device.id }).assign({ hasNewFirmware: true }).write()
  })

  res.json({ code: 200, message: '上传成功', success: true, data: newFirmware })
})

// 2. (新增) 触发设备升级
server.post('/api/devices/upgrade', (req, res) => {
  const db = router.db
  const { deviceId } = req.body

  const device = db.get('devices').find({ id: deviceId }).value()
  if (!device) {
    return res.status(404).json({ code: 404, message: "设备不存在", success: false })
  }

  // 找到该产品的最新固件
  const latestFirmware = db.get('firmwares')
    .filter({ productId: device.productId })
    .sortBy('uploadedAt')
    .last()
    .value()

  if (!latestFirmware) {
    return res.status(400).json({ code: 400, message: "没有找到适用于该设备的固件", success: false })
  }

  const newTask = {
    id: 'task_' + Mock.Random.guid(),
    deviceId: device.id,
    deviceName: device.name,
    firmwareId: latestFirmware.id,
    firmwareVersion: latestFirmware.version,
    status: 'pending', // 立即进入 pending 状态
    progress: 0,
    errorMessage: null,
    startedAt: formatTimestamp(Date.now()).split('.')[0],
    finishedAt: null
  }

  db.get('upgradeTasks').push(newTask).write()

  // 立即将设备状态更新为 "升级中" (模拟)
  db.get('devices').find({ id: deviceId }).assign({ status: '升级中' }).write()

  res.json({ code: 200, message: '升级任务已启动', success: true, data: newTask })
})

// 3. (新增) 轮询升级任务状态
server.get('/api/upgrade-task/:id', (req, res) => {
  const db = router.db
  const taskId = req.params.id

  const task = db.get('upgradeTasks').find({ id: taskId }).value()

  if (!task) {
    return res.status(404).json({ code: 404, message: "任务不存在", success: false })
  }

  // 模拟状态机进展
  if (task.status === 'pending') {
    task.status = 'downloading'
    task.progress = 20
  } else if (task.status === 'downloading') {
    task.progress += Mock.Random.integer(20, 30)
    if (task.progress >= 90) {
      task.status = 'installing'
      task.progress = 90
    }
  } else if (task.status === 'installing') {
    // 模拟 10% 几率失败
    if (Math.random() < 0.1) {
      task.status = 'failed'
      task.errorMessage = '升级包校验失败'
      task.finishedAt = formatTimestamp(Date.now()).split('.')[0]
      // 模拟设备回滚状态
      db.get('devices').find({ id: task.deviceId }).assign({ status: '故障' }).write()
    } else {
      task.status = 'success'
      task.progress = 100
      task.finishedAt = formatTimestamp(Date.now()).split('.')[0]
      // 模拟设备升级成功
      db.get('devices').find({ id: task.deviceId }).assign({
        status: '在线',
        firmwareVersion: task.firmwareVersion,
        hasNewFirmware: false
      }).write()
    }
  }
  // 如果是 success 或 failed，则不再改变状态

  // 将更新写回 db.json
  db.get('upgradeTasks').find({ id: taskId }).assign(task).write()

  res.json({ code: 200, message: '获取成功', success: true, data: task })
})


// =========================================
// 统一返回格式 (✨ 修改)
// =========================================
router.render = (req, res) => {
  // ✨ (修改) 扩展分页路由，使其也包含 /firmwares 和 /upgradeTasks
  const pagedRoutes = ['/devices', '/deviceLogs', '/firmwares', '/upgradeTasks']

  if (req.method === 'GET' && pagedRoutes.includes(req.path)) {
    // json-server 默认会处理 _page 和 _limit, 我们只需要把 data 包裹起来
    res.json({
      code: 200,
      message: '操作成功',
      success: true,
      data: res.locals.data // data 是一个数组
    })
  } else {
    // 其他请求 (如 POST, PUT, DELETE, 或 GET /devices/:id)
    res.json({
      code: 200,
      message: '操作成功',
      success: true,
      data: res.locals.data // data 是一个对象
    })
  }
}

server.use('/api', router)
server.listen(3000, () => {
  console.log('Mock Server running at http://localhost:3000/api')
})