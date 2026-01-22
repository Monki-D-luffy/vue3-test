<template>
  <el-dialog v-model="visible" title="固件发布向导" width="800px" :close-on-click-modal="false" append-to-body
    class="firmware-wizard-dialog" destroy-on-close>
    <div class="px-8 pt-2 pb-6 bg-gray-50 border-b border-gray-100 mb-6">
      <el-steps :active="activeStep" finish-status="success" align-center>
        <el-step title="选择仓库" description="目标环境" />
        <el-step title="上传固件" description="文件入库" />
        <el-step title="创建任务" description="配置升级" />
        <el-step title="完成" description="结果概览" />
      </el-steps>
    </div>

    <div class="wizard-content px-8 min-h-[320px]" v-loading="loading || internalLoading">

      <div v-if="activeStep === 0" class="step-panel max-w-lg mx-auto">

        <el-radio-group v-model="step1.mode" class="w-full flex mb-6">
          <el-radio-button value="select" class="flex-1">选择已关联库</el-radio-button>
          <el-radio-button value="create" class="flex-1">新建专用库</el-radio-button>
        </el-radio-group>

        <div v-if="step1.mode === 'select'">
          <div class="text-xs text-gray-300 text-center mb-2" v-if="availableRepos.length === 0">
            (正在扫描关联库... ProductID: {{ product.id }})
          </div>

          <div v-if="availableRepos.length > 0">
            <el-form label-width="100px" label-position="left">
              <el-form-item label="目标仓库" required>
                <el-select v-model="step1.selectedRepoId" placeholder="请选择目标仓库" class="w-full"
                  @change="handleRepoSelectChange">
                  <el-option v-for="repo in availableRepos" :key="repo.id" :label="repo.name" :value="repo.id">
                    <span class="float-left">{{ repo.name }}</span>
                    <span class="float-right text-gray-400 text-xs ml-2">
                      {{ formatRepoType(repo.type) }} (Ch:{{ repo.channel }})
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-form>

            <div class="bg-blue-50 p-4 rounded text-sm text-blue-700 mt-4 border border-blue-100"
              v-if="step1.selectedRepoId">
              <div class="flex items-center gap-2 mb-1">
                <el-icon>
                  <InfoFilled />
                </el-icon>
                <span class="font-bold">已选仓库: {{ getSelectedRepoName() }}</span>
              </div>
              <div class="pl-6 text-xs text-blue-500">ID: {{ step1.selectedRepoId }}</div>
            </div>
          </div>

          <div v-else-if="!internalLoading" class="text-center py-10">
            <el-empty description="当前产品暂无关联固件库" :image-size="80">
              <el-button type="primary" @click="step1.mode = 'create'">去新建一个</el-button>
            </el-empty>
          </div>
        </div>

        <el-form v-if="step1.mode === 'create'" :model="step1.createForm" :rules="createRules" ref="createFormRef"
          label-width="100px" label-position="left">
          <el-form-item label="库名称" prop="name">
            <el-input v-model="step1.createForm.name" placeholder="建议命名: 产品名_类型" />
          </el-form-item>

          <el-form-item label="固件类型" prop="type">
            <el-select v-model="step1.createForm.type" class="w-full">
              <el-option label="MCU (主控固件)" :value="1" />
              <el-option label="Module (模组/设备)" :value="0" />
            </el-select>
          </el-form-item>

          <el-form-item label="通道号" prop="channel">
            <el-input-number v-model="step1.createForm.channel" :min="0" :max="255" class="w-full" />
            <div class="text-xs text-gray-400 mt-1" v-if="step1.createForm.type === 0">
              <span class="text-red-500">*</span> Module/Device 类型通道号建议大于 0
            </div>
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="step1.createForm.note" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>

      </div>

      <div v-if="activeStep === 1" class="step-panel max-w-lg mx-auto">
        <el-form :model="step2" label-width="100px" label-position="left">
          <el-form-item label="目标仓库">
            <el-tag type="info" size="large" effect="plain">{{ runtimeContext.repoName }}</el-tag>
          </el-form-item>
          <el-form-item label="版本号" required>
            <el-input v-model="step2.version" placeholder="例如: 1.0.0" class="font-mono">
              <template #prefix>v</template>
            </el-input>
          </el-form-item>
          <el-form-item label="固件文件" required>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center w-full cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all relative">
              <input type="file" class="absolute inset-0 opacity-0 cursor-pointer" @change="handleFileChange"
                accept=".bin,.hex,.zip" />
              <div v-if="!step2.file">
                <el-icon class="text-3xl text-gray-400 mb-2">
                  <UploadFilled />
                </el-icon>
                <div class="text-sm text-gray-600">点击或拖拽上传固件</div>
              </div>
              <div v-else class="flex items-center justify-center gap-2 text-green-600">
                <el-icon class="text-xl">
                  <DocumentChecked />
                </el-icon>
                <span class="font-bold">{{ step2.file.name }}</span>
                <span class="text-xs text-gray-400 bg-white px-1 rounded border">{{ formatSize(step2.file.size)
                }}</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="更新说明">
            <el-input v-model="step2.note" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </div>

      <div v-if="activeStep === 2" class="step-panel max-w-lg mx-auto">
        <el-alert title="固件已上传成功" type="success" :closable="false" class="mb-6" />
        <el-form :model="step3" label-width="100px" label-position="left">
          <el-form-item label="任务名称" required>
            <el-input v-model="step3.taskName" />
          </el-form-item>
          <el-form-item label="升级范围">
            <el-radio-group v-model="step3.scope">
              <el-radio-button label="all">全量升级</el-radio-button>
              <el-radio-button label="filter">定向灰度</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="失败重试">
            <el-switch v-model="step3.retry" active-text="开启" inactive-text="关闭" />
          </el-form-item>
          <div v-if="step3.scope === 'filter'" class="bg-gray-50 p-4 rounded mb-4">
            <el-form-item label="指定设备ID">
              <el-input v-model="step3.deviceIds" type="textarea" placeholder="输入设备UUID，用逗号分隔" />
            </el-form-item>
          </div>
          <el-form-item label="备注">
            <el-input v-model="step3.remark" placeholder="可选备注" />
          </el-form-item>
        </el-form>
      </div>

      <div v-if="activeStep === 3" class="step-panel">
        <div class="text-center mb-6">
          <el-icon class="text-6xl text-green-500 mb-2">
            <CircleCheckFilled />
          </el-icon>
          <h2 class="text-xl font-bold text-gray-800">流程完成</h2>
        </div>
        <el-descriptions border :column="2" class="mb-6">
          <el-descriptions-item label="产品">{{ product.name }}</el-descriptions-item>
          <el-descriptions-item label="固件库">{{ runtimeContext.repoName }}</el-descriptions-item>
          <el-descriptions-item label="固件版本">{{ step2.version }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatSize(step2.file?.size || 0) }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag type="info">草稿 (Draft)</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务ID">
            <span class="font-mono text-xs">{{ runtimeContext.taskId }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

    </div>

    <template #footer>
      <div class="flex justify-between items-center pt-4 border-t border-gray-100">
        <div class="text-xs text-gray-300">
          Repos: {{ availableRepos.length }}
        </div>

        <div class="flex gap-3">
          <el-button v-if="activeStep === 0" @click="visible = false">取消</el-button>

          <el-button v-if="activeStep === 0" type="primary" @click="handleStep1Next"
            :loading="loading || internalLoading">
            下一步: 上传固件
          </el-button>

          <el-button v-if="activeStep === 1" type="primary" @click="handleStep2Next" :loading="loading"
            :disabled="!step2.file || !step2.version">
            下一步: 创建任务
          </el-button>

          <el-button v-if="activeStep === 2" type="primary" @click="handleStep3Next" :loading="loading">
            确认发布
          </el-button>

          <el-button v-if="activeStep === 3" type="success" @click="handleFinish">
            关闭窗口
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { UploadFilled, DocumentChecked, CircleCheckFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { Product } from '@/types'
import type { CreateOTATaskDraftRequest } from '@/api/modules/iot-ota'
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'

// 定义 Props
const props = withDefaults(defineProps<{
  modelValue: boolean
  product: Product
  repoStatus?: string // 可选
  linkedRepos?: any[] // 可选
}>(), {
  linkedRepos: () => []
})

const emit = defineEmits(['update:modelValue', 'success'])

// ⚠️ 关键修正：引入 checkProductContext 和内部 state
const {
  createRepoAction,
  linkRepoAction,
  uploadAction,
  createTaskAction,
  checkProductContext,
  linkedRepos: internalFetchedRepos, // 这是组件自己拉取的数据
  loading: internalLoading
} = useFirmwareManagement()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeStep = ref(0)
const loading = ref(false)
const createFormRef = ref<FormInstance>()

// ⚠️ 核心逻辑：双源合并 (Props 优先，自查兜底)
const availableRepos = computed(() => {
  // 如果父组件传了有效数据，就用父组件的
  if (props.linkedRepos && props.linkedRepos.length > 0) {
    return props.linkedRepos
  }
  // 否则使用自己拉取的数据
  return internalFetchedRepos.value || []
})

// Data Models
const step1 = reactive({
  mode: 'select',
  selectedRepoId: '',
  createForm: {
    name: '',
    type: 1, // Default MCU
    channel: 0,
    note: ''
  }
})

// 校验规则
const createRules = {
  name: [{ required: true, message: '请输入库名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  channel: [
    {
      validator: (rule: any, value: number, callback: Function) => {
        if (step1.createForm.type === 0 && (!value || value <= 0)) {
          return callback(new Error('Device/Module 类型通道号必须大于0'))
        }
        // 使用 computed 的数据进行检查
        const conflict = availableRepos.value.some(repo =>
          repo.type === step1.createForm.type &&
          repo.channel === value
        )
        if (conflict) {
          return callback(new Error('该类型和通道的固件库已存在，请直接选择已关联库'))
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const step2 = reactive({
  version: '',
  note: '',
  file: null as File | null
})

const step3 = reactive({
  taskName: '',
  scope: 'all',
  retry: false,
  deviceIds: '',
  remark: ''
})

const runtimeContext = reactive({
  repoId: '',
  repoName: '',
  taskId: ''
})

// --- 初始化与监听 ---

// 1. 监听弹窗打开：重置状态 + 强制拉取数据
watch(() => props.modelValue, async (val) => {
  if (val) {
    console.log('🚀 Wizard Opened. Checking data sources...')
    activeStep.value = 0
    step2.version = ''
    step2.file = null
    step3.taskName = ''

    // ⚠️ 核心修复：如果父组件没给数据，自己去拉！
    if (props.linkedRepos.length === 0) {
      console.log('⚠️ Props data is empty. Triggering self-fetch for product:', props.product.id)
      await checkProductContext(props.product.id)
    } else {
      console.log('✅ Props data detected. Using parent data.')
    }

    // 数据到位后初始化 UI 状态
    initializeStep1()
  }
})

// 2. 监听数据变化 (无论是 Props 变了还是 Internal 变了)
watch(availableRepos, (newVal) => {
  if (props.modelValue && newVal && newVal.length > 0) {
    console.log('📦 Wizard detected data update (Props or Internal), refreshing UI')
    initializeStep1()
  }
}, { deep: true })

const initializeStep1 = () => {
  if (availableRepos.value.length > 0) {
    step1.mode = 'select'
    // 默认选中第一个
    if (!step1.selectedRepoId) {
      const first = availableRepos.value[0]
      step1.selectedRepoId = first.id
      handleRepoSelectChange(first.id)
    }
  } else {
    // 确实没数据，切换到新建模式
    step1.mode = 'create'
    step1.selectedRepoId = ''
    if (!step1.createForm.name) {
      step1.createForm.name = `${props.product.name}_Repo`
    }
  }
}

// 辅助函数
const handleRepoSelectChange = (id: string) => {
  const repo = availableRepos.value.find(r => r.id === id)
  if (repo) {
    runtimeContext.repoId = repo.id
    runtimeContext.repoName = repo.name
    step3.taskName = `Upgrade ${props.product.name} (${repo.name})`
  }
}

const getSelectedRepoName = () => {
  return availableRepos.value.find(r => r.id === step1.selectedRepoId)?.name || ''
}

const formatRepoType = (type: number) => {
  return type === 1 ? 'MCU (主控)' : 'Module (模组)'
}

const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length) step2.file = files[0]
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB'], i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// --- Step Handlers ---

const handleStep1Next = async () => {
  if (step1.mode === 'select') {
    if (!step1.selectedRepoId) return ElMessage.warning('请选择一个仓库')
    activeStep.value = 1
  }
  else {
    if (!createFormRef.value) return
    await createFormRef.value.validate(async (valid) => {
      if (valid) {
        loading.value = true
        try {
          const id = await createRepoAction({
            name: step1.createForm.name,
            type: step1.createForm.type,
            channel: step1.createForm.channel,
            note: step1.createForm.note
          })
          await linkRepoAction(props.product.id, id)

          // 强制刷新内部数据，确保下一步能用
          await checkProductContext(props.product.id)

          runtimeContext.repoId = id
          runtimeContext.repoName = step1.createForm.name
          step3.taskName = `Upgrade ${props.product.name}`

          activeStep.value = 1
        } catch (e: any) {
          if (e.message && e.message.includes('exist')) {
            ElMessage.error('创建失败：该类型的固件库可能已存在，请切换到“选择已关联库”查看')
          } else {
            ElMessage.error('创建失败，请检查网络或参数')
          }
        } finally {
          loading.value = false
        }
      }
    })
  }
}

const handleStep2Next = async () => {
  if (!step2.file) return
  loading.value = true
  try {
    await uploadAction(runtimeContext.repoId, step2.version, step2.note, step2.file)
    step3.taskName = `${props.product.name} 升级 v${step2.version}`
    activeStep.value = 2
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    loading.value = false
  }
}

const handleStep3Next = async () => {
  loading.value = true
  try {
    const taskPayload: CreateOTATaskDraftRequest = {
      productId: props.product.id,
      firmwaresRepoId: runtimeContext.repoId,
      firmwareVersion: step2.version,
      country: 'Default',
      upgradeMode: step3.scope === 'all' ? 0 : 1,
      releaseNote: step2.note,
      remark: step3.remark
    }

    await createTaskAction(taskPayload)
    runtimeContext.taskId = 'DRAFT_' + Date.now().toString().slice(-6)
    activeStep.value = 3
  } catch (e) {
    ElMessage.error('创建任务失败')
  } finally {
    loading.value = false
  }
}

const handleFinish = () => {
  visible.value = false
  emit('success')
}
</script>