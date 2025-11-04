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
// --- 定义 API 拦截规则 (重要：注意顺序！) ---
// ------------------------------------

// 规则 1：[GET] /summary (最具体的 GET 规则，必须放最前面)
Mock.mock(/\/api\/devices\/summary$/, 'get', () => {
  console.log('--- [Mock API] GET /api/devices/summary (卡片数据) ---')
  const total = deviceDatabase.length
  const online = deviceDatabase.filter((item: { status: string; }) => item.status === '在线').length
  
  return Mock.mock({
    code: 200,
    message: '获取成功',
    data: {
      total: total,
      activated: total, 
      online: online
    }
  })
})

// 规则 2：[POST] /devices (POST 规则，也很具体)
Mock.mock(/\/api\/devices$/, 'post', (options) => {
  console.log('--- [Mock API] POST /api/devices (添加设备) ---')
  const newDevice = JSON.parse(options.body)
  const savedDevice = {
    ...newDevice,
    ...Mock.mock(deviceTemplate), 
    id: '@id'
  }
  deviceDatabase.push(savedDevice)
  
  return Mock.mock({
    code: 200,
    message: '添加成功',
    data: savedDevice
  })
})

// 1. 拦截 [GET] /api/devices (获取设备列表)
//    正则表达式匹配所有以 /api/devices 结尾的URL
// 新的 GET /api/devices 规则 (带筛选逻辑)
Mock.mock(/\/api\/devices/, 'get', (options) => {
  console.log('--- [Mock API] GET /api/devices (表格数据) ---')
  
  // 1. Mock.js 通过 options.url 来获取完整的请求URL，包括参数
  //    我们需要一个辅助函数来解析 URL 参数
  const getQueryParam = (url:any, param:any) => {
    const reg = new RegExp(`[?&]${param}=([^&]*)`)
    const result = url.match(reg)
    return result ? decodeURIComponent(result[1]) : null
  }

  // 2. 从请求 URL 中解析出我们关心的参数
  const { url } = options
  const startDate = getQueryParam(url, 'startDate')
  const endDate = getQueryParam(url, 'endDate')
  // (您也可以在这里添加对 keyword 等其他参数的解析)

  console.log('收到的筛选参数:', { startDate, endDate })

  // 3. 复制一份“数据库”数据，准备进行过滤
  let filteredData = [...deviceDatabase]

  // 4. 执行日期筛选逻辑
  if (startDate && endDate) {
    // 将字符串日期转换为 Date 对象以便比较
    const start = new Date(startDate)
    // 结束日期我们通常希望包含当天，所以设置到 23:59:59
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999) 

    filteredData = filteredData.filter(item => {
      // 假设我们按“首次激活时间” (gmtActive) 筛选
      const itemDate = new Date(item.gmtActive)
      return itemDate >= start && itemDate <= end
    })
  }
  
  // (您可以在这里添加更多 filter 逻辑，比如按 keyword 筛选)
  // if (keyword) { ... }

  console.log('筛选后的数据量:', filteredData.length)

  // 5. 返回筛选后的数据
  return Mock.mock({
    code: 200,
    message: '获取成功',
    data: filteredData 
  })
})