// src/mock/index.ts
import Mock from 'mockjs'

Mock.setup({
  timeout: '500-1000'
})

// --- 1. 定义我们的“基础”数据模板 ---
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

// --- 2. 修复：使用时间戳来生成日期 ---

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

const deviceList = [];
const count = Mock.Random.integer(15, 60);

// 定义时间范围的时间戳
const startTimeStamp = new Date('2022-01-01 00:00:00').getTime();
const nowTimeStamp = new Date().getTime(); // 当前时间的时间戳

for (let i = 0; i < count; i++) {
  const baseItem = Mock.mock(baseTemplate);
  
  // 1. 在 '2022-01-01' 和 '现在' 之间生成一个“激活时间戳”
  const gmtActiveTimeStamp = Mock.Random.integer(startTimeStamp, nowTimeStamp);
  
  // 2. 在 '激活时间戳' 和 '现在' 之间生成一个“最近上线时间戳”
  const gmtLastOnlineTimeStamp = Mock.Random.integer(gmtActiveTimeStamp, nowTimeStamp);
  
  // 3. 格式化时间戳为日期字符串
  const gmtActive = formatDate(new Date(gmtActiveTimeStamp));
  const gmtLastOnline = formatDate(new Date(gmtLastOnlineTimeStamp));
  
  deviceList.push({
    ...baseItem,
    gmtActive,
    gmtLastOnline
  });
}

// 这就是我们的“模拟数据库”
let deviceDatabase = deviceList;


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
    ...Mock.mock(baseTemplate), 
    id: '@id'
  }
  deviceDatabase.push(savedDevice)
  
  return Mock.mock({
    code: 200,
    message: '添加成功',
    data: savedDevice
  })
})

// 规则 3：[GET] /devices (带筛选)
//    正则表达式匹配所有以 /api/devices 结尾的URL
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
  const keyword = getQueryParam(url, 'keyword')
const isBoundParam = getQueryParam(url, 'isBound')

  console.log('收到的筛选参数:', { startDate, endDate, keyword })

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