// src/api/index.ts
// 这是一个统一导出文件，为了保持向后兼容
// 以后建议直接从 '@/api/modules/xxx' 导入

export * from './modules/auth'
export * from './modules/device'
export * from './modules/firmware'
export * from './modules/campaign'

// 也可以导出一个默认对象，包含所有 API（如果有的地方是 import api from '@/api' 这样用的）
import * as auth from './modules/auth'
import * as device from './modules/device'
import * as firmware from './modules/firmware'
import * as campaign from './modules/campaign'

export default {
  ...auth,
  ...device,
  ...firmware,
  ...campaign
}