import request from '@/api/core/request'

// --- 接口定义 ---

/** 基础分页请求 */
export interface BasePageReq {
  pageIndex: number
  pageSize: number
  [key: string]: unknown
}

export interface PageResult<T> {
  items: T[]
  total: number
}

/** OTA 任务实体 */
export interface OTATaskDto {
  otaTaskId: string
  productId: string
  firmwaresRepoId: string
  firmwareVersion: string
  country: string
  upgradeMode: number // 0: 全量, 1: 灰度/验证
  status: number // 0: 草稿, 1: 发布中, 2: 暂停, 3: 结束
  releaseNote?: string
  remark?: string
  createTime: string
  publishTime?: string
  productName?: string // 辅助字段，前端自行关联
  repoName?: string // 辅助字段
}

/** 任务设备详情 */
export interface OTATaskDeviceInfoDTO {
  uuid: string
  status: number // 0: Pending, 1: Downloading, 2: Upgrading, 3: Success, 4: Failed
  message?: string
  updateTime: string
}

/** 创建任务草稿请求 */
export interface CreateOTATaskDraftRequest {
  productId: string
  firmwaresRepoId: string
  firmwareVersion: string
  country: string
  upgradeMode: number
  releaseNote?: string
  remark?: string
}

/** 灰度发布请求 */
export interface PublishGrayRequest {
  otaTaskId: string
  grayPolicy: number // 0: 比例, 1: 数量
  grayValue: number
}

/** 查询任务请求 */
export interface OTATaskQueryRequest extends BasePageReq {
  productId?: string
  firmwaresRepoId?: string
  status?: number
}

/** 查询任务设备请求 */
export interface OTATaskDeviceQueryRequest extends BasePageReq {
  otaTaskId: string
  status?: number
}

// --- API 方法 ---

// 1. 任务管理

export const queryOTATasks = (data: OTATaskQueryRequest) => {
  return request.post<PageResult<OTATaskDto>>('/api/OTATaskManage/Query', data)
}

export const createOTATaskDraft = (data: CreateOTATaskDraftRequest) => {
  return request.post<boolean>('/api/OTATaskManage/CreateDraft', data)
}

export const publishFull = (otaTaskId: string) => {
  return request.post<boolean>('/api/OTATaskManage/PublishFull', null, {
    params: { otaTaskId },
  })
}

export const publishGray = (data: PublishGrayRequest) => {
  return request.post<boolean>('/api/OTATaskManage/PublishGray', data)
}

export const pausePublish = (otaTaskId: string) => {
  return request.post<boolean>('/api/OTATaskManage/PausePublish', null, {
    params: { otaTaskId },
  })
}

export const deleteTask = (otaTaskId: string) => {
  return request.post<boolean>('/api/OTATaskManage/Delete', null, {
    params: { otaTaskId },
  })
}

// 2. 验证设备管理 (白名单)

export const addVerifyDevice = (otaTaskId: string, uuid: string) => {
  return request.post<boolean>('/api/OTATaskManage/Verify/Add', null, {
    params: { otaTaskId, uuid },
  })
}

export const removeVerifyDevice = (otaTaskId: string, uuid: string) => {
  return request.post<boolean>('/api/OTATaskManage/Verify/Remove', null, {
    params: { otaTaskId, uuid },
  })
}

export const queryVerifyDevices = (otaTaskId: string, pageIndex = 1, pageSize = 100) => {
  return request.post<PageResult<OTATaskDeviceInfoDTO>>('/api/OTATaskManage/Verify/Query', null, {
    params: { otaTaskId, pageIndex, pageSize },
  })
}

// 3. 升级结果监控

export const queryTaskDevices = (data: OTATaskDeviceQueryRequest) => {
  return request.post<PageResult<OTATaskDeviceInfoDTO>>('/api/OTATaskManage/Devices/Query', data)
}
