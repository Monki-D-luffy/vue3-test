// src/mock/index.ts
import Mock from 'mockjs'

Mock.setup({
  timeout: '500-1000'
})

// --- 定义我们的“基础”数据模板 ---
//    (我们把日期字段拿出来了)
const baseTemplate = {
  'id': '@id',
  'name': '@ctitle(3, 7)',
  'status': '@pick(["在线", "离线", "未激活", "故障"])',
  'puuid': '@guid',
  'productInfo': '@ctitle(2, 4) / PID_@string("upper", 8)',
  'deviceType': '@pick(["智能插座", "温湿度计", "摄像头", "智能灯泡", "NB-IoT水表"])',
  'sn': 'SN_@string("upper", 12)',
  'isBound': '@boolean'
};

// --- 修复：使用时间戳来生成日期 ---

// 辅助函数：用于格式化日期
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const i = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${i}:${s}`;
}
// (辅助函数 formatDate ... 保持不变)

// ▼▼▼ 替换旧代码 ▼▼▼

//  创建一个“主数据库”，用于存放所有数据中心的数据
// 使用 Record 工具类型，表示“一个键为string，值为any[]的对象”
let masterDeviceDatabase: Record<string, any[]> = {};

//  创建一个函数，用于获取或“动态生成”指定数据中心的数据
const getOrGenerateDataCenterDB = (dataCenter: string) => {
  // 2.1 如果这个数据中心的数据已经生成过了，就直接返回
  if (masterDeviceDatabase[dataCenter]) {
    return masterDeviceDatabase[dataCenter];
  }

  // 2.2 如果没生成过，就现在生成
  console.log(`--- [Mock] 首次生成 ${dataCenter} 的模拟数据 ---`);
  const deviceList = [];

  // 不同的数据中心，我们给它不同数量的设备
  let count;
  switch (dataCenter) {
    case 'CN':
      count = Mock.Random.integer(50, 70); break;
    case 'US-WEST':
      count = Mock.Random.integer(30, 40); break;
    case 'EU-CENTRAL':
      count = Mock.Random.integer(20, 25); break;
    default:
      count = Mock.Random.integer(5, 15);
  }

  const startTimeStamp = new Date('2022-01-01 00:00:00').getTime();
  const nowTimeStamp = new Date().getTime();

  for (let i = 0; i < count; i++) {
    const baseItem = Mock.mock(baseTemplate);
    const gmtActiveTimeStamp = Mock.Random.integer(startTimeStamp, nowTimeStamp);
    const gmtLastOnlineTimeStamp = Mock.Random.integer(gmtActiveTimeStamp, nowTimeStamp);
    const gmtActive = formatDate(new Date(gmtActiveTimeStamp));
    const gmtLastOnline = formatDate(new Date(gmtLastOnlineTimeStamp));

    deviceList.push({
      ...baseItem,
      gmtActive,
      gmtLastOnline
    });
  }

  // 2.3 存入主数据库并返回
  masterDeviceDatabase[dataCenter] = deviceList;
  return deviceList;
}

// ▲▲▲ 替换旧代码 ▲▲▲


// ------------------------------------
// --- 定义 API 拦截规则 (重要：注意顺序！) ---
// ------------------------------------
// 1. Mock.js 通过 options.url 来获取完整的请求URL，包括参数
//    我们需要一个辅助函数来解析 URL 参数
const getQueryParam = (url: any, param: any) => {
  const reg = new RegExp(`[?&]${param}=([^&]*)`)
  const result = url.match(reg)
  return result ? decodeURIComponent(result[1]) : null
}

// 规则 1：[GET] /summary (最具体的 GET 规则，必须放最前面)
Mock.mock(/\/api\/devices\/summary/, 'get', function (this: any) {
  console.log('--- [Mock API] GET /api/devices/summary (卡片数据) ---')
  console.log('summary get token', this);

  // 假设前端通过 URL 参数传递 token（如 ?token=xxx），否则跳过校验
  if (!this.requestHeaders || !this.requestHeaders.authorization) {
    console.warn('--- [Mock API] 拦截：请求未携带 Token ---')
    return Mock.mock({
      "code": 401,
      "message": "未授权：请先登录 (Mock)",
      "data": null,
      "success": false
    })
  }
  // 1. 获取 dataCenter 参数，如果不存在，默认为 'CN'
  const dataCenter = getQueryParam(this.url, 'dataCenter') || 'CN';
  // 2. 获取对应数据中心的数据库
  const currentDB = getOrGenerateDataCenterDB(dataCenter);

  // 3. 从当前数据库计算
  const total = currentDB.length
  const online = currentDB.filter(item => item.status === '在线').length
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

// 规则 1.5：[POST] /auth/login (登录接口)
Mock.mock(/\/api\/auth\/login$/, 'post', (options) => {
  console.log('--- [Mock API] POST /api/auth/login (登录请求) ---')

  // 1. 从请求体中解析出账号和密码
  const body = JSON.parse(options.body)
  const { account, password } = body
  console.log('收到的登录信息:', { account, password })

  // 2. 简单的登录逻辑校验
  //    (我们只校验您提供的测试账号)
  if (account === '1067360038@qq.com' && password === '123456') {

    // 3. 登录成功：返回您提供的“成功”数据结构
    return Mock.mock({
      "code": 200,
      "message": "登录成功",
      "data": {
        "expired": 1762248989,
        "phone": "",
        "country": null,
        "iconUrl": "",
        "registerType": "Email",
        "nickname": "Qin",
        "userId": "c09e98c1-e353-48be-82eb-c209b42f180a",
        "account": "1067360038@qq.com",
        "email": "1067360038@qq.com",
        "token": "eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySWQiOiJjMDllOThjMS1lMzUzLTQ4YmUtODJlYi1jMjA5YjQyZjE4MGEiLCJleHAiOjE3NjIyNDg5ODksImlzcyI6ImlkZW50aXR5LXNlcnZpY2UiLCJhdWQiOiJpZGVudGl0eS1jbGllbnRzIn0.As6xzctjQyvNE4GcGUH3uAJWlh9BaG3fTIyy2GWEvnc"
      },
      "success": true
    })

  } else {

    // 4. 登录失败：返回一个“失败”的数据结构
    return Mock.mock({
      "code": 401,
      "message": "账号或密码错误",
      "data": null,
      "success": false
    })
  }
})

// 规则 2：[POST] /devices (POST 规则，也很具体)
Mock.mock(/\/api\/devices$/, 'post', function (this: any) {
  console.log('--- [Mock API] POST /api/devices (添加设备) ---')
  console.log('post token', this);

  // 假设前端通过 URL 参数传递 token（如 ?token=xxx），否则跳过校验
  if (!this.headers || !this.headers.authorization) {
    console.warn('--- [Mock API] 拦截：请求未携带 Token ---')
    return Mock.mock({
      "code": 401,
      "message": "未授权：请先登录 (Mock)",
      "data": null,
      "success": false
    })
  }

  // 1. 获取 dataCenter 参数
  const dataCenter = getQueryParam(this.url, 'dataCenter') || 'CN';
  // 2. 获取对应数据中心的数据库
  const currentDB = getOrGenerateDataCenterDB(dataCenter);

  // ( ... 保持 savedDevice 的生成逻辑不变 ... )
  const newDevice = JSON.parse(this.body)
  const gmtActive = formatDate(new Date());
  const gmtLastOnline = gmtActive;
  const savedDevice = {
    ...Mock.mock(baseTemplate),
    ...newDevice,
    gmtActive,
    gmtLastOnline,
    status: '在线'
  }

  // 3. 将新设备添加到“当前”数据库
  currentDB.push(savedDevice)

  return Mock.mock({
    code: 200,
    message: '添加成功',
    data: savedDevice
  })
})

// 规则 3：[GET] /devices (带筛选)
//    正则表达式匹配所有以 /api/devices 结尾的URL
Mock.mock(/\/api\/devices/, 'get', function (this: any) {
  console.log('--- [Mock API] GET /api/devices (表格数据) ---')
  console.log('get token', this);

  // 假设前端通过 URL 参数传递 token（如 ?token=xxx），否则跳过校验
  if (!this.headers || !this.headers.authorization) {
    console.warn('--- [Mock API] 拦截：请求未携带 Token ---')
    return Mock.mock({
      "code": 401,
      "message": "未授权：请先登录 (Mock)",
      "data": null,
      "success": false
    })
  }

  // 1. 解析所有参数，包括 dataCenter
  const { url } = this
  const dataCenter = getQueryParam(url, 'dataCenter') || 'CN';
  const startDate = getQueryParam(url, 'startDate')
  const endDate = getQueryParam(url, 'endDate')
  const keyword = getQueryParam(url, 'keyword')
  const isBoundParam = getQueryParam(url, 'isBound')

  console.log('收到的筛选参数:', { dataCenter, startDate, endDate, keyword, isBound: isBoundParam })

  // 2. 获取对应数据中心的数据库
  const currentDB = getOrGenerateDataCenterDB(dataCenter);

  // 3. 将筛选目标从 deviceDatabase 改为 currentDB
  let filteredData = [...currentDB]

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

  // 5. ▼▼▼ 新增：关键字筛选逻辑 ▼▼▼
  //    只有当 keyword 存在且不是空字符串时才执行
  if (keyword && keyword.trim() !== '') {
    const lowerKeyword = keyword.toLowerCase().trim()

    filteredData = filteredData.filter(item => {
      // 检查所有相关字段是否包含关键字 (不区分大小写)

      // 设备ID/设备名称 (来自UI)
      const nameMatch = item.name.toLowerCase().includes(lowerKeyword)
      const idMatch = item.id.toLowerCase().includes(lowerKeyword)

      // 您新要求的字段
      const snMatch = item.sn.toLowerCase().includes(lowerKeyword)
      const productMatch = item.productInfo.toLowerCase().includes(lowerKeyword)
      const puuidMatch = item.puuid.toLowerCase().includes(lowerKeyword)

      // 只要有一个字段匹配，就返回 true
      return nameMatch || idMatch || snMatch || productMatch || puuidMatch
    })
  }
  //6. isBoundParam 会是 "true" (字符串), "false" (字符串), 或 null
  if (isBoundParam !== '') {
    // 将URL参数 "true" 或 "false" 转换回布尔值
    const isBoundValue = (isBoundParam === 'true');

    filteredData = filteredData.filter(item => {
      return item.isBound === isBoundValue
    })
  }
  console.log('筛选后的数据量:', filteredData.length)

  // 返回筛选后的数据
  return Mock.mock({
    code: 200,
    message: '获取成功',
    data: filteredData
  })
})