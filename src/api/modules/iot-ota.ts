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
  productName?: string
  repoName?: string
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

/** 直接开始 OTA (点对点推送) 请求 */
export interface StartOTARequest {
  uuid: string
  version: string
  firmwaresRepoId: string
}

// --- API 方法 ---

// 1. 任务管理 (Task Management)

export const queryOTATasks = (data: OTATaskQueryRequest) => {
  return request.post<PageResult<OTATaskDto>>('/api/OTATaskManage/Query', data)
}

export const createOTATaskDraft = (data: CreateOTATaskDraftRequest) => {
  return request.post<boolean>('/api/OTATaskManage/CreateDraft', data)
}

/**
 * [组合操作] 创建任务并尝试获取 ID (仅用于 Task Wizard)
 */
export const createTaskAndGetId = async (data: CreateOTATaskDraftRequest): Promise<string> => {
  await createOTATaskDraft(data)
  // 给后端一点时间落库
  await new Promise((resolve) => setTimeout(resolve, 500))
  const res = await queryOTATasks({
    pageIndex: 1,
    pageSize: 1,
    productId: data.productId,
    firmwaresRepoId: data.firmwaresRepoId,
  } as any)

  const listData = (res.data as any)?.data || (res.data as any)?.Data || res.data
  const items = Array.isArray(listData?.items)
    ? listData.items
    : Array.isArray(listData)
      ? listData
      : []

  if (items.length > 0) {
    return items[0].otaTaskId || (items[0] as any).id
  }
  throw new Error('任务创建成功，但无法检索到任务 ID')
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
  return request.post<boolean>(
    `/api/OTATaskManage/Verify/Remove?otaTaskId=${otaTaskId}&uuid=${uuid}`,
  )
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

// 4. 直接指令 (Direct Push) ✨ NEW

/**
 * 直接对设备发起升级 (无需创建任务)
 * 对应后端: /api/ota/StartOTA
 */
export const startOTA = (data: StartOTARequest) => {
  return request.post<boolean>('/api/ota/StartOTA', data)
}

/**
 * 检查设备是否有更新
 * 对应后端: /api/ota/CheckForUpdate
 */
export const checkForUpdate = (uuid: string, target: number) => {
  return request.post<any>('/api/ota/CheckForUpdate', { uuid, target })
}
