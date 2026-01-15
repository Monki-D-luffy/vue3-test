// src/types/index.ts

// ==========================================
// 1. 基础实体 (User, Device)
// ==========================================

// 用户信息
export interface UserInfo {
  userId: string;
  nickname: string;
  email: string;
  avatar?: string;
  token?: string; // 登录响应中通常包含 token
  id?: string | number;
  username?: string;
}

// 注册请求数据
export interface UserRegisterData {
  email: string;
  password: string;
  nickname?: string; // 可选昵称
  confirmPassword?: string; // 前端验证用
}

export type DeviceStatusType = '在线' | '离线' | '故障' | '未激活' | '升级中';
// 设备对象
export interface Device {
  id: string;
  name: string;
  status: DeviceStatusType;
  firmwareVersion: string;
  puuid: string;
  productId: string;
  productName?: string;
  sn: string;
  gmtActive: string;     // ISO 8601 字符串
  gmtLastOnline: string; // ISO 8601 字符串
  isBound: boolean;
  dataCenter: string;
  hasNewFirmware?: boolean;
}

// ==========================================
// 2. 筛选与参数 (Filters, Params)
// ==========================================

// 设备列表筛选参数
export interface DeviceListFilters {
  isBound?: string;
  productId?: string;
  dateRange?: [Date, Date] | null; // Element Plus 返回的是 Date 对象数组
  keyword?: string;
  dataCenter?: string;
}

// 传递给 API 的实际查询参数（日期已转字符串，包含分页）
export interface DeviceQueryParams {
  _page?: number;
  _limit?: number;
  isBound?: string;
  productId?: string;
  q?: string;           // 对应 keyword
  gmtActive_gte?: string; // 开始时间
  gmtActive_lte?: string; // 结束时间
  dataCenter?: string;
  [key: string]: any;   // 允许少量扩展，但主要字段已强类型化
}

// 日志查询参数
export interface DeviceLogQueryParams {
  deviceId: string;

  // 真实接口参数
  pageIndex?: number;
  pageSize?: number;
  eventId?: string | number; // 对应 dpid

  // Mock 参数 (保留以防万一)
  _page?: number;
  _limit?: number;

  startTime?: string;
  endTime?: string;
  type?: string;
}

// 通用分页请求参数
export interface PaginationParams {
  _page: number;
  _limit: number;
  [key: string]: any; // 允许额外的过滤字段
}

// ==========================================
// 3. 产品与固件 (Product, Firmware)
// ==========================================

export interface Product {
  id: string;
  name: string;
  type: string;           // 产品类型 (e.g. "WiFi", "Zigbee")
  nodeType: number;
  productKey: string;
  category?: string;      // 行业分类 (e.g. "智能家居")
  description?: string;   // 产品描述
  deviceCount?: number;   // 关联设备数
  gmtCreate?: string;     // 创建时间
  icon?: string;          // 产品图标
  apiKey?: string;        // 用于显示的 API Key (如果有)
}

export interface Firmware {
  id: string;
  version: string;
  productId: string;
  productName: string;
  releaseNotes: string;
  fileUrl: string;
  uploadedAt: string;
  // 标记固件是否已验证通过
  verified?: boolean;
}

export interface FirmwareUploadData {
  version: string;
  productId: string;
  releaseNotes: string;
}

// ==========================================
// 4. 升级任务 (Upgrade Tasks)
// ==========================================

export type UpgradeTaskStatus = 'pending' | 'downloading' | 'installing' | 'success' | 'failed' | 'idle';

export interface UpgradeTask {
  id: string;
  deviceId: string;
  deviceName?: string;
  firmwareId: string;
  firmwareVersion: string;
  status: UpgradeTaskStatus;
  progress: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  // 批量任务特有字段
  targetScope?: 'all' | 'filter';
  successCount?: number;
  totalCount?: number;
}

// ==========================================
// 5. 仪表盘数据 (Dashboard - Phase 2 Prep)
// ==========================================

export interface DashboardStat {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number; // 趋势百分比，正数为增长，负数为下降
  trendType?: 'up' | 'down' | 'neutral';
  icon?: string; // 图标名称
  color?: string; // 图标颜色
}

// ==========================================
// 6. API 响应结构 (Responses)
// ==========================================

// 通用 API 响应
export interface ApiResponse<T> {
  code: number;
  message: string;
  success: boolean;
  data: T;
  total?: number;
}

// 分页响应结构
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

// ==========================================
// 7. 常量 (Constants)
// ==========================================

export const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER_INFO: 'userInfo'
} as const;

// ==========================================
// 8. 统计与概览 (Stats & Summary)
// ==========================================

export interface DeviceSummary {
  total: number;
  online: number;
  offline: number;
  fault: number;
  activated: number;
  inactive?: number; //以此类推，根据实际 API 返回扩展
  upgrade?: number;
}

// ==========================================
// Studio 相关类型 (从 studio.d.ts 导出)
// ==========================================

export * from './studio'
