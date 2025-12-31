<template>
  <div class="studio-layout">
    <!-- 顶部导航区 -->
    <div class="studio-header">
      <div class="header-glass">
        <!-- 左侧：返回 + 产品信息 -->
        <div class="header-left">
          <el-button link icon="ArrowLeft" @click="goBackToList" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <div class="product-info">
            <div class="product-name">{{ currentProduct?.name || '未命名产品' }}</div>
            <div class="product-meta">
              <span class="product-id">PID: {{ currentProduct?.id || 'N/A' }}</span>
              <el-tag
                :type="getStatusType(currentProduct?.status)"
                size="small"
                class="status-badge"
              >
                {{ getStatusText(currentProduct?.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 中央：五步进度条 -->
        <div class="header-center">
          <div class="progress-container">
            <div class="step-indicators">
              <div
                v-for="(step, index) in studioSteps"
                :key="step.id"
                class="step-item"
                :class="{ active: index + 1 <= currentStep, current: index + 1 === currentStep }"
              >
                <div class="step-icon">
                  <el-icon :size="20"><component :is="getStepIcon(step.icon)" /></el-icon>
                </div>
                <div class="step-info">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-desc">{{ step.description }}</div>
                </div>
                <div v-if="index < studioSteps.length - 1" class="step-connector">
                  <div class="connector-line" :class="{ completed: index + 1 < currentStep }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：辅助操作 -->
        <div class="header-right">
          <el-button link icon="Document" @click="openHelpDoc" circle>
            <el-icon><Document /></el-icon>
          </el-button>
          <el-button link icon="Setting" @click="openSettings" circle>
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="studio-content">
      <router-view />
    </div>

    <!-- 底部全局操作栏 -->
    <div class="studio-footer">
      <div class="footer-glass">
        <!-- 主操作区 -->
        <div class="footer-main">
          <!-- 左侧：保存按钮 -->
          <div class="footer-left">
            <el-button
              v-if="showSaveButton"
              type="default"
              :loading="saving"
              @click="handleSave"
              class="save-btn"
            >
              <el-icon><Check /></el-icon>
              <span class="btn-text">保存草稿</span>
            </el-button>
          </div>

          <!-- 中央：主要操作 -->
          <div class="footer-center">
            <el-button
              v-if="!isLastStep"
              type="primary"
              size="large"
              :loading="nextLoading"
              @click="handleNext"
              class="primary-btn"
            >
              <span class="btn-text">下一步</span>
              <span class="step-name">{{ nextStepName }}</span>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </el-button>
            <el-button
              v-else
              type="success"
              size="large"
              :loading="publishLoading"
              @click="handlePublish"
              class="primary-btn"
            >
              <el-icon><Upload /></el-icon>
              <span class="btn-text">发布产品</span>
            </el-button>
          </div>

          <!-- 右侧：辅助操作 -->
          <div class="footer-right">
            <!-- 调试终端按钮 -->
            <el-tooltip content="调试终端" placement="top">
              <el-button
                circle
                :type="isTerminalOpen ? 'primary' : 'default'"
                @click="toggleTerminal"
                class="terminal-btn"
                :class="{ active: isTerminalOpen }"
              >
                <el-icon><component :is="isTerminalOpen ? Close : Monitor" /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 调试终端面板 -->
    <StudioTerminal v-if="isTerminalOpen" v-model="isTerminalOpen" :product-id="productId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Document,
  Setting,
  Monitor,
  Close,
  Check,
  Upload,
  DocumentAdd,
  Picture,
  Cpu,
  Tools,
} from '@element-plus/icons-vue'
import StudioTerminal from '@/components/studio/StudioTerminal.vue'
import type { ProductListItem } from '@/types/product'

// 步骤定义
const studioSteps = [
  {
    id: 1,
    title: '功能定义',
    description: '定义产品功能点',
    icon: 'DocumentAdd',
  },
  {
    id: 2,
    title: '面板设计',
    description: '设计控制面板',
    icon: 'Picture',
  },
  {
    id: 3,
    title: '硬件开发',
    description: '选择模组与固件',
    icon: 'Cpu',
  },
  {
    id: 4,
    title: '产品配置',
    description: '配置产品参数',
    icon: 'Setting',
  },
  {
    id: 5,
    title: '测试发布',
    description: '测试并发布产品',
    icon: 'Check',
  },
]

// Props
interface Props {
  productId?: string
}

const props = withDefaults(defineProps<Props>(), {
  productId: '',
})

// Emits
const emit = defineEmits<{
  stepChange: [step: number]
  save: []
  next: []
  publish: []
}>()

// 响应式数据
const route = useRoute()
const router = useRouter()
const currentStep = ref(1)
const currentProduct = ref<ProductListItem | null>(null)
const isTerminalOpen = ref(false)
const saving = ref(false)
const nextLoading = ref(false)
const publishLoading = ref(false)

// 计算属性
const productId = computed(() => props.productId || (route.params.pid as string))
const isLastStep = computed(() => currentStep.value === studioSteps.length)
const nextStepName = computed(() => {
  if (isLastStep.value) return '发布'
  return studioSteps[currentStep.value]?.title || ''
})
const showSaveButton = computed(() => currentStep.value !== studioSteps.length)

// 方法
const goBackToList = () => {
  router.push({ name: 'ProductManagement' })
}

const getStatusType = (status?: string) => {
  const statusMap: Record<string, string> = {
    draft: 'warning',
    developing: 'info',
    testing: 'primary',
    published: 'success',
  }
  return statusMap[status || ''] || 'info'
}

const getStatusText = (status?: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    developing: '开发中',
    testing: '测试中',
    published: '已发布',
  }
  return statusMap[status || ''] || '未知'
}

const getStepIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    DocumentAdd: DocumentAdd,
    Picture: Picture,
    Cpu: Cpu,
    Setting: Setting,
    Check: Check,
  }
  return iconMap[iconName] || DocumentAdd
}

const onStepChange = (step: number) => {
  // 这里可以添加步骤切换的验证逻辑
  currentStep.value = step
  emit('stepChange', step)
}

const openHelpDoc = () => {
  // 打开帮助文档
  ElMessage.info('帮助文档功能开发中...')
}

const openSettings = () => {
  // 打开设置
  ElMessage.info('设置功能开发中...')
}

const toggleTerminal = () => {
  isTerminalOpen.value = !isTerminalOpen.value
}

const handleSave = async () => {
  saving.value = true
  try {
    await emit('save')
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleNext = async () => {
  nextLoading.value = true
  try {
    await emit('next')
    if (currentStep.value < studioSteps.length) {
      currentStep.value++
      // 跳转到对应步骤的路由
      const stepRoute = getStepRoute(currentStep.value)
      if (stepRoute) {
        router.push(stepRoute)
      }
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    nextLoading.value = false
  }
}

const handlePublish = async () => {
  try {
    await ElMessageBox.confirm('确定要发布这个产品吗？发布后功能点将无法修改。', '发布确认', {
      confirmButtonText: '确定发布',
      cancelButtonText: '取消',
      type: 'warning',
    })

    publishLoading.value = true
    await emit('publish')
    ElMessage.success('产品发布成功！')
    goBackToList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布失败')
    }
  } finally {
    publishLoading.value = false
  }
}

const getStepRoute = (step: number) => {
  const routeMap: Record<number, string> = {
    1: 'ProductFunction',
    2: 'ProductPanel',
    3: 'ProductHardware',
    4: 'ProductConfig',
    5: 'ProductTest',
  }
  const routeName = routeMap[step]
  return routeName ? { name: routeName, params: { pid: productId.value } } : null
}

// 监听路由变化，更新当前步骤
watch(
  () => route.name,
  (newName) => {
    const routeStepMap: Record<string, number> = {
      ProductFunction: 1,
      ProductPanel: 2,
      ProductHardware: 3,
      ProductConfig: 4,
      ProductTest: 5,
    }
    const step = routeStepMap[newName as string] || 1
    currentStep.value = step
  },
  { immediate: true },
)

// 初始化
onMounted(async () => {
  // 加载产品信息
  if (productId.value) {
    try {
      // 这里应该调用API获取产品信息
      // currentProduct.value = await fetchProduct(productId.value)
    } catch (error) {
      ElMessage.error('加载产品信息失败')
    }
  }
})
</script>

<style lang="scss" scoped>
.studio-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-canvas);

  .studio-header {
    background: white;
    border-bottom: 1px solid var(--border-base);
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
          color: var(--el-color-primary);
          transform: translateX(-2px);
        }
      }

      .product-info {
        .product-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .product-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .product-id {
            font-size: 12px;
            color: var(--text-secondary);
            font-family: 'SF Mono', monospace;
          }

          .status-badge {
            font-weight: 500;
          }
        }
      }
    }

    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
      padding: 0 40px;
      max-width: 900px;

      .step-indicators {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        width: 100%;

        .step-item {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;

          .step-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--bg-canvas);
            border: 2px solid var(--border-base);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            transition: all 0.3s ease;
          }

          .step-info {
            text-align: center;
            min-width: 80px;

            .step-title {
              font-size: 13px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 2px;
            }

            .step-desc {
              font-size: 11px;
              color: var(--text-secondary);
            }
          }

          &.active .step-icon {
            background: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary);
            color: var(--el-color-primary);
          }

          &.current .step-icon {
            background: var(--el-color-primary);
            border-color: var(--el-color-primary);
            color: white;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
          }

          .step-connector {
            position: absolute;
            left: 48px;
            top: 24px;
            width: calc(100% - 48px);
            height: 2px;
            z-index: 1;

            .connector-line {
              width: 100%;
              height: 100%;
              background: var(--border-base);
              transition: all 0.3s ease;

              &.completed {
                background: var(--el-color-primary);
              }
            }
          }
        }
      }
    }

    .header-right {
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .el-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bg-canvas);
        border: 1px solid var(--border-base);
        color: var(--text-secondary);
        transition: all 0.2s ease;

        &:hover {
          background: var(--bg-card);
          color: var(--el-color-primary);
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  .studio-content {
    flex: 1;
    height: calc(100vh - 120px - 80px);
    overflow: hidden;
    background: var(--bg-canvas);
  }

  .studio-footer {
    height: 80px;
    background: white;
    border-top: 1px solid var(--border-base);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);

    .footer-main {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .footer-left {
        .save-btn {
          border: 1px solid var(--border-base);
          background: white;
          color: var(--text-secondary);
          border-radius: 8px;
          padding: 8px 16px;
          transition: all 0.2s ease;

          &:hover {
            background: var(--bg-canvas);
            border-color: var(--el-color-primary);
            color: var(--el-color-primary);
          }

          .btn-text {
            margin-left: 6px;
          }
        }
      }

      .footer-center {
        .primary-btn {
          min-width: 200px;
          height: 48px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .btn-text {
            font-size: 16px;
          }

          .step-name {
            font-size: 14px;
            opacity: 0.9;
            margin-left: 4px;
          }

          .arrow-icon {
            margin-left: 8px;
          }
        }
      }

      .footer-right {
        .terminal-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid var(--border-base);
          background: white;
          transition: all 0.2s ease;

          &:hover {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
            transform: scale(1.05);
          }

          &.active {
            background: var(--el-color-primary);
            border-color: var(--el-color-primary);
            color: white;
            box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.2);
          }
        }
      }
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(67, 217, 173, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(67, 217, 173, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(67, 217, 173, 0);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .studio-layout {
    .studio-header {
      padding: 20px 24px;

      .header-left {
        flex: 0 0 280px;
      }

      .header-center {
        padding: 0 20px;
      }

      .header-right {
        flex: 0 0 100px;
      }
    }

    .studio-footer {
      padding: 0 24px;

      .footer-right {
        .next-btn,
        .publish-btn {
          min-width: 140px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .studio-layout {
    .studio-header {
      padding: 16px;
      flex-direction: column;
      gap: 16px;

      .header-left {
        width: 100%;
        justify-content: center;

        .product-info {
          text-align: center;

          .product-name {
            font-size: 18px;
          }
        }
      }

      .header-center {
        width: 100%;
        padding: 0;

        .step-indicators {
          flex-wrap: wrap;
          gap: 12px;

          .step-item {
            flex: 1;
            min-width: 80px;

            .step-info {
              display: none;
            }

            .step-connector {
              display: none;
            }
          }
        }
      }

      .header-right {
        width: 100%;
        justify-content: center;
      }
    }

    .studio-footer {
      height: 100px;

      .footer-main {
        flex-direction: column;
        gap: 16px;
        padding: 16px;

        .footer-left,
        .footer-center,
        .footer-right {
          width: 100%;
          justify-content: center;
        }

        .footer-center {
          order: 1;
        }

        .footer-left {
          order: 2;
        }

        .footer-right {
          order: 3;
        }

        .primary-btn {
          width: 100%;
          max-width: 280px;
        }
      }
    }
  }
}
</style>
