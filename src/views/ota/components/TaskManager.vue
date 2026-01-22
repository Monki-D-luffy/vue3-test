<template>
  <div class="task-manager-container">
    <!-- Sub-Pages -->
    <TaskVerify
      v-if="viewMode === 'verify' && activeTask"
      :task="activeTask"
      @back="viewMode = 'list'"
    />

    <TaskPublish
      v-else-if="viewMode === 'publish' && activeTask"
      :task="activeTask"
      @back="viewMode = 'list'"
      @refresh="fetchTasks"
    />

    <!-- List View -->
    <div v-else class="h-full flex flex-col">
      <!-- Header -->
      <div class="header-section">
        <h2 class="page-title">固件升级</h2>
        <el-select
          v-model="region"
          placeholder="选择区域"
          class="region-select"
          size="default"
          @change="fetchTasks"
        >
          <el-option label="中国" value="CN" />
          <el-option label="日本" value="JP" />
          <el-option label="美国" value="US" />
          <el-option label="德国" value="DE" />
          <el-option label="英国" value="UK" />
          <el-option label="法国" value="FR" />
          <el-option label="新加坡" value="SG" />
          <el-option label="全球" value="Global" />
        </el-select>
      </div>

      <!-- Product Info Section (No Card Shadow, Clean Look) -->
      <div v-if="currentProduct" class="product-info-section">
        <div class="product-header">
          <span class="product-name">{{ currentProduct.name }}</span>
          <el-dropdown trigger="click" @command="handleProductSwitch">
            <span class="switch-product-btn">
              切换产品 <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="product-dropdown-menu">
                <el-dropdown-item
                  v-for="p in products"
                  :key="p.id"
                  :command="p"
                  :class="{ active: p.id === currentProduct.id }"
                >
                  {{ p.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="product-meta-grid">
          <div class="meta-tag">自定义开发</div>
          <div class="meta-item">
            PID: <span class="mono">{{ currentProduct.id }}</span>
          </div>
          <div class="meta-item">
            品类: <span>{{ currentProduct.type || '未知' }}</span>
          </div>
          <div class="meta-item">
            通讯方式: <span>{{ currentProduct.communicateType || 'Wi-Fi_蓝牙BLE' }}</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-product-alert">
        <el-alert
          title="请先选择一个产品以管理其固件升级任务"
          type="info"
          show-icon
          :closable="false"
        />
        <el-select
          v-model="tempSelectedProductId"
          placeholder="选择产品"
          @change="handleInitialProductSelect"
          class="mt-2"
          style="margin-top: 10px; width: 240px"
        >
          <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
      </div>

      <!-- Toolbar: Filters -->
      <div class="toolbar-container">
        <div class="filters-row">
          <el-select
            v-model="filterRepoId"
            placeholder="筛选固件模块"
            clearable
            class="filter-select"
            @change="fetchTasks"
          >
            <el-option
              v-for="r in repos"
              :key="r.firmwaresRepoId"
              :label="`${r.firmwaresRepoName} (${r.firmwaresRepoId})`"
              :value="r.firmwaresRepoId"
            />
          </el-select>
          <el-select
            v-model="filterStatus"
            placeholder="任务状态"
            clearable
            class="filter-select"
            @change="fetchTasks"
          >
            <el-option label="已暂停" :value="0" />
            <el-option label="发布中" :value="1" />
            <el-option label="已发布" :value="2" />
            <el-option label="已结束" :value="3" />
          </el-select>
        </div>
        <div class="action-row">
          <el-button type="primary" color="#0066ff" :icon="Plus" @click="openCreateWizard"
            >新建固件升级</el-button
          >
          <el-button :icon="Refresh" circle @click="fetchTasks" />
        </div>
      </div>

      <!-- Main Table -->
      <div class="table-wrapper">
        <el-table :data="taskList" v-loading="loading" height="100%" stripe style="width: 100%">
          <el-table-column prop="otaTaskId" label="固件Key" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono-text">{{ row.otaTaskId }}</span>
            </template>
          </el-table-column>
          <el-table-column label="固件类型" min-width="120">
            <template #default="{ row }">
              {{ getRepoName(row.firmwaresRepoId) || row.repoName || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="firmwareVersion" label="固件版本" width="120">
            <template #default="{ row }">
              <span class="version-tag">{{ row.firmwareVersion }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">{{
                getStatusLabel(row.status)
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="国家/数据中心" width="120" align="center">
            <template #default="{ row }">
              {{ getCountryName(row.country) }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="flex-center">
                <el-button link type="primary" size="small" @click="openVerifyDialog(row)"
                  >验证</el-button
                >

                <el-button
                  v-if="row.status === 0"
                  link
                  type="primary"
                  size="small"
                  @click="handlePublish(row)"
                  >发布</el-button
                >
                <el-button
                  v-else-if="row.status === 2"
                  link
                  type="warning"
                  size="small"
                  @click="handlePause(row)"
                  >暂停</el-button
                >

                <el-divider direction="vertical" />

                <el-dropdown
                  trigger="click"
                  @command="(cmd: string) => handleMoreCommand(cmd, row)"
                >
                  <span class="el-dropdown-link">
                    更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit" :disabled="row.status !== 0"
                        >编辑任务</el-dropdown-item
                      >
                      <el-dropdown-item command="delete" style="color: #f56c6c"
                        >删除任务</el-dropdown-item
                      >
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Pagination -->
      <div class="pagination-footer">
        <el-pagination
          v-model:current-page="pageIndex"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchTasks"
          background
          size="small"
        />
      </div>

      <!-- 弹窗：新建任务向导 -->
      <el-dialog
        v-model="wizardVisible"
        title="新建固件升级"
        width="600px"
        destroy-on-close
        class="custom-dialog"
      >
        <el-form :model="taskForm" label-width="120px" style="padding: 10px 20px 10px 0">
          <el-form-item label="产品ID">
            <el-input :value="currentProduct?.id" disabled class="is-disabled-text" />
          </el-form-item>
          <el-form-item label="固件库ID" required>
            <el-select
              v-model="taskForm.firmwaresRepoId"
              placeholder="请选择固件库"
              style="width: 100%"
              @change="handleRepoChange"
              filterable
            >
              <el-option
                v-for="r in repos"
                :key="r.firmwaresRepoId"
                :label="`${r.firmwaresRepoName} (${r.firmwaresRepoId})`"
                :value="r.firmwaresRepoId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="固件版本" required>
            <el-select
              v-model="taskForm.firmwareVersion"
              placeholder="请选择版本"
              style="width: 100%"
              :disabled="!taskForm.firmwaresRepoId"
            >
              <el-option
                v-for="v in versions"
                :key="v.version"
                :label="v.version"
                :value="v.version"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="国家/数据中心" required>
            <el-select
              v-model="taskForm.country"
              placeholder="请选择国家/数据中心"
              style="width: 100%"
            >
              <el-option label="中国" value="CN" />
              <el-option label="日本" value="JP" />
              <el-option label="美国" value="US" />
              <el-option label="德国" value="DE" />
              <el-option label="英国" value="UK" />
              <el-option label="法国" value="FR" />
              <el-option label="新加坡" value="SG" />
              <el-option label="全球" value="Global" />
            </el-select>
          </el-form-item>
          <el-form-item label="升级模式" required>
            <el-select
              v-model="taskForm.upgradeMode"
              placeholder="请选择升级模式"
              style="width: 100%"
            >
              <el-option label="App检测升级" :value="1" />
              <el-option label="App提醒升级" :value="2" />
              <el-option label="App强制升级" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="版本说明">
            <el-input
              type="textarea"
              v-model="taskForm.releaseNote"
              rows="3"
              placeholder="请输入展示给用户的升级说明"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="taskForm.remark" placeholder="仅内部可见" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 12px">
            <el-button @click="wizardVisible = false">取消</el-button>
            <el-button type="primary" color="#0066ff" @click="submitDraft" :loading="submitting"
              >确定</el-button
            >
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as OtaApi from '@/api/modules/iot-ota'
import * as FirmwareApi from '@/api/modules/iot-firmware'
import { fetchProducts } from '@/api/modules/product'
import type { Product } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import TaskVerify from './TaskVerify.vue'
import TaskPublish from './TaskPublish.vue'

// --- State ---
const viewMode = ref<'list' | 'verify' | 'publish'>('list')
const activeTask = ref<OtaApi.OTATaskDto | null>(null)

const region = ref('Global')
const loading = ref(false)
const taskList = ref<OtaApi.OTATaskDto[]>([])
const pageIndex = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Product Context
const products = ref<Product[]>([])
const currentProduct = ref<Product | null>(null)
const tempSelectedProductId = ref('')

// Filters
const filterRepoId = ref('')
const filterStatus = ref<number | undefined>(undefined)
const repos = ref<FirmwareApi.FirmwaresRepoDto[]>([])

const getCountryName = (code: string) => {
  const map: Record<string, string> = {
    CN: '中国',
    China: '中国',
    JP: '日本',
    Japan: '日本',
    US: '美国',
    USA: '美国',
    DE: '德国',
    Germany: '德国',
    UK: '英国',
    'United Kingdom': '英国',
    FR: '法国',
    France: '法国',
    SG: '新加坡',
    Singapore: '新加坡',
    Global: '全球',
    EU: '欧洲',
    Europe: '欧洲',
  }
  return map[code] || code || '未知'
}

// Wizard
const wizardVisible = ref(false)
const submitting = ref(false)
const versions = ref<FirmwareApi.FirmwareDto[]>([])
const taskForm = reactive({
  productId: '',
  firmwaresRepoId: '',
  firmwareVersion: '',
  country: 'CN',
  upgradeMode: 1,
  releaseNote: '',
  remark: '',
})

// --- Methods ---

onMounted(async () => {
  await loadCommonData()
  if (products.value.length > 0) {
    const firstProduct = products.value[0]
    if (firstProduct) {
      handleProductSwitch(firstProduct)
    }
  }
})

const loadCommonData = async () => {
  products.value = await fetchProducts()
  // 初始不加载所有仓库，改为跟随产品加载
}

const getRepoName = (repoId: string) => {
  const r = repos.value.find((x) => x.firmwaresRepoId === repoId)
  return r ? r.firmwaresRepoName : repoId
}

const handleProductSwitch = (product: Product) => {
  currentProduct.value = product
  fetchTasks()
  fetchProductRepos()
}

const handleInitialProductSelect = (id: string) => {
  const p = products.value.find((x) => x.id === id)
  if (p) handleProductSwitch(p)
}

const fetchProductRepos = async () => {
  if (!currentProduct.value) return
  try {
    // 1. 获取产品关联的固件库 ID 列表
    const assocRes = await FirmwareApi.queryProductFirmwares({
      productId: currentProduct.value.id,
      pageIndex: 1,
      pageSize: 100,
    })
    const assocData =
      ((assocRes as unknown as Record<string, unknown>).data as Record<string, unknown>) || assocRes
    const associatedItems = (assocData.items as Record<string, unknown>[]) || []
    const associatedIds = associatedItems.map(
      (item: Record<string, unknown>) =>
        (item.firmwaresRepoId as string) || (item.FirmwaresRepoId as string),
    )

    if (associatedIds.length === 0) {
      repos.value = []
      return
    }

    // 2. 获取所有固件库的详细信息（为了获取正确的名称）
    const reposRes = await FirmwareApi.queryFirmwaresRepos({
      pageIndex: 1,
      pageSize: 100, // 假设仓库数量不多，一次获取
    })
    const reposData =
      ((reposRes as unknown as Record<string, unknown>).data as Record<string, unknown>) || reposRes
    const allRepos = ((reposData.items as Record<string, unknown>[]) || []).map(
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
        createdAt: (item.createdAt as string) || (item.CreatedAt as string) || '',
      }),
    ) as FirmwareApi.FirmwaresRepoDto[]

    // 3. 过滤并合并数据
    repos.value = allRepos
      .filter((r: FirmwareApi.FirmwaresRepoDto) => associatedIds.includes(r.firmwaresRepoId))
      .map((r: FirmwareApi.FirmwaresRepoDto) => ({
        firmwaresRepoId: r.firmwaresRepoId,
        firmwaresRepoName: r.firmwaresRepoName || '未知仓库',
        firmwaresRepoType: r.firmwaresRepoType,
        firmwaresRepoChannel: r.firmwaresRepoChannel || 0,
        updateTimeoutValue: r.updateTimeoutValue || 0,
        createdAt: r.createdAt || '',
      }))
  } catch (e) {
    console.error('加载产品关联仓库失败', e)
    repos.value = []
  }
}

const fetchTasks = async () => {
  if (!currentProduct.value) return
  loading.value = true
  try {
    const res = await OtaApi.queryOTATasks({
      pageIndex: pageIndex.value,
      pageSize: pageSize.value,
      productId: currentProduct.value.id,
      firmwaresRepoId: filterRepoId.value || undefined,
      status: filterStatus.value,
      country: region.value === 'Global' ? undefined : region.value,
    })
    const data =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res

    // Log for debugging status mismatch
    console.log('Fetched Tasks:', data.items)

    taskList.value = ((data.items as Record<string, unknown>[]) || []).map(
      (item: Record<string, unknown>) => {
        const task: OtaApi.OTATaskDto = {
          otaTaskId: (item.otaTaskId as string) || (item.OtaTaskId as string) || '',
          productName: (item.productName as string) || (item.ProductName as string),
          firmwareVersion:
            (item.firmwareVersion as string) || (item.FirmwareVersion as string) || '',
          repoName: (item.repoName as string) || (item.RepoName as string),
          upgradeMode:
            item.upgradeMode !== undefined
              ? (item.upgradeMode as number)
              : (item.UpgradeMode as number) || 0,
          status:
            item.Status !== undefined && item.Status !== null
              ? (item.Status as number)
              : item.status !== undefined && item.status !== null
                ? (item.status as number)
                : 0,
          createTime: (item.createTime as string) || (item.CreateTime as string) || '',
          publishTime: (item.publishTime as string) || (item.PublishTime as string),
          productId: (item.productId as string) || (item.ProductId as string) || '',
          firmwaresRepoId:
            (item.firmwaresRepoId as string) || (item.FirmwaresRepoId as string) || '',
          releaseNote: (item.releaseNote as string) || (item.ReleaseNote as string),
          remark: (item.remark as string) || (item.Remark as string),
          country: (item.country as string) || (item.Country as string) || 'CN',
        }
        return task
      },
    )
    total.value = (data.totalCount as number) || 0
  } catch (e) {
    console.error('Fetch tasks error:', e)
  } finally {
    loading.value = false
  }
}

// Helpers
const getStatusLabel = (status: number) => {
  switch (status) {
    case 0:
      return '已暂停' // 用户指定：0 为暂停 (原草稿)
    case 1:
      return '发布中'
    case 2:
      return '已发布' // 用户指定：2 为发布 (原暂停)
    case 3:
      return '已结束'
    default:
      return '未知'
  }
}

const getStatusType = (status: number) => {
  switch (status) {
    case 0:
      return 'warning' // 暂停用黄色
    case 1:
      return 'primary'
    case 2:
      return 'success' // 发布用绿色
    case 3:
      return 'info'
    default:
      return 'info'
  }
}

// Wizard
const openCreateWizard = () => {
  if (!currentProduct.value) return ElMessage.warning('请先选择产品')
  wizardVisible.value = true
  Object.assign(taskForm, {
    productId: currentProduct.value.id,
    firmwaresRepoId: '',
    firmwareVersion: '',
    country: 'CN',
    upgradeMode: 1,
    releaseNote: '',
    remark: '',
  })
  versions.value = []
}

const handleRepoChange = async (repoId: string) => {
  taskForm.firmwareVersion = ''
  versions.value = []

  if (!repoId) return

  try {
    const res = await FirmwareApi.queryFirmwares({ repoId, pageIndex: 1, pageSize: 100 })
    const data =
      ((res as unknown as Record<string, unknown>).data as Record<string, unknown>) || res

    // 兼容不同的返回结构
    let rawItems: Record<string, unknown>[] = []
    if (Array.isArray(data)) {
      rawItems = data as Record<string, unknown>[]
    } else if (Array.isArray(data.items)) {
      rawItems = data.items as Record<string, unknown>[]
    }

    // 数据清洗，确保 version 字段存在
    versions.value = rawItems
      .map((v: Record<string, unknown>) => {
        const item: FirmwareApi.FirmwareDto = {
          repoId: (v.repoId as string) || (v.RepoId as string) || repoId,
          version:
            (v.version as string) || (v.firmwareVersion as string) || (v.Version as string) || '',
          mandatoryVersion:
            v.mandatoryVersion !== undefined
              ? (v.mandatoryVersion as number)
              : (v.MandatoryVersion as number) || 0,
          fileSize: (v.fileSize as number) || (v.FileSize as number) || 0,
          uploadTime: (v.uploadTime as string) || (v.UploadTime as string) || '',
          releaseNote: (v.releaseNote as string) || (v.ReleaseNote as string),
          fileName: (v.fileName as string) || (v.FileName as string),
        }
        return item
      })
      .filter((v) => v.version)
  } catch (e) {
    console.error('加载固件版本失败', e)
    versions.value = []
  }
}

const submitDraft = async () => {
  if (!taskForm.firmwaresRepoId || !taskForm.firmwareVersion || !taskForm.country) {
    return ElMessage.warning('请填写完整')
  }
  submitting.value = true
  try {
    const success = await OtaApi.createOTATaskDraft(taskForm)
    if (success) {
      ElMessage.success('创建成功')
      wizardVisible.value = false
      fetchTasks()
    } else {
      ElMessage.error('创建失败')
    }
  } finally {
    submitting.value = false
  }
}

const openVerifyDialog = (row: OtaApi.OTATaskDto) => {
  activeTask.value = row
  viewMode.value = 'verify'
}

// Actions
const handlePublish = async (row: OtaApi.OTATaskDto) => {
  activeTask.value = row
  viewMode.value = 'publish'
}

const handlePause = async (row: OtaApi.OTATaskDto) => {
  try {
    await ElMessageBox.confirm('确定暂停任务？', '提示', { type: 'warning' })
    await OtaApi.pausePublish(row.otaTaskId)
    ElMessage.success('已暂停')
    fetchTasks()
  } catch {}
}

const handleMoreCommand = (cmd: string, row: OtaApi.OTATaskDto) => {
  if (cmd === 'delete') handleDelete(row)
  else if (cmd === 'edit') handleEdit(row)
}

const handleDelete = async (row: OtaApi.OTATaskDto) => {
  try {
    await ElMessageBox.confirm('确定删除此任务？', '警告', { type: 'error' })
    await OtaApi.deleteTask(row.otaTaskId)
    ElMessage.success('已删除')
    fetchTasks()
  } catch {}
}

const handleEdit = (row: OtaApi.OTATaskDto) => {
  // 仅 0 (已暂停) 状态下允许编辑
  if (row.status !== 0) return ElMessage.warning('只能编辑已暂停的任务')
  wizardVisible.value = true
  Object.assign(taskForm, {
    productId: row.productId,
    firmwaresRepoId: row.firmwaresRepoId,
    firmwareVersion: row.firmwareVersion,
    upgradeMode: row.upgradeMode,
    releaseNote: row.releaseNote,
    remark: row.remark || '',
  })
  handleRepoChange(row.firmwaresRepoId)
}
</script>

<style scoped>
.task-manager-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-sizing: border-box;
  overflow: hidden;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}
.region-select {
  width: 120px;
}

.product-info-section {
  margin-bottom: 24px;
}
.product-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
}
.product-name {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.2;
}
.switch-product-btn {
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  margin-top: 4px;
  display: flex;
  align-items: center;
}
.switch-product-btn:hover {
  color: #0066ff;
}

.product-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  color: #606266;
  font-size: 14px;
}
.meta-tag {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mono {
  font-family: monospace;
}

.toolbar-container {
  margin-bottom: 16px;
}
.filters-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.filter-select {
  width: 100%;
}
.action-row {
  display: flex;
  gap: 12px;
}

.table-wrapper {
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

.mono-text {
  font-family: monospace;
  color: #606266;
}
.version-tag {
  font-family: monospace;
  font-weight: 600;
  background-color: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
}
.el-dropdown-link {
  cursor: pointer;
  color: #909399;
  display: flex;
  align-items: center;
  font-size: 12px;
}
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
</style>
