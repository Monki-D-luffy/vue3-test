import { service } from '@/api/core/request'
import { Api } from '@/api/generated/business'

const client = new Api({ baseURL: '' })
client.instance = service

/**
 * [内部辅助] 根据 ID 获取仓库详情
 * 🛡️ 兜底策略：无论成功失败，必须返回一个对象，不能返回 null
 */
const getRepoDetail = async (repoId: string, fallbackName?: string) => {
  // 默认对象 (如果查询失败就用这个)
  const fallbackRepo = {
    id: repoId,
    name: fallbackName || `未知仓库 (${repoId.substring(0, 6)}...)`,
    type: 1, // 默认 MCU
    channel: 0
  }

  try {
    console.log(`🔎 [FirmwareAPI] 尝试查询详情 ID: ${repoId}`)

    // 尝试多种参数组合，防止参数名错误
    // 注意：TypeScript 可能会报错多余参数，这里用 as any 绕过检查
    const res = await client.api.firmwaresRepoFindFirmwaresRepoByIdCreate({
      id: repoId,
      firmwaresRepoId: repoId
    } as any)

    const data = (res.data as any)?.data || (res.data as any)?.Data || res.data
    const repo = Array.isArray(data) ? data[0] : data

    if (repo) {
      // console.log(`✅ [FirmwareAPI] 详情获取成功: ${repo.FirmwaresRepoName}`)
      return {
        id: repo.FirmwaresRepoId || repo.firmwaresRepoId,
        name: repo.FirmwaresRepoName || repo.firmwaresRepoName || fallbackRepo.name,
        type: repo.FirmwaresRepoType !== undefined ? repo.FirmwaresRepoType : repo.firmwaresRepoType,
        channel: repo.FirmwaresRepoChannel !== undefined ? repo.FirmwaresRepoChannel : repo.firmwaresRepoChannel
      }
    }
  } catch (e) {
    console.warn(`⚠️ [FirmwareAPI] 详情查询失败，使用兜底数据 (ID: ${repoId})`)
  }

  // 查不到就返回兜底对象
  return fallbackRepo
}

/**
 * [列表] 获取产品已绑定的所有固件库
 */
export const fetchLinkedRepos = async (productId: string) => {
  console.log(`🔍 [FirmwareAPI] Step 1: 查找关联关系, ProductID: ${productId}`)

  try {
    const res = await client.api.productFirmwaresQueryProductFirmwaresCreate({
      productId,
      pageIndex: 1,
      pageSize: 100
    })

    const rawData = (res.data as any)
    const innerData = rawData?.data || rawData?.Data || rawData
    let links: any[] = []

    if (Array.isArray(innerData)) links = innerData
    else if (Array.isArray(innerData?.items)) links = innerData.items
    else if (Array.isArray(innerData?.Items)) links = innerData.Items

    console.log(`🔗 [FirmwareAPI] 找到 ${links.length} 条关联记录`)

    if (links.length === 0) return []

    // Step 2: 补充详情 (Hydration)
    // 我们把关联记录里的 FirmwaresRepoName 也传进去作为备选，万一关联表里其实有名字呢
    const details = await Promise.all(links.map(item => {
      const id = item.FirmwaresRepoId || item.firmwaresRepoId
      const nameHint = item.FirmwaresRepoName || item.firmwaresRepoName
      return getRepoDetail(id, nameHint)
    }))

    // 这里 details 一定不会有 null，因为 getRepoDetail 做了兜底
    console.log(`✅ [FirmwareAPI] 最终返回 ${details.length} 个仓库给前端`)
    return details

  } catch (error) {
    console.error('❌ [FirmwareAPI] fetchLinkedRepos 流程崩溃:', error)
    return []
  }
}

/**
 * [列表] 获取固件版本列表
 */
