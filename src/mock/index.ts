// src/mock/index.ts
console.log('--- MOCK SERVER IS RUNNING! ---');

import Mock from 'mockjs'
// 模拟网络延迟 500ms - 1000ms
Mock.setup({
  timeout: '500-1000'
})

// --- 模拟我们的“后端数据库” ---
// 我们用 Mock.js 的数据生成功能先创建几条假数据
// const initialData = Mock.mock({
//   'list|10': [{ // 随机生成 3 条数据
//     'id|+1': 1,
//     'name': '@ctitle(3, 7)', // 随机中文标题
//     'deviceId': 'ESP32-@string("upper", 6)', // 随机字符串
//     'status': '@pick(["在线", "离线"])', // 从列表中随机选一个
//     'lastOnline': '@datetime("yyyy-MM-dd HH:mm:ss")' // 随机日期时间
//   }]
// })
// --- 1. 定义我们的“涂鸦”数据模板 ---
const deviceTemplate = {
  'id': '@id',
  'name': '@ctitle(3, 7)', // 随机中文标题
  'status': '@pick(["在线", "离线", "未激活", "故障"])',
  'puuid': '@guid',
  'productInfo': '@ctitle(2, 4) / PID_@string("upper", 8)',
  'deviceType': '@pick(["智能插座", "温湿度计", "摄像头", "智能灯泡", "NB-IoT水表"])',
  'sn': 'SN_@string("upper", 12)',
  'gmtActive': '@datetime("yyyy-MM-dd HH:mm:ss")',
  'gmtLastOnline': '@datetime("yyyy-MM-dd HH:mm:ss")'
};

// --- 2. 生成我们的“模拟数据库” ---
// 'list|5-10' 表示 list 数组将包含 5 到 10 条数据
// 每一条数据都遵循 deviceTemplate 的规则
const mockData = Mock.mock({
  'list|50-100': [deviceTemplate]
})
// 这就是我们的“模拟数据库”，它可以被修改
let deviceDatabase = mockData.list

// ------------------------------------
// --- 定义 API 拦截规则 ---
// ------------------------------------

// 1. 拦截 [GET] /api/devices (获取设备列表)
//    正则表达式匹配所有以 /api/devices 结尾的URL
Mock.mock(/\/api\/devices$/, 'get', () => {
  console.log('--- [Mock API] GET /api/devices ---')
  console.log('当前数据库:', deviceDatabase)

  // 返回 mockjs 风格的数据结构
  return Mock.mock({
    code: 200,
    message: '获取成功',
    data: deviceDatabase // 返回我们“数据库”中的所有数据
  })
})

// 2. 拦截 [POST] /api/devices (添加新设备)
Mock.mock(/\/api\/devices/, 'post', (options:any) => {
  console.log('--- [Mock API] POST /api/devices ---')
  console.log('收到的请求体:', options.body)
  
  // options.body 是一个 JSON 字符串，我们需要把它转成对象
  const newDevice = JSON.parse(options.body)
  
  // 模拟后端的处理：给新设备一个ID和默认状态
  const savedDevice = {
    ...newDevice,
    id: deviceDatabase.length + 1,
    status: '在线',
    lastOnline: new Date().toLocaleString()
  }
  
  // 将新设备存入“数据库”
  deviceDatabase.push(savedDevice)
  
  return Mock.mock({
    code: 200,
    message: '添加成功',
    data: savedDevice // 把保存后的设备信息返回
  })
})

// ------------------------------------
// --- 新增 API：获取统计数据 ---
// ------------------------------------

// 3. 拦截 [GET] /api/devices/summary (获取统计信息)
Mock.mock(/\/api\/devices\/summary$/, 'get', () => {
  console.log('--- [Mock API] GET /api/devices/summary ---')
  
  // 我们根据“数据库”的实时数据来计算
  const total = deviceDatabase.length
  const online = deviceDatabase.filter((item:any) => item.status === '在线').length
  
  return Mock.mock({
    code: 200,
    message: '获取成功',
    data: {
      total: total,
      activated: total, // 暂时假设 激活 = 总数
      online: online
    }
  })
})