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

/** 固件仓库实体 */
export interface FirmwaresRepoDto {
  firmwaresRepoId: string
  firmwaresRepoName: string
  firmwaresRepoType: number // 0: MCU, 1: Module
  firmwaresRepoChannel: number
  updateTimeoutValue: number
  releaseNote?: string
  createdAt: string
  updatedAt?: string
}

/** 固件版本实体 */
export interface FirmwareDto {
  repoId: string
  version: string
  mandatoryVersion: number // 0: 否, 1: 是
  releaseNote?: string
  fileSize: number
  uploadTime: string
  fileName?: string
}

/** 创建仓库请求 */
export interface CreateFirmwaresRepoRequest {
  firmwaresRepoName: string
  firmwaresRepoType: number
  firmwaresRepoChannel?: number
  updateTimeoutValue?: number
  releaseNote?: string
}

/** 更新仓库请求 */
export interface UpdateFirmwaresRepoRequest extends CreateFirmwaresRepoRequest {
  firmwaresRepoId: string
}

/** 查询仓库请求 */
export interface FirmwaresRepoQueryRequest extends BasePageReq {
  firmwaresRepoName?: string
  firmwaresRepoType?: number
}

/** 查询固件请求 */
export interface QueryFirmwaresRequest extends BasePageReq {
  repoId: string
}

// --- API 方法 ---

// 1. 固件仓库管理

export const queryFirmwaresRepos = (data: FirmwaresRepoQueryRequest) => {
  return request.post<PageResult<FirmwaresRepoDto>>('/api/FirmwaresRepo/QueryFirmwaresRepos', data)
}

export const createFirmwaresRepo = (data: CreateFirmwaresRepoRequest) => {
  return request.post<boolean>('/api/FirmwaresRepo/CreateFirmwaresRepo', data)
}

export const updateFirmwaresRepo = (data: UpdateFirmwaresRepoRequest) => {
  return request.post<boolean>('/api/FirmwaresRepo/UpdateFirmwaresRepo', data)
}

export const deleteFirmwaresRepo = (firmwaresRepoId: string) => {
  return request.post<boolean>('/api/FirmwaresRepo/DeleteFirmwaresRepo', null, {
    params: { firmwaresRepoId },
  })
}

export const findFirmwaresRepoById = (firmwaresRepoId: string) => {
  return request.post<FirmwaresRepoDto>('/api/FirmwaresRepo/FindFirmwaresRepoById', null, {
    params: { firmwaresRepoId },
  })
}

// 2. 固件版本管理

export const queryFirmwares = (data: QueryFirmwaresRequest) => {
  return request.post<PageResult<FirmwareDto>>('/api/Firmwares/QueryFirmwares', data)
}

/**
 * 上传固件
 * 注意：使用 FormData 格式上传
 */
export const addFirmware = (data: {
  repoId: string
  version: string
  mandatoryVersion: number
  releaseNote?: string
  file: File
}) => {
  const formData = new FormData()
  formData.append('repoId', data.repoId)
  formData.append('version', data.version)
  formData.append('mandatoryVersion', data.mandatoryVersion.toString())
  if (data.releaseNote) {
    formData.append('releaseNote', data.releaseNote)
  }
  formData.append('file', data.file)

  return request.post<boolean>('/api/Firmwares/AddFirmware', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const deleteFirmware = (repoId: string, version: string) => {
  return request.post<boolean>('/api/Firmwares/DeleteFirmware', null, {
    params: { repoId, version },
  })
}

export const getDownloadUrl = (repoId: string, version: string) => {
  return request.post<{ url: string }>('/api/Firmwares/GetDownloadUrl', null, {
    params: { repoId, version },
  })
}

// 3. 产品关联管理

export const queryProductFirmwares = (data: {
  firmwaresRepoId?: string
  productId?: string
  pageIndex: number
  pageSize: number
}) => {
  return request.post<PageResult<Record<string, unknown>>>(
    '/api/ProductFirmwares/QueryProductFirmwares',
    data,
  )
}

export const addProductFirmware = (data: {
  productId: string
  firmwaresRepoId: string
  releaseNote?: string
}) => {
  return request.post<boolean>('/api/ProductFirmwares/AddProductFirmware', data)
}

export const deleteProductFirmware = (productId: string, firmwaresRepoId: string) => {
  return request.post<boolean>('/api/ProductFirmwares/DeleteProductFirmware', null, {
    params: { productId, firmwaresRepoId },
  })
}