export const fetchFirmwaresByProduct = async (productId: string) => {
  try {
    const repos = await fetchLinkedRepos(productId)
    if (repos.length === 0) return []

    // 默认查第一个库
    const targetRepo = repos[0]
    // console.log(`🚀 [FirmwareAPI] 加载固件列表, 库: ${targetRepo.name}`)

    const res = await client.api.firmwaresQueryFirmwaresCreate({
      repoId: targetRepo.id,
      pageIndex: 1,
      pageSize: 100
    })

    const rawData = (res.data as any)
    const innerData = rawData?.data || rawData?.Data || rawData
    let items: any[] = []
    if (Array.isArray(innerData)) items = innerData
    else items = innerData?.items || innerData?.Items || []

    return items.map((item: any) => ({
      repoId: item.FirmwaresRepoId || item.firmwaresRepoId || targetRepo.id,
      repoName: targetRepo.name,
      version: item.Version || item.version || item.FirmwareVersion,
      fileName: item.FileName || item.fileName,
      releaseNotes: item.ReleaseNote || item.releaseNote || '',
      fileSize: item.FileSize || item.fileSize || 0,
      uploadedAt: item.CreateTime || item.createTime || item.UploadTime,
      verified: item.Verified || item.verified || false
    }))
  } catch (error) {
    console.error('fetchFirmwaresByProduct Error:', error)
    return []
  }
}

/**
 * [兼容] 获取单个默认 ID
 */
export const getRepoIdByProduct = async (productId: string): Promise<string | null> => {
  const repos = await fetchLinkedRepos(productId)
  return repos.length > 0 ? repos[0].id : null
}

/**
 * [创建] 创建固件库
 */
export const createRepoAndGetId = async (params: {
  name: string,
  type: number,
  channel: number,
  note?: string
}): Promise<string> => {
  const createSuccess = await client.api.firmwaresRepoCreateFirmwaresRepoCreate({
    firmwaresRepoName: params.name,
    firmwaresRepoType: params.type,
    firmwaresRepoChannel: params.channel,
    updateTimeoutValue: 600,
    releaseNote: params.note
  })

  // 立即反查 ID
  const queryRes = await client.api.firmwaresRepoQueryFirmwaresReposCreate({
    firmwaresRepoName: params.name,
    pageIndex: 1,
    pageSize: 1
  })

  const rawData = (queryRes.data as any)
  const innerData = rawData?.data || rawData?.Data || rawData
  let items: any[] = []
  if (Array.isArray(innerData)) items = innerData
  else items = innerData?.items || innerData?.Items || []

  if (items.length > 0) {
    return items[0].FirmwaresRepoId || items[0].firmwaresRepoId
  }

  throw new Error('固件库创建成功但无法获取 ID')
}

// 保持其他方法不变...
export const linkRepoToProduct = async (productId: string, repoId: string) => {
  return await client.api.productFirmwaresAddProductFirmwareCreate({
    productId,
    firmwaresRepoId: repoId
  })
}

export const fetchAllRepos = async (keyword: string = '') => {
  const res = await client.api.firmwaresRepoQueryFirmwaresReposCreate({
    firmwaresRepoName: keyword,
    pageIndex: 1,
    pageSize: 20
  })
  const rawData = (res.data as any)
  const innerData = rawData?.data || rawData?.Data || rawData
  let items: any[] = []
  if (Array.isArray(innerData)) items = innerData
  else items = innerData?.items || innerData?.Items || []

  return items.map((i: any) => ({
    label: i.FirmwaresRepoName || i.firmwaresRepoName,
    value: i.FirmwaresRepoId || i.firmwaresRepoId,
    type: i.FirmwaresRepoType || i.firmwaresRepoType
  }))
}

export const uploadFirmware = async (repoId: string, version: string, note: string, file: File) => {
  return await client.api.firmwaresAddFirmwareCreate({
    repoId,
    version,
    mandatoryVersion: 0,
    releaseNote: note,
    file: file
  })
}

export const verifyFirmware = async (repoId: string, version: string) => {
  return await client.api.firmwaresUpdateFirmwareCreate({
    repoId,
    firmwareVersion: version,
    releaseNote: 'Verified via Product Dashboard'
  })
}

export const deleteFirmware = async (repoId: string, version: string) => {
  return await client.api.firmwaresDeleteFirmwareCreate({
    repoId,
    version
  })
}