<template>
  <div class="product-function">
    <div class="function-grid">
      <!-- 左侧：功能点管理卡片 -->
      <div class="function-card">
        <div class="card-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><DocumentAdd /></el-icon>
            </div>
            <div class="header-text">
              <h3>功能点定义</h3>
              <p>定义产品的功能特性</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showStandardDialog = true">
              <el-icon><Box /></el-icon>
              标准功能
            </el-button>
            <el-button type="success" @click="addCustomDataPoint">
              <el-icon><EditPen /></el-icon>
              自定义功能
            </el-button>
          </div>
        </div>

        <!-- 功能点列表 -->
        <div class="data-points-list">
          <div
            v-for="(point, index) in dataPoints"
            :key="point.id"
            class="data-point-item"
            :class="getPointClass(point)"
          >
            <div class="point-header">
              <div class="point-info">
                <div class="point-code">{{ point.code }}</div>
                <div class="point-name">{{ point.name }}</div>
              </div>
              <div class="point-badges">
                <el-tag :type="getDataTypeTagType(point.dataType)" size="small">
                  {{ getDataTypeText(point.dataType) }}
                </el-tag>
                <el-tag :type="point.direction === 'input' ? 'primary' : 'success'" size="small">
                  {{ point.direction === 'input' ? '输入' : '输出' }}
                </el-tag>
              </div>
            </div>

            <div class="point-config">
              <div v-if="point.dataType === 'boolean'" class="config-text">布尔值类型</div>
              <div
                v-else-if="point.dataType === 'integer' || point.dataType === 'float'"
                class="config-text"
              >
                范围: {{ point.min || 0 }} - {{ point.max || 100 }}
                <span v-if="point.unit">({{ point.unit }})</span>
              </div>
              <div v-else-if="point.dataType === 'enum'" class="config-text">
                {{ point.enumValues?.length || 0 }} 个选项
              </div>
              <div v-else-if="point.dataType === 'string'" class="config-text">字符串类型</div>
            </div>

            <div class="point-actions">
              <el-button link type="primary" size="small" @click="editDataPoint(point, index)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button link type="danger" size="small" @click="deleteDataPoint(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div v-if="dataPoints.length === 0" class="empty-state">
            <el-empty description="暂无功能点，请添加标准功能或自定义功能">
              <el-button type="primary" @click="showStandardDialog = true">添加功能</el-button>
            </el-empty>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-cards">
          <div class="stat-card text-primary">
            <div class="stat-content">
              <span class="stat-label">Total Points</span>
              <div class="stat-number-box">
                <span class="stat-value">{{ dataPoints.length }}</span>
                <span class="stat-unit">个</span>
              </div>
            </div>

            <el-icon class="bg-icon text-primary">
              <DataLine />
            </el-icon>
          </div>
          <div class="stat-card text-success">
            <div class="stat-content">
              <span class="stat-label">Input Points</span>
              <div class="stat-number-box">
                <span class="stat-value">{{ inputCount }}</span>
                <span class="stat-unit">个</span>
              </div>
            </div>

            <el-icon class="bg-icon text-success">
              <ArrowDown />
            </el-icon>
          </div>
          <div class="stat-card text-warning">
            <div class="stat-content">
              <span class="stat-label">Output Points</span>
              <div class="stat-number-box">
                <span class="stat-value">{{ outputCount }}</span>
                <span class="stat-unit">个</span>
              </div>
            </div>

            <el-icon class="bg-icon text-warning">
              <ArrowUp />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 右侧：预览卡片 -->
      <div class="preview-card">
        <div class="card-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><View /></el-icon>
            </div>
            <div class="header-text">
              <h3>实时预览</h3>
              <p>查看生成的代码和配置</p>
            </div>
          </div>
          <div class="preview-mode">
            <el-radio-group v-model="previewMode" size="small">
              <el-radio-button value="json">JSON</el-radio-button>
              <el-radio-button value="code">代码</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="preview-content">
          <!-- JSON 模式 -->
          <div v-if="previewMode === 'json'" class="preview-panel">
            <div class="panel-header">
              <span class="panel-title">物模型 JSON</span>
              <el-button link size="small" @click="copyJson">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </div>
            <div class="code-container">
              <pre class="code-content">{{ productSchemaJson }}</pre>
            </div>
          </div>

          <!-- 代码模式 -->
          <div v-else class="preview-panel">
            <div class="panel-header">
              <span class="panel-title">C 语言结构体</span>
              <el-button link size="small" @click="downloadCode">
                <el-icon><Download /></el-icon>
              </el-button>
            </div>
            <div class="code-container">
              <pre class="code-content"><code>{{ generatedCStruct }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标准功能选择对话框 -->
    <el-dialog v-model="showStandardDialog" title="选择标准功能" width="800px">
      <div class="standard-functions">
        <div
          v-for="category in standardFunctionCategories"
          :key="category.id"
          class="function-category"
        >
          <h4>{{ category.name }}</h4>
          <div class="function-items">
            <div
              v-for="func in category.functions"
              :key="func.id"
              class="function-item"
              @click="selectStandardFunction(func)"
            >
              <div class="function-icon">
                <el-icon :size="32"><component :is="func.icon" /></el-icon>
              </div>
              <div class="function-info">
                <div class="function-name">{{ func.name }}</div>
                <div class="function-desc">{{ func.description }}</div>
              </div>
              <el-button type="primary" size="small">添加</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 自定义功能编辑对话框 -->
    <el-dialog
      v-model="showCustomDialog"
      :title="editingIndex !== null ? '编辑功能点' : '添加自定义功能'"
      width="600px"
    >
      <el-form ref="customFormRef" :model="customForm" :rules="customFormRules" label-width="100px">
        <el-form-item label="标识符" prop="code">
          <el-input
            v-model="customForm.code"
            placeholder="如: switch_led"
            :disabled="editingIndex !== null"
          />
        </el-form-item>
        <el-form-item label="显示名称" prop="name">
          <el-input v-model="customForm.name" placeholder="如: LED开关" />
        </el-form-item>
        <el-form-item label="数据类型" prop="dataType">
          <el-select v-model="customForm.dataType" @change="onDataTypeChange">
            <el-option label="布尔值" value="boolean" />
            <el-option label="整数" value="integer" />
            <el-option label="浮点数" value="float" />
            <el-option label="枚举" value="enum" />
            <el-option label="字符串" value="string" />
          </el-select>
        </el-form-item>
        <el-form-item label="传输方向" prop="direction">
          <el-radio-group v-model="customForm.direction">
            <el-radio value="input">输入</el-radio>
            <el-radio value="output">输出</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 数值类型配置 -->
        <template v-if="customForm.dataType === 'integer' || customForm.dataType === 'float'">
          <el-form-item label="最小值" prop="min">
            <el-input-number
              v-model="customForm.min"
              :precision="customForm.dataType === 'float' ? 2 : 0"
            />
          </el-form-item>
          <el-form-item label="最大值" prop="max">
            <el-input-number
              v-model="customForm.max"
              :precision="customForm.dataType === 'float' ? 2 : 0"
            />
          </el-form-item>
          <el-form-item label="步长" prop="step">
            <el-input-number
              v-model="customForm.step"
              :precision="customForm.dataType === 'float' ? 2 : 0"
              :min="0.01"
            />
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="customForm.unit" placeholder="如: °C, %, V" />
          </el-form-item>
        </template>

        <!-- 枚举类型配置 -->
        <template v-if="customForm.dataType === 'enum'">
          <el-form-item label="枚举选项">
            <div class="enum-editor">
              <div
                v-for="(enumItem, index) in customForm.enumValues || []"
                :key="index"
                class="enum-item"
              >
                <el-input
                  v-model="enumItem.value"
                  placeholder="值"
                  size="small"
                  style="width: 100px"
                />
                <el-input
                  v-model="enumItem.description"
                  placeholder="描述"
                  size="small"
                  style="width: 150px; margin-left: 8px"
                />
                <el-button
                  type="danger"
                  size="small"
                  @click="removeEnumItem(index)"
                  style="margin-left: 8px"
                >
                  删除
                </el-button>
              </div>
              <el-button type="primary" size="small" @click="addEnumItem" style="margin-top: 8px">
                添加选项
              </el-button>
            </div>
          </el-form-item>
        </template>

        <el-form-item label="描述">
          <el-input
            v-model="customForm.description"
            type="textarea"
            :rows="3"
            placeholder="功能点的详细描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCustomDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCustomDataPoint"> 保存 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Plus,
  Switch,
  Sunny,
  Odometer,
  WindPower,
  Lock,
  Unlock,
  DocumentAdd,
  View,
  Edit,
  Delete,
  DataLine,
  ArrowDown,
  ArrowUp,
  DocumentCopy,
  Download,
  Box,
  EditPen,
} from '@element-plus/icons-vue'
import type { DataPoint, DataPointType } from '@/types'

// 直接从路由获取productId
const route = useRoute()
const productId = computed(() => route.params.pid as string)

// Emits
const emit = defineEmits<{
  save: [data: DataPoint[]]
  next: []
}>()

// 响应式数据
const dataPoints = ref<DataPoint[]>([
  {
    id: '1',
    code: 'switch_led',
    name: 'LED开关',
    dataType: 'boolean',
    direction: 'output',
    description: '控制LED灯的开关状态',
  },
])

const previewMode = ref<'json' | 'code'>('json')
const showStandardDialog = ref(false)
const showCustomDialog = ref(false)
const editingIndex = ref<number | null>(null)

// 自定义表单
const customForm = reactive<DataPoint>({
  id: '',
  code: '',
  name: '',
  dataType: 'boolean' as DataPointType,
  direction: 'output' as 'input' | 'output',
  description: '',
  min: 0,
  max: 100,
  step: 1,
  unit: '',
  enumValues: [] as Array<{ value: any; description: string }>,
})

const customFormRef = ref<FormInstance>()

// 表单验证规则
const customFormRules: FormRules = {
  code: [
    { required: true, message: '请输入标识符', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '标识符只能包含小写字母、数字和下划线，且必须以字母开头',
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  dataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  direction: [{ required: true, message: '请选择传输方向', trigger: 'change' }],
}

// 标准功能分类
const standardFunctionCategories = [
  {
    id: 'lighting',
    name: '照明控制',
    functions: [
      {
        id: 'switch_led',
        name: 'LED开关',
        description: '控制LED灯的开关状态',
        icon: Switch,
        dataPoints: [
          {
            code: 'switch_led',
            name: 'LED开关',
            dataType: 'boolean' as DataPointType,
            direction: 'output' as 'input' | 'output',
          },
        ],
      },
      {
        id: 'brightness',
        name: '亮度控制',
        description: '调节LED灯的亮度',
        icon: Sunny,
        dataPoints: [
          {
            code: 'brightness',
            name: '亮度',
            dataType: 'integer' as DataPointType,
            direction: 'output' as 'input' | 'output',
            min: 0,
            max: 100,
            unit: '%',
          },
        ],
      },
    ],
  },
  {
    id: 'sensor',
    name: '传感器',
    functions: [
      {
        id: 'temperature',
        name: '温度传感器',
        description: '测量环境温度',
        icon: Odometer,
        dataPoints: [
          {
            code: 'temperature',
            name: '温度',
            dataType: 'float' as DataPointType,
            direction: 'input' as 'input' | 'output',
            min: -40,
            max: 125,
            unit: '°C',
          },
        ],
      },
      {
        id: 'humidity',
        name: '湿度传感器',
        description: '测量环境湿度',
        icon: Odometer,
        dataPoints: [
          {
            code: 'humidity',
            name: '湿度',
            dataType: 'float' as DataPointType,
            direction: 'input' as 'input' | 'output',
            min: 0,
            max: 100,
            unit: '%',
          },
        ],
      },
    ],
  },
  {
    id: 'control',
    name: '控制功能',
    functions: [
      {
        id: 'fan_speed',
        name: '风扇转速',
        description: '控制风扇转速',
        icon: WindPower,
        dataPoints: [
          {
            code: 'fan_speed',
            name: '风扇转速',
            dataType: 'integer' as DataPointType,
            direction: 'output' as 'input' | 'output',
            min: 0,
            max: 5,
          },
        ],
      },
      {
        id: 'lock_status',
        name: '门锁状态',
        description: '智能门锁的开关状态',
        icon: Lock,
        dataPoints: [
          {
            code: 'lock_status',
            name: '门锁状态',
            dataType: 'boolean' as DataPointType,
            direction: 'output' as 'input' | 'output',
          },
        ],
      },
    ],
  },
]

// 计算属性
const inputCount = computed(() => dataPoints.value.filter((dp) => dp.direction === 'input').length)
const outputCount = computed(
  () => dataPoints.value.filter((dp) => dp.direction === 'output').length,
)

const productSchemaJson = computed(() => {
  const schema = {
    productId: productId.value,
    version: '1.0.0',
    dataPoints: dataPoints.value.map((dp) => ({
      id: dp.id,
      code: dp.code,
      name: dp.name,
      type: dp.dataType,
      direction: dp.direction,
      config: getDataPointConfig(dp),
    })),
  }
  return JSON.stringify(schema, null, 2)
})

const generatedCStruct = computed(() => {
  let code = `#include <stdint.h>
#include <stdbool.h>

// 产品物模型结构体
typedef struct {
    // 基本信息
    char product_id[32];
    char version[16];

    // 功能点数据
`

  dataPoints.value.forEach((dp) => {
    code += `    // ${dp.name} (${dp.code})\n`
    switch (dp.dataType) {
      case 'boolean':
        code += `    bool ${dp.code};\n`
        break
      case 'integer':
        code += `    int32_t ${dp.code}; // 范围: ${dp.min}-${dp.max}${dp.unit ? ` ${dp.unit}` : ''}\n`
        break
      case 'float':
        code += `    float ${dp.code}; // 范围: ${dp.min}-${dp.max}${dp.unit ? ` ${dp.unit}` : ''}\n`
        break
      case 'enum':
        code += `    uint8_t ${dp.code}; // 枚举值\n`
        break
      case 'string':
        code += `    char ${dp.code}[64]; // 字符串\n`
        break
    }
  })

  code += `
    // 时间戳
    uint32_t timestamp;
} product_model_t;

// 函数声明
void product_model_init(product_model_t *model, const char *product_id);
bool product_model_validate(const product_model_t *model);
int product_model_serialize(const product_model_t *model, char *buffer, size_t size);
int product_model_deserialize(product_model_t *model, const char *json_str);

#endif // PRODUCT_MODEL_H
`
  return code
})

// 方法
const getDataTypeTagType = (type: DataPointType): string => {
  const typeMap: Record<DataPointType, string> = {
    boolean: 'success',
    integer: 'primary',
    float: 'warning',
    enum: 'info',
    string: 'danger',
    binary: 'danger',
  }
  return typeMap[type] || 'info'
}

const getDataTypeText = (type: DataPointType): string => {
  const typeMap: Record<DataPointType, string> = {
    boolean: '布尔',
    integer: '整数',
    float: '浮点',
    enum: '枚举',
    string: '字符串',
    binary: '二进制',
  }
  return typeMap[type] || type
}

const getRowClassName = ({ row }: { row: DataPoint }) => {
  return row.direction === 'input' ? 'input-row' : 'output-row'
}

const getPointClass = (point: DataPoint) => {
  return point.direction === 'input' ? 'input-point' : 'output-point'
}

const getDataPointConfig = (dp: DataPoint): any => {
  switch (dp.dataType) {
    case 'boolean':
      return { default: false }
    case 'integer':
    case 'float':
      return {
        min: dp.min,
        max: dp.max,
        step: dp.step,
        unit: dp.unit,
        default: dp.min || 0,
      }
    case 'enum':
      return {
        values: dp.enumValues,
        default: dp.enumValues?.[0]?.value,
      }
    case 'string':
      return { maxLength: 64, default: '' }
    default:
      return {}
  }
}

const addCustomDataPoint = () => {
  editingIndex.value = null
  Object.assign(customForm, {
    id: '',
    code: '',
    name: '',
    dataType: 'boolean' as DataPointType,
    direction: 'output' as 'input' | 'output',
    description: '',
    min: 0,
    max: 100,
    step: 1,
    unit: '',
    enumValues: [],
  })
  showCustomDialog.value = true
}

const editDataPoint = (row: DataPoint, index: number) => {
  editingIndex.value = index
  Object.assign(customForm, { ...row })
  showCustomDialog.value = true
}

const deleteDataPoint = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个功能点吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    dataPoints.value.splice(index, 1)
    ElMessage.success('功能点已删除')
  } catch {
    // 用户取消删除
  }
}

const selectStandardFunction = (func: any) => {
  func.dataPoints.forEach((dp: DataPoint) => {
    const newDp: DataPoint = {
      ...dp,
      id: Date.now().toString() + Math.random(),
    }
    dataPoints.value.push(newDp)
  })

  ElMessage.success(`已添加 ${func.dataPoints.length} 个功能点`)
  showStandardDialog.value = false
}

const onDataTypeChange = () => {
  // 重置相关字段
  if (customForm.dataType === 'boolean') {
    // 布尔类型不需要额外配置
  } else if (customForm.dataType === 'integer' || customForm.dataType === 'float') {
    customForm.min = 0
    customForm.max = 100
    customForm.step = 1
  } else if (customForm.dataType === 'enum') {
    customForm.enumValues = [{ value: 0, description: '选项1' }]
  } else {
    customForm.enumValues = []
  }
}

const addEnumItem = () => {
  if (!customForm.enumValues) {
    customForm.enumValues = []
  }
  customForm.enumValues.push({
    value: customForm.enumValues.length,
    description: `选项${customForm.enumValues.length + 1}`,
  })
}

const removeEnumItem = (index: number) => {
  if (customForm.enumValues) {
    customForm.enumValues.splice(index, 1)
  }
}

const saveCustomDataPoint = async () => {
  if (!customFormRef.value) return

  try {
    await customFormRef.value.validate()

    const currentIndex = editingIndex.value
    const isEditing =
      currentIndex !== null && currentIndex >= 0 && currentIndex < dataPoints.value.length
    const existingDp = isEditing ? dataPoints.value[currentIndex] : null
    const dp: DataPoint = {
      ...customForm,
      id: existingDp ? existingDp.id : Date.now().toString(),
    }

    if (isEditing && existingDp && currentIndex !== null) {
      dataPoints.value[currentIndex] = dp
      ElMessage.success('功能点已更新')
    } else {
      dataPoints.value.push(dp)
      ElMessage.success('功能点已添加')
    }

    showCustomDialog.value = false
  } catch {
    ElMessage.error('表单验证失败')
  }
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(productSchemaJson.value)
    ElMessage.success('JSON 已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const downloadCode = () => {
  const blob = new Blob([generatedCStruct.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'product_model.h'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('代码文件已下载')
}

// 监听数据变化，自动保存
watch(
  () => dataPoints.value,
  () => {
    emit('save', dataPoints.value)
  },
  { deep: true },
)
</script>

<style lang="scss" scoped>
.product-function {
  height: 100%;
  padding: 24px;
  background: var(--bg-canvas);

  .function-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    height: 100%;

    .function-card,
    .preview-card {
      background: var(--bg-card);
      border: 1px solid var(--border-base);
      border-radius: 16px;
      box-shadow: var(--shadow-card);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .card-header {
        padding: 24px;
        border-bottom: 1px solid var(--border-base);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;

          .header-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            background: linear-gradient(
              135deg,
              var(--el-color-primary) 0%,
              var(--el-color-primary-light-3) 100%
            );
          }

          .header-text {
            h3 {
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: var(--text-primary);
            }

            p {
              margin: 4px 0 0 0;
              font-size: 14px;
              color: var(--text-secondary);
            }
          }
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .preview-mode {
          display: flex;
          align-items: center;
        }
      }
    }

    .function-card {
      .data-points-list {
        flex: 1;
        padding: 0;
        max-height: 400px;
        overflow-y: auto;

        .data-point-item {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-base);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;

          &:hover {
            background: var(--bg-canvas);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          }

          &.input-point {
            border-left: 4px solid var(--el-color-primary);
          }

          &.output-point {
            border-left: 4px solid var(--el-color-success);
          }

          .point-header {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;

            .point-info {
              .point-code {
                font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
              }

              .point-name {
                font-size: 14px;
                color: var(--text-secondary);
              }
            }

            .point-badges {
              display: flex;
              gap: 8px;

              .el-tag {
                font-weight: 500;
              }
            }
          }

          .point-config {
            font-size: 12px;
            color: var(--text-secondary);
            flex: 1;
            text-align: center;
          }

          .point-actions {
            display: flex;
            gap: 4px;

            .el-button {
              width: 32px;
              height: 32px;
              padding: 0;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        }

        .empty-state {
          padding: 40px;
          text-align: center;
        }
      }

      .stats-cards {
        padding: 24px;
        border-top: 1px solid var(--border-base);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .stat-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-base);
          border-radius: 12px;
          padding: 20px;
          height: 110px;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-card);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }

          .stat-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            flex: 1;
          }

          .stat-icon {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 2;
          }

          .stat-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .stat-number-box {
            display: flex;
            align-items: baseline;
            gap: 4px;
            margin-top: 8px;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1;
          }

          .stat-unit {
            font-size: 12px;
            color: var(--text-secondary);
          }

          .bg-icon {
            position: absolute;
            right: -10px;
            bottom: -15px;
            font-size: 64px;
            opacity: 0.1;
            transform: rotate(12deg);
            z-index: 1;
            transition: opacity 0.3s;
          }

          &:hover .bg-icon {
            opacity: 0.15;
          }

          /* 颜色辅助类 */
          &.text-primary {
            .stat-icon .el-icon {
              color: var(--el-color-primary);
            }
          }

          &.text-success {
            .stat-icon .el-icon {
              color: var(--el-color-success);
            }
          }

          &.text-warning {
            .stat-icon .el-icon {
              color: var(--el-color-warning);
            }
          }

          &.text-danger {
            .stat-icon .el-icon {
              color: var(--el-color-danger);
            }
          }
        }
      }
    }

    .preview-card {
      .preview-content {
        flex: 1;
        display: flex;
        flex-direction: column;

        .preview-panel {
          flex: 1;
          display: flex;
          flex-direction: column;

          .panel-header {
            padding: 16px 24px;
            background: var(--bg-canvas);
            border-bottom: 1px solid var(--border-base);
            display: flex;
            justify-content: space-between;
            align-items: center;

            .panel-title {
              font-weight: 600;
              color: var(--text-primary);
              font-size: 14px;
            }

            .el-button {
              padding: 6px;
              border-radius: 8px;
            }
          }

          .code-container {
            flex: 1;
            background: #1e1e1e;
            overflow: auto;
            border-radius: 0 0 16px 16px;

            .code-content {
              margin: 0;
              padding: 20px;
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
              font-size: 13px;
              line-height: 1.5;
              color: #d4d4d4;
              white-space: pre-wrap;
              word-break: break-all;
              min-height: 100%;

              code {
                background: transparent;
              }
            }
          }
        }
      }
    }
  }

  .standard-functions {
    max-height: 500px;
    overflow-y: auto;

    .function-category {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px 0;
        color: #303133;
        border-bottom: 1px solid #ebeef5;
        padding-bottom: 8px;
      }

      .function-items {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;

        .function-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #ebeef5;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
          }

          .function-icon {
            margin-right: 12px;
            color: #409eff;
          }

          .function-info {
            flex: 1;

            .function-name {
              font-weight: 600;
              color: #303133;
              margin-bottom: 4px;
            }

            .function-desc {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
  }

  .enum-editor {
    .enum-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
  }

  .config-detail {
    font-size: 12px;
    color: #606266;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .function-grid {
    grid-template-columns: 1fr;
    gap: 24px;

    .function-card .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .data-points-list {
      max-height: 350px;
    }
  }
}

@media (max-width: 768px) {
  .product-function {
    padding: 16px;
  }

  .function-grid .function-card .card-header,
  .function-grid .preview-card .card-header {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .header-content {
      width: 100%;
    }

    .header-actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
  }

  .function-card .data-points-list {
    max-height: 300px;

    .data-point-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;

      .point-header {
        width: 100%;
        justify-content: space-between;
      }

      .point-config {
        text-align: left;
        width: 100%;
      }

      .point-actions {
        width: 100%;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  }

  .function-card .stats-cards {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 12px;

    .stat-card {
      height: 100px;
      padding: 16px;

      .stat-value {
        font-size: 28px;
      }
    }
  }

  .preview-card .preview-content .preview-panel .panel-header {
    padding: 12px 16px;

    .panel-title {
      font-size: 13px;
    }
  }
}
</style>
