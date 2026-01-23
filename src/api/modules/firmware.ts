import { service } from '@/api/core/request'
import { Api } from '@/api/generated/business'
import { queryOTATasks, type OTATaskDto } from '@/api/modules/iot-ota'

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
    channel: 0,
  }

  try {
    const res = await client.api.firmwaresRepoFindFirmwaresRepoByIdCreate({
      id: repoId,
      firmwaresRepoId: repoId,
    } as any)

    const data = (res.data as any)?.data || (res.data as any)?.Data || res.data
    const repo = Array.isArray(data) ? data[0] : data

    if (repo) {
      return {
        id: repo.FirmwaresRepoId || repo.firmwaresRepoId,
        name: repo.FirmwaresRepoName || repo.firmwaresRepoName || fallbackRepo.name,
        type:
          repo.FirmwaresRepoType !== undefined ? repo.FirmwaresRepoType : repo.firmwaresRepoType,
        channel:
          repo.FirmwaresRepoChannel !== undefined
            ? repo.FirmwaresRepoChannel
            : repo.firmwaresRepoChannel,
      }
    }
  } catch (e) {
    // console.warn(`⚠️ [FirmwareAPI] 详情查询失败，使用兜底数据`)
  }
  return fallbackRepo
}

/**
 * [列表] 获取产品已绑定的所有固件库 (用于构建 Type 字典)
 */
export const fetchLinkedRepos = async (productId: string) => {
  try {
    const res = await client.api.productFirmwaresQueryProductFirmwaresCreate({
      productId,
      pageIndex: 1,
      pageSize: 100,
    })

    const rawData = res.data as any
    const innerData = rawData?.data || rawData?.Data || rawData
    let links: any[] = []

    if (Array.isArray(innerData)) links = innerData
    else if (Array.isArray(innerData?.items)) links = innerData.items
    else if (Array.isArray(innerData?.Items)) links = innerData.Items

    if (links.length === 0) return []

    // 并行注水：获取详情
    const details = await Promise.all(
      links.map((item) => {
        const id = item.FirmwaresRepoId || item.firmwaresRepoId
        const nameHint = item.FirmwaresRepoName || item.firmwaresRepoName
        return getRepoDetail(id, nameHint)
      }),
    )

    return details
  } catch (error) {
    console.error('❌ [FirmwareAPI] fetchLinkedRepos 流程崩溃:', error)
    return []
  }
}

/**
 * [列表] 获取固件版本列表 (重构：直接使用 OTATaskManage/Query 数据源)
 * @description 遵循用户指令：OTATaskManage/Query 的数据是完整的，以此为准。
 */
export const fetchFirmwaresByProduct = async (
  productId: string,
  knownRepos?: Array<{ id: string; name: string; type: number }>
) => {
  try {
    // 1. 准备辅助字典：RepoId -> Type (MCU/Module)
    // 任务数据里只有 RepoId，没有 Type，所以我们需要先拿到 Repo 列表来建立映射
    let repos = knownRepos
    if (!repos || repos.length === 0) {
      repos = await fetchLinkedRepos(productId)
    }

    const repoTypeMap = new Map<string, number>()
    const repoNameMap = new Map<string, string>()

    repos?.forEach(r => {
      repoTypeMap.set(r.id, r.type)
      repoNameMap.set(r.id, r.name)
    })

    console.log(`🔍 [FirmwareAPI] 切换至任务源模式，已加载 ${repos?.length} 个仓库类型映射`)

    // 2. 核心请求：直接查 OTATaskManage/Query
    // 使用用户指定的参数结构
    const res = await queryOTATasks({
      pageIndex: 1,
      pageSize: 100, // 放大 PageSize 确保能拿到那 8 条数据
      productId: productId
    })

    const rawData = res.data as any
    const innerData = rawData?.data || rawData?.Data || rawData
    let tasks: OTATaskDto[] = []

    if (Array.isArray(innerData)) {
      tasks = innerData
    } else if (Array.isArray(innerData?.items)) {
      tasks = innerData.items
    } else if (Array.isArray(innerData?.Items)) {
      tasks = innerData.Items
    }

    console.log(`✅ [FirmwareAPI] 任务源获取成功，共 ${tasks.length} 条数据`)

    // 3. 映射为 UI 列表数据
    const list = tasks.map((task) => {
      // 确定类型：查字典，查不到默认 MCU(1)
      const type = repoTypeMap.get(task.firmwaresRepoId) ?? 1
      const repoName = repoNameMap.get(task.firmwaresRepoId) || task.repoName || 'Unknown Repo'

      return {
        // --- 核心标识 ---
        firmwareKey: task.otaTaskId, // ⭐️ 强制使用 otaTaskId 作为 Key
        otaTaskId: task.otaTaskId,

        // --- 基础信息 ---
        version: task.firmwareVersion,
        repoId: task.firmwaresRepoId,
        repoName: repoName,
        type: type, // 决定了前端显示的标签是 MCU 还是 Module

        // --- 时间与状态 ---
        uploadedAt: task.createTime || task.publishTime || new Date(),
        verified: task.upgradeMode === 1, // 譬如：如果是灰度模式/验证模式，视为"待验证"或"已验证"逻辑(视业务而定)
        status: task.status, // 将原始状态带出去

        // --- 完整数据透传 (供详情页使用) ---
        ...task,

        // --- 兼容字段 (任务接口不含文件信息，给默认值) ---
        fileName: '',
        fileSize: 0,
        releaseNotes: task.releaseNote || ''
      }
    })

    // 按创建时间倒序
    return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  } catch (error) {
    console.error('❌ [FirmwareAPI] fetchFirmwaresByProduct 失败:', error)
    return []
  }
}

// ... 下面的辅助函数保持不变 ...

export const getRepoIdByProduct = async (productId: string): Promise<string | null> => {
  const repos = await fetchLinkedRepos(productId)
  return repos.length > 0 ? repos[0].id : null
}

export const createRepoAndGetId = async (params: {
  name: string
  type: number
  channel: number
  note?: string
}): Promise<string> => {
  await client.api.firmwaresRepoCreateFirmwaresRepoCreate({
    firmwaresRepoName: params.name,
    firmwaresRepoType: params.type,
    firmwaresRepoChannel: params.channel,
    updateTimeoutValue: 600,
    releaseNote: params.note,
  })

  const queryRes = await client.api.firmwaresRepoQueryFirmwaresReposCreate({
    firmwaresRepoName: params.name,
    pageIndex: 1,
    pageSize: 1,
  })

  const rawData = queryRes.data as any
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
    firmwaresRepoId: repoId,
  })
}

export const uploadFirmware = async (repoId: string, version: string, note: string, file: File) => {
  return await client.api.firmwaresAddFirmwareCreate({
    repoId,
    version,
    mandatoryVersion: 0,
    releaseNote: note,
    file: file,
  })
}

export const verifyFirmware = async (repoId: string, version: string, note?: string) => {
  const finalNote = note || 'Verified via Product Dashboard'
  return await client.api.firmwaresUpdateFirmwareCreate({
    repoId,
    firmwareVersion: version,
    releaseNote: finalNote,
  })
}

export const updateFirmware = async (repoId: string, version: string, note: string) => {
  return await client.api.firmwaresUpdateFirmwareCreate({
    repoId,
    firmwareVersion: version,
    releaseNote: note,
  })
}

export const deleteFirmware = async (repoId: string, version: string) => {
  return await client.api.firmwaresDeleteFirmwareCreate({
    repoId,
    version,
  })
}