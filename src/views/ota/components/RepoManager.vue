<template>
  <div class="repo-manager-container">
    <!-- 标题 -->
    <div class="page-header">
      <div class="page-title">固件管理</div>
    </div>

    <!-- 筛选与操作栏 -->
    <div class="toolbar-section">
      <div class="filter-group">
        <el-input
          v-model="repoQuery.firmwaresRepoName"
          placeholder="输入固件库名称搜索"
          clearable
          style="width: 240px"
          @clear="fetchRepos"
          @keyup.enter="fetchRepos"
        />
        <el-select
          v-model="repoQuery.firmwaresRepoType"
          placeholder="全部"
          clearable
          style="width: 120px"
          @change="fetchRepos"
        >
          <el-option label="全部" :value="undefined" />
          <el-option label="MCU" :value="0" />
          <el-option label="Module" :value="1" />
        </el-select>
        <el-button type="primary" @click="fetchRepos">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
      <div>
        <el-button type="primary" @click="openCreateRepoDialog">新增固件库</el-button>
      </div>
    </div>

    <!-- 仓库列表表格 -->
    <div class="table-container">
      <el-table
        :data="repoList"
        v-loading="loadingRepos"
        highlight-current-row
        border
        height="100%"
        header-cell-class-name="table-header-cell"
      >
        <el-table-column prop="firmwaresRepoId" label="固件库 ID" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono-text">{{ row.firmwaresRepoId }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="firmwaresRepoName"
          label="固件库名称"
          min-width="150"
          show-overflow-tooltip
          align="center"
        />
        <el-table-column prop="firmwaresRepoType" label="固件类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.firmwaresRepoType === 0 ? 'success' : 'warning'"
              effect="light"
              round
            >
              {{ row.firmwaresRepoType === 0 ? 'MCU' : 'Module' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="firmwaresRepoChannel" label="通道号" width="100" align="center" />
        <el-table-column prop="updateTimeoutValue" label="升级超时(s)" width="120" align="center" />
        <el-table-column
          prop="releaseNote"
          label="备注说明"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="handleManage(row)">管理</el-button>
            <el-button link type="primary" @click.stop="handleAssociate(row)">关联产品</el-button>
            <el-button link type="danger" @click.stop="handleDeleteRepo(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-footer">
      <el-pagination
        v-model:current-page="repoQuery.pageIndex"
        v-model:page-size="repoQuery.pageSize"
        :total="repoTotal"
        layout="prev, pager, next"
        @current-change="fetchRepos"
        size="small"
      />
    </div>

    <!-- 固件版本管理抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="currentRepo ? `固件版本管理 - ${currentRepo.firmwaresRepoName}` : '固件版本管理'"
      size="60%"
      destroy-on-close
    >
      <div class="drawer-content">
        <div class="drawer-header">
          <span class="info-text"> 管理该仓库下的所有固件版本 </span>
          <div v-if="currentRepo">
            <el-button @click="fetchFirmwares" circle
              ><el-icon><Refresh /></el-icon
            ></el-button>
            <el-button type="primary" @click="openUploadDialog">
              <el-icon class="mr-1"><Upload /></el-icon> 上传固件
            </el-button>
          </div>
        </div>

        <div v-if="currentRepo" class="drawer-table-wrapper">
          <el-table :data="firmwareList" v-loading="loadingFirmwares" height="100%" stripe border>
            <el-table-column prop="version" label="版本号" width="150" sortable>
              <template #default="{ row }">
                <span class="mono-text bold">{{ row.version }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="mandatoryVersion" label="强制" width="80" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.mandatoryVersion === 1" color="#f56c6c"
                  ><CircleCheckFilled
                /></el-icon>
                <span v-else class="text-gray-300">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="fileSize" label="大小" width="100">
              <template #default="{ row }">
                {{ formatSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="uploadTime" label="上传时间" width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{ formatTime(row.uploadTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="releaseNote" label="说明" show-overflow-tooltip />
            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleDownload(row)">下载</el-button>
                <el-button link type="danger" @click="handleDeleteFirmware(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <!-- 弹窗：关联产品 -->
    <el-dialog v-model="associateDialog.visible" title="关联产品" width="600px" destroy-on-close>
      <div v-loading="associateDialog.loading">
        <!-- 添加区域 -->
        <div class="associate-header">
          <el-select
            v-model="selectedProductId"
            placeholder="请选择要关联的产品"
            filterable
            class="flex-1"
            style="width: 100%"
          >
            <el-option
              v-for="item in productList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
              :disabled="associateDialog.list.some((a) => a.productId === item.id)"
            />
          </el-select>
          <el-button type="primary" @click="handleAddAssociation" :disabled="!selectedProductId">
            <el-icon class="mr-1"><Link /></el-icon> 关联
          </el-button>
        </div>

        <!-- 列表区域 -->
        <el-table :data="associateDialog.list" border stripe max-height="400">
          <el-table-column prop="productName" label="产品名称" min-width="150" />
          <el-table-column prop="productId" label="产品 ID" width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="danger" @click="handleRemoveAssociation(row)">
                <el-icon class="mr-1"><Close /></el-icon> 移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 弹窗：创建/编辑仓库 -->
    <el-dialog
      v-model="repoDialog.visible"
      :title="repoDialog.isEdit ? '编辑仓库' : '新建仓库'"
      width="480px"
      destroy-on-close
    >
      <el-form :model="repoForm" label-width="100px">
        <el-form-item label="固件库名称" required>
          <el-input v-model="repoForm.firmwaresRepoName" placeholder="例如：SmartSocket_MCU" />
        </el-form-item>
        <el-form-item label="固件类型" required>
          <el-radio-group v-model="repoForm.firmwaresRepoType">
            <el-radio :value="0">MCU</el-radio>
            <el-radio :value="1">Module</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通道号">
          <el-input-number
            v-model="repoForm.firmwaresRepoChannel"
            :min="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="升级超时(s)">
          <el-input-number
            v-model="repoForm.updateTimeoutValue"
            :min="10"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input type="textarea" v-model="repoForm.releaseNote" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repoDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitRepo" :loading="repoDialog.submitting"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 弹窗：上传固件 -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="上传固件"
      width="520px"
      destroy-on-close
      class="rounded-lg"
    >
      <el-form :model="uploadForm" label-width="100px" class="px-4 py-2">
        <el-form-item label="目标仓库" class="mb-4">
          <div class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-sm font-medium">
            {{ currentRepo?.firmwaresRepoName }}
          </div>
        </el-form-item>

        <el-form-item label="版本号" required class="mb-4">
          <el-input v-model="uploadForm.version" placeholder="例如：1.0.0" class="w-full">
            <template #prefix>
              <span class="text-gray-400">v</span>
            </template>
          </el-input>
        </el-form-item>

        <div class="flex gap-4 mb-4">
          <el-form-item label="强制升级" class="mb-0 flex-1">
            <el-switch
              v-model="uploadForm.mandatoryVersion"
              :active-value="1"
              :inactive-value="0"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>

          <el-form-item label="升级超时(s)" class="mb-0 flex-1">
            <el-input-number
              v-model="uploadForm.timeout"
              :min="10"
              :step="10"
              controls-position="right"
              class="w-full"
            />
          </el-form-item>
        </div>

        <el-form-item label="更新说明" class="mb-4">
          <el-input
            type="textarea"
            v-model="uploadForm.releaseNote"
            rows="3"
            placeholder="请输入本次更新的主要内容..."
            resize="none"
          />
        </el-form-item>

        <el-form-item label="固件文件" required class="mb-2">
          <div
            class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
            @click="triggerFileSelect"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <input
              type="file"
              ref="fileInput"
              @change="handleFileChange"
              accept=".bin,.hex,.zip"
              class="hidden"
            />
            <div v-if="!uploadForm.file" class="flex flex-col items-center gap-2 py-2">
              <el-icon class="text-3xl text-gray-400"><Upload /></el-icon>
              <div class="text-sm text-gray-500">点击或拖拽文件到此处</div>
              <div class="text-xs text-gray-400">支持 .bin, .hex, .zip 格式</div>
            </div>
            <div
              v-else
              class="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm"
            >
              <div class="flex items-center gap-2 overflow-hidden">
                <el-icon class="text-blue-500 text-lg"><CircleCheckFilled /></el-icon>
                <span class="text-sm text-gray-700 truncate font-medium">{{
                  uploadForm.file.name
                }}</span>
                <span class="text-xs text-gray-400 whitespace-nowrap"
                  >({{ formatSize(uploadForm.file.size) }})</span
                >
              </div>
              <el-button link type="danger" @click.stop="uploadForm.file = null">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-3 px-4 pb-2">
          <el-button @click="uploadDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploadDialog.submitting">
            <el-icon class="mr-1"><Upload /></el-icon> 开始上传
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh, Upload, CircleCheckFilled, Link, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as FirmwareApi from '@/api/modules/iot-firmware'
import { fetchProducts } from '@/api/modules/product'
import { formatDateTime } from '@/utils/formatters'

// --- 状态定义 ---

const loadingRepos = ref(false)
const repoList = ref<FirmwareApi.FirmwaresRepoDto[]>([])
const repoTotal = ref(0)
const repoQuery = reactive({
  pageIndex: 1,
  pageSize: 10,
  firmwaresRepoName: '',
  firmwaresRepoType: undefined,
})
const currentRepo = ref<FirmwareApi.FirmwaresRepoDto | null>(null)

const loadingFirmwares = ref(false)
const firmwareList = ref<FirmwareApi.FirmwareDto[]>([])

// 关联产品状态
const associateDialog = reactive({
  visible: false,
  repoId: '',
  loading: false,
  list: [] as Record<string, unknown>[], // 已关联列表
})
const productList = ref<Record<string, unknown>[]>([]) // 所有产品列表
const selectedProductId = ref('')

// 弹窗状态
const repoDialog = reactive({ visible: false, isEdit: false, submitting: false })
const repoForm = reactive({
  firmwaresRepoId: '',
  firmwaresRepoName: '',
  firmwaresRepoType: 0,
  firmwaresRepoChannel: 0,
  updateTimeoutValue: 600,
  releaseNote: '',
})

const uploadDialog = reactive({ visible: false, submitting: false })
const uploadForm = reactive({
  version: '',
  mandatoryVersion: 0,
  releaseNote: '',
  file: null as File | null | undefined,
  timeout: 600, // 默认 600s
})
const fileInput = ref<HTMLInputElement | null>(null)

const drawerVisible = ref(false)

// --- 方法 ---

const fetchRepos = async () => {
  loadingRepos.value = true
  try {
    const res = await FirmwareApi.queryFirmwaresRepos(repoQuery)
    console.log('[RepoManager] fetchRepos raw:', res)

    // 适配两种可能的返回结构
    const data =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res

    // 字段名归一化 (兼容 PascalCase 和 camelCase)
    repoList.value = ((data.items as Record<string, unknown>[]) || []).map(
      (item: Record<string, unknown>) => ({
        firmwaresRepoId: (item.firmwaresRepoId as string) || (item.FirmwaresRepoId as string),
        firmwaresRepoName: (item.firmwaresRepoName as string) || (item.FirmwaresRepoName as string),
        firmwaresRepoType:
          item.firmwaresRepoType !== undefined
            ? (item.firmwaresRepoType as number)
            : (item.FirmwaresRepoType as number),
        firmwaresRepoChannel:
          (item.firmwaresRepoChannel as number) || (item.FirmwaresRepoChannel as number) || 0,
        updateTimeoutValue:
          (item.updateTimeoutValue as number) || (item.UpdateTimeoutValue as number) || 0,
        releaseNote: (item.releaseNote as string) || (item.ReleaseNote as string) || '',
        createdAt: (item.createdAt as string) || (item.CreatedAt as string) || '',
      }),
    )

    repoTotal.value = (data.totalCount as number) || 0
  } catch {
    ElMessage.error('加载仓库列表失败')
  } finally {
    loadingRepos.value = false
  }
}

const resetQuery = () => {
  repoQuery.firmwaresRepoName = ''
  repoQuery.firmwaresRepoType = undefined
  fetchRepos()
}

const handleManage = (row: FirmwareApi.FirmwaresRepoDto) => {
  currentRepo.value = row
  drawerVisible.value = true
  fetchFirmwares()
}

const handleAssociate = async (row: FirmwareApi.FirmwaresRepoDto) => {
  associateDialog.repoId = row.firmwaresRepoId
  associateDialog.visible = true
  associateDialog.list = []
  selectedProductId.value = ''

  associateDialog.loading = true
  try {
    // 并行加载：关联列表 + 所有产品
    const [assocRes, products] = await Promise.all([
      FirmwareApi.queryProductFirmwares({
        firmwaresRepoId: row.firmwaresRepoId,
        pageIndex: 1,
        pageSize: 100,
      }),
      fetchProducts(),
    ])

    const assocData =
      ((assocRes as unknown as Record<string, unknown>).data as Record<string, unknown>) || assocRes
    associateDialog.list = (assocData.items as Record<string, unknown>[]) || []
    const productData =
      ((products as unknown as Record<string, unknown>).data as Record<string, unknown>[]) ||
      products
    productList.value = (productData as Record<string, unknown>[]) || []
  } finally {
    associateDialog.loading = false
  }
}

const handleAddAssociation = async () => {
  if (!selectedProductId.value) return

  try {
    const success = await FirmwareApi.addProductFirmware({
      productId: selectedProductId.value,
      firmwaresRepoId: associateDialog.repoId,
    })

    if (success) {
      ElMessage.success('关联成功')
      selectedProductId.value = ''
      // 刷新关联列表
      const res = await FirmwareApi.queryProductFirmwares({
        firmwaresRepoId: associateDialog.repoId,
        pageIndex: 1,
        pageSize: 100,
      })
      const data =
        ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res
      associateDialog.list = ((data.items as Record<string, unknown>[]) || []).map(
        (item: Record<string, unknown>) => ({
          productId: (item.productId as string) || (item.ProductId as string),
          productName: (item.productName as string) || (item.ProductName as string),
        }),
      )
    }
  } catch {
    ElMessage.error('关联失败')
  }
}

const handleRemoveAssociation = async (row: Record<string, any>) => {
  try {
    await ElMessageBox.confirm(`确定移除与产品 ${row.productName} 的关联?`, '提示', {
      type: 'warning',
    })

    const success = await FirmwareApi.deleteProductFirmware(
      (row.productId as string) || (row.ProductId as string),
      associateDialog.repoId,
    )
    if (success) {
      ElMessage.success('移除成功')
      // 刷新列表
      const res = await FirmwareApi.queryProductFirmwares({
        firmwaresRepoId: associateDialog.repoId,
        pageIndex: 1,
        pageSize: 100,
      })
      const data =
        ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res
      associateDialog.list = ((data.items as Record<string, unknown>[]) || []).map(
        (item: Record<string, unknown>) => ({
          productId: (item.productId as string) || (item.ProductId as string),
          productName: (item.productName as string) || (item.ProductName as string),
        }),
      )
    }
  } catch {
    // cancelled
  }
}

const fetchFirmwares = async () => {
  if (!currentRepo.value) return
  loadingFirmwares.value = true
  try {
    const res = await FirmwareApi.queryFirmwares({
      repoId: currentRepo.value.firmwaresRepoId,
      pageIndex: 1,
      pageSize: 100,
    })
    console.log('[RepoManager] fetchFirmwares raw:', res)

    // 适配
    const data =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res

    // 字段名归一化
    firmwareList.value = ((data.items as Record<string, unknown>[]) || []).map(
      (item: Record<string, unknown>) => ({
        repoId: (item.repoId as string) || (item.RepoId as string),
        version:
          (item.version as string) ||
          (item.Version as string) ||
          (item.firmwareVersion as string) ||
          (item.FirmwareVersion as string),
        mandatoryVersion:
          item.mandatoryVersion !== undefined
            ? (item.mandatoryVersion as number)
            : (item.MandatoryVersion as number),
        releaseNote: (item.releaseNote as string) || (item.ReleaseNote as string),
        fileSize: (item.fileSize as number) || (item.FileSize as number),
        uploadTime: (item.uploadTime as string) || (item.UploadTime as string),
        fileName: (item.fileName as string) || (item.FileName as string),
      }),
    )
  } finally {
    loadingFirmwares.value = false
  }
}

// 仓库操作
const openCreateRepoDialog = () => {
  repoDialog.isEdit = false
  repoDialog.visible = true
  Object.assign(repoForm, {
    firmwaresRepoId: '',
    firmwaresRepoName: '',
    firmwaresRepoType: 0,
    firmwaresRepoChannel: 0,
    updateTimeoutValue: 600,
    releaseNote: '',
  })
}
const submitRepo = async () => {
  console.log('submitRepo', repoForm)
  if (!repoForm.firmwaresRepoName) return ElMessage.warning('请输入名称')
  repoDialog.submitting = true
  try {
    const api = repoDialog.isEdit
      ? FirmwareApi.updateFirmwaresRepo
      : FirmwareApi.createFirmwaresRepo
    const success = await api({ ...repoForm })
    if (success) {
      ElMessage.success('操作成功')
      repoDialog.visible = false
      fetchRepos()
    } else {
      ElMessage.error('操作失败')
    }
  } finally {
    repoDialog.submitting = false
  }
}
const handleDeleteRepo = async (row: FirmwareApi.FirmwaresRepoDto) => {
  try {
    await ElMessageBox.confirm(`确定删除仓库 ${row.firmwaresRepoName}?`, '警告', {
      type: 'warning',
    })
    const success = await FirmwareApi.deleteFirmwaresRepo(row.firmwaresRepoId)
    if (success) {
      ElMessage.success('删除成功')
      fetchRepos()
      if (currentRepo.value?.firmwaresRepoId === row.firmwaresRepoId) currentRepo.value = null
    }
  } catch {
    // cancelled
  }
}

// 上传操作
const openUploadDialog = () => {
  uploadDialog.visible = true
  Object.assign(uploadForm, {
    version: '',
    mandatoryVersion: 0,
    releaseNote: '',
    file: null,
    timeout: 600,
  })
}
const triggerFileSelect = () => fileInput.value?.click()
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    uploadForm.file = files[0]
  }
}
const handleFileDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    uploadForm.file = files[0]
  }
}
const submitUpload = async () => {
  if (!uploadForm.version || !uploadForm.file) return ElMessage.warning('请填写版本号并选择文件')
  uploadDialog.submitting = true
  try {
    const success = await FirmwareApi.addFirmware({
      repoId: currentRepo.value!.firmwaresRepoId,
      version: uploadForm.version,
      mandatoryVersion: uploadForm.mandatoryVersion,
      releaseNote: uploadForm.releaseNote,
      file: uploadForm.file,
      // timeout: uploadForm.timeout // TODO: 待后端支持
    })
    if (success) {
      ElMessage.success('上传成功')
      uploadDialog.visible = false
      fetchFirmwares()
    } else {
      ElMessage.error('上传失败')
    }
  } catch {
    ElMessage.error('上传出错')
  } finally {
    uploadDialog.submitting = false
  }
}

// 固件操作
const handleDownload = async (row: FirmwareApi.FirmwareDto) => {
  const res = await FirmwareApi.getDownloadUrl(row.repoId, row.version)
  if (res?.url) window.open(res.url)
}
const handleDeleteFirmware = async (row: FirmwareApi.FirmwareDto) => {
  try {
    await ElMessageBox.confirm(`删除版本 ${row.version}?`, '警告', { type: 'warning' })
    await FirmwareApi.deleteFirmware(row.repoId, row.version)
    ElMessage.success('删除成功')
    fetchFirmwares()
  } catch {
    // cancelled
  }
}

// 工具
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024,
    sizes = ['B', 'KB', 'MB'],
    i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
const formatTime = (time: string) => formatDateTime(time)

onMounted(fetchRepos)
</script>

<style scoped>
.repo-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.pagination-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Drawer */
.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.info-text {
  font-size: 14px;
  color: #909399;
}
.drawer-table-wrapper {
  flex: 1;
  overflow: hidden;
}

/* Associate Dialog */
.associate-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* Helpers */
.mono-text {
  font-family: monospace;
  color: #606266;
}
.bold {
  font-weight: bold;
}
:deep(.table-header-cell) {
  background-color: #f5f7fa !important;
  color: #606266;
  font-weight: 600;
}
</style>
