import { service } from '@/api/core/request'
import { Api } from '@/api/generated/business'

const client = new Api({ baseURL: '' })
client.instance = service

/**
 * [内部辅助] 根据 ID 获取仓库详情
 */
const getRepoDetail = async (repoId: string, fallbackName?: string) => {
  const fallbackRepo = {
    id: repoId,
    name: fallbackName || `未知仓库 (${repoId.substring(0, 6)}...)`,
    type: 1, // 默认 MCU
    channel: 0
  }

  try {
    // console.log(`🔎 [FirmwareAPI] 尝试查询详情 ID: ${repoId}`)
    const res = await client.api.firmwaresRepoFindFirmwaresRepoByIdCreate({
      id: repoId,
      firmwaresRepoId: repoId
    } as any)

    const data = (res.data as any)?.data || (res.data as any)?.Data || res.data
    const repo = Array.isArray(data) ? data[0] : data

    if (repo) {
      return {
        id: repo.FirmwaresRepoId || repo.firmwaresRepoId,
        name: repo.FirmwaresRepoName || repo.firmwaresRepoName || fallbackRepo.name,
        type: repo.FirmwaresRepoType !== undefined ? repo.FirmwaresRepoType : repo.firmwaresRepoType,
        channel: repo.FirmwaresRepoChannel !== undefined ? repo.FirmwaresRepoChannel : repo.firmwaresRepoChannel
      }
    }
  } catch (e) {
    // console.warn(`⚠️ [FirmwareAPI] 详情查询失败，使用兜底数据`)
  }
  return fallbackRepo
}

/**
 * [列表] 获取产品已绑定的所有固件库
 */
export const fetchLinkedRepos = async (productId: string) => {
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

    if (links.length === 0) return []

    // 并行注水：获取详情
    const details = await Promise.all(links.map(item => {
      const id = item.FirmwaresRepoId || item.firmwaresRepoId
      const nameHint = item.FirmwaresRepoName || item.firmwaresRepoName
      return getRepoDetail(id, nameHint)
    }))

    return details
  } catch (error) {
    console.error('❌ [FirmwareAPI] fetchLinkedRepos 流程崩溃:', error)
    return []
  }
}

/**
 * ✅ [修复] 获取固件版本列表 (聚合所有关联库)
 * 核心改动：遍历所有 linkedRepos，而不是只查第一个
 */
export const fetchFirmwaresByProduct = async (productId: string) => {
  try {
    console.group('🚀 [FirmwareAPI] 全量拉取固件流程')

    // 1. 获取所有关联库
    const repos = await fetchLinkedRepos(productId)
    console.log(`📦 关联固件库数量: ${repos.length}`, repos)

    if (repos.length === 0) {
      console.groupEnd()
      return []
    }

    // 2. 并行请求每个库的固件列表
    const promises = repos.map(async (repo) => {
      try {
        const res = await client.api.firmwaresQueryFirmwaresCreate({
          repoId: repo.id,
          pageIndex: 1,
          pageSize: 100
        })

        const rawData = (res.data as any)
        const innerData = rawData?.data || rawData?.Data || rawData
        let items: any[] = []

        if (Array.isArray(innerData)) items = innerData
        else items = innerData?.items || innerData?.Items || []

        // 🕵️ 深度探针：打印每个库返回的第一条原始数据，用于校对字段
        if (items.length > 0) {
          console.log(`🔍 [Probe] 库 "${repo.name}" 返回的原始数据 Keys:`, Object.keys(items[0]))
          console.log(`🔍 [Probe] 库 "${repo.name}" 第一条样本:`, items[0])
        }

        // 映射数据
        return items.map((item: any) => ({
          // 关联信息
          repoId: repo.id,
          repoName: repo.name,
          type: repo.type, // 将库的类型带入固件信息中

          // 固件本身信息 (广谱映射)
          version: item.Version || item.version || item.FirmwareVersion || item.firmwareVersion,
          fileName: item.FileName || item.fileName,
          releaseNotes: item.ReleaseNote || item.releaseNote || '',
          fileSize: item.FileSize || item.fileSize || 0,

          // ⚠️ 时间字段重点兼容
          uploadedAt: item.CreateTime || item.createTime || item.UploadTime || item.uploadTime || new Date(),

          // 状态
          verified: item.Verified || item.verified || false,

          // ⚠️ Key 字段 (如果没有则尝试用 ID 或空字符串)
          firmwareKey: item.FirmwareKey || item.firmwareKey || item.Key || item.key || ''
        }))
      } catch (innerError) {
        console.warn(`⚠️ 拉取库 ${repo.name} 失败:`, innerError)
        return []
      }
    })

    // 3. 等待所有请求完成并扁平化
    const results = await Promise.all(promises)
    const allFirmwares = results.flat()

    console.log(`✅ 合并后固件总数: ${allFirmwares.length}`)
    console.groupEnd()

    return allFirmwares

  } catch (error) {
    console.error('fetchFirmwaresByProduct Error:', error)
    console.groupEnd()
    return []
  }
}

// ... 保持其他方法 (createRepoAndGetId, uploadFirmware 等) 不变 ...
// 为了文件完整性，请确保保留 export const createRepoAndGetId = ... 等后续代码
export const getRepoIdByProduct = async (productId: string): Promise<string | null> => {
  const repos = await fetchLinkedRepos(productId)
  return repos.length > 0 ? repos[0].id : null
}

export const createRepoAndGetId = async (params: {
  name: string,
  type: number,
  channel: number,
  note?: string
}): Promise<string> => {
  await client.api.firmwaresRepoCreateFirmwaresRepoCreate({
    firmwaresRepoName: params.name,
    firmwaresRepoType: params.type,
    firmwaresRepoChannel: params.channel,
    updateTimeoutValue: 600,
    releaseNote: params.note
  })

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

export const linkRepoToProduct = async (productId: string, repoId: string) => {
  return await client.api.productFirmwaresAddProductFirmwareCreate({
    productId,
    firmwaresRepoId: repoId
  })
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