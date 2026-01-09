<template>
  <div class="product-test">
    <div class="test-designer">
      <!-- 左侧：测试面板 -->
      <div class="test-sidebar">
        <div class="sidebar-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24">
                <DocumentChecked />
              </el-icon>
            </div>
            <div class="header-text">
              <h3>测试管理</h3>
              <p>自动化测试和发布检查</p>
            </div>
          </div>
        </div>

        <div class="test-categories">
          <div v-for="category in testCategories" :key="category.id" class="category-item"
            :class="{ active: activeTestCategory === category.id }" @click="activeTestCategory = category.id">
            <div class="category-icon">
              <el-icon :size="20">
                <component :is="category.icon" />
              </el-icon>
            </div>
            <div class="category-info">
              <div class="category-name">{{ category.name }}</div>
              <div class="category-status">
                <el-tag :type="getTestStatusType(category.status)" size="small">
                  {{ getTestStatusText(category.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 测试进度 -->
        <div class="test-progress">
          <div class="progress-header">
            <span class="progress-title">测试进度</span>
            <span class="progress-value">{{ overallProgress }}%</span>
          </div>
          <el-progress :percentage="overallProgress" :status="overallProgress === 100 ? 'success' : 'warning'"
            :stroke-width="8" />
        </div>
      </div>

      <!-- 右侧：测试内容 -->
      <div class="test-content">
        <div class="content-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon :size="24">
                <component :is="activeTestCategoryData?.icon || DocumentChecked" />
              </el-icon>
            </div>
            <div class="header-text">
              <h3>{{ activeTestCategoryData?.name || '测试内容' }}</h3>
              <p>{{ activeTestCategoryData?.description || '执行测试和检查' }}</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button v-if="activeTestCategory !== 'publish'" type="primary" @click="runTests" :loading="runningTests">
              <el-icon>
                <VideoPlay />
              </el-icon>
              {{ runningTests ? '测试中...' : '运行测试' }}
            </el-button>
            <el-button v-if="activeTestCategory === 'publish'" type="success" @click="publishProduct"
              :loading="publishing" :disabled="!canPublish">
              <el-icon>
                <Upload />
              </el-icon>
              发布产品
            </el-button>
          </div>
        </div>

        <div class="test-panel" v-loading="loading">
          <!-- 功能测试 -->
          <template v-if="activeTestCategory === 'function'">
            <div class="test-section">
              <h4>功能点测试</h4>
              <div class="function-tests">
                <div v-for="test in functionTests" :key="test.id" class="test-item">
                  <div class="test-header">
                    <div class="test-info">
                      <div class="test-name">{{ test.name }}</div>
                      <div class="test-desc">{{ test.description }}</div>
                    </div>
                    <div class="test-result">
                      <el-tag :type="getResultType(test.result)" size="small">
                        {{ getResultText(test.result) }}
                      </el-tag>
                      <el-button v-if="test.result === 'failed'" type="primary" size="small" @click="retryTest(test)">
                        重试
                      </el-button>
                    </div>
                  </div>
                  <div v-if="test.details" class="test-details">
                    <pre>{{ test.details }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 硬件测试 -->
          <template v-if="activeTestCategory === 'hardware'">
            <div class="test-section">
              <h4>硬件兼容性测试</h4>
              <div class="hardware-tests">
                <div class="test-grid">
                  <div class="test-card">
                    <div class="card-icon">
                      <el-icon size="32">
                        <Cpu />
                      </el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-title">模组连接测试</div>
                      <div class="card-desc">测试模组通信连接</div>
                    </div>
                    <el-tag type="success" size="small">通过</el-tag>
                  </div>

                  <div class="test-card">
                    <div class="card-icon">
                      <el-icon size="32">
                        <Lightning />
                      </el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-title">电源稳定性测试</div>
                      <div class="card-desc">测试电源电压稳定性</div>
                    </div>
                    <el-tag type="success" size="small">通过</el-tag>
                  </div>

                  <div class="test-card">
                    <div class="card-icon">
                      <el-icon size="32">
                        <WindPower />
                      </el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-title">引脚功能测试</div>
                      <div class="card-desc">测试所有引脚功能</div>
                    </div>
                    <el-tag type="warning" size="small">部分通过</el-tag>
                  </div>

                  <div class="test-card">
                    <div class="card-icon">
                      <el-icon size="32">
                        <Monitor />
                      </el-icon>
                    </div>
                    <div class="card-info">
                      <div class="card-title">固件烧录测试</div>
                      <div class="card-desc">测试固件烧录功能</div>
                    </div>
                    <el-tag type="success" size="small">通过</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 性能测试 -->
          <template v-if="activeTestCategory === 'performance'">
            <div class="test-section">
              <h4>性能测试结果</h4>
              <div class="performance-metrics">
                <div class="metric-grid">
                  <div class="metric-card">
                    <div class="metric-value">{{ performanceData.cpuUsage }}%</div>
                    <div class="metric-label">CPU使用率</div>
                    <el-progress :percentage="performanceData.cpuUsage"
                      :status="performanceData.cpuUsage > 80 ? 'warning' : 'success'" />
                  </div>

                  <div class="metric-card">
                    <div class="metric-value">{{ performanceData.memoryUsage }}%</div>
                    <div class="metric-label">内存使用率</div>
                    <el-progress :percentage="performanceData.memoryUsage"
                      :status="performanceData.memoryUsage > 80 ? 'warning' : 'success'" />
                  </div>

                  <div class="metric-card">
                    <div class="metric-value">{{ performanceData.powerConsumption }}</div>
                    <div class="metric-label">功耗 (mA)</div>
                    <div class="metric-status">
                      <el-tag :type="performanceData.powerConsumption < 100 ? 'success' : 'warning'" size="small">
                        {{ performanceData.powerConsumption < 100 ? '优秀' : '一般' }} </el-tag>
                    </div>
                  </div>

                  <div class="metric-card">
                    <div class="metric-value">{{ performanceData.responseTime }}</div>
                    <div class="metric-label">响应时间 (ms)</div>
                    <div class="metric-status">
                      <el-tag :type="performanceData.responseTime < 200 ? 'success' : 'warning'" size="small">
                        {{ performanceData.responseTime < 200 ? '良好' : '需优化' }} </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 安全测试 -->
          <template v-if="activeTestCategory === 'security'">
            <div class="test-section">
              <h4>安全测试检查</h4>
              <div class="security-checks">
                <div v-for="check in securityChecks" :key="check.id" class="check-item">
                  <div class="check-header">
                    <div class="check-icon">
                      <el-icon :size="20" :class="check.passed ? 'success' : 'warning'">
                        <component :is="check.passed ? Check : Warning" />
                      </el-icon>
                    </div>
                    <div class="check-info">
                      <div class="check-name">{{ check.name }}</div>
                      <div class="check-desc">{{ check.description }}</div>
                    </div>
                    <el-tag :type="check.passed ? 'success' : 'warning'" size="small">
                      {{ check.passed ? '通过' : '失败' }}
                    </el-tag>
                  </div>
                  <div v-if="!check.passed && check.recommendation" class="check-recommendation">
                    <strong>建议：</strong>{{ check.recommendation }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 发布检查 -->
          <template v-if="activeTestCategory === 'publish'">
            <div class="publish-checklist">
              <div class="checklist-header">
                <h4>发布前检查清单</h4>
                <div class="checklist-summary">
                  <span class="summary-text">{{ completedChecks }} / {{ totalChecks }} 项已完成</span>
                  <el-progress :percentage="(completedChecks / totalChecks) * 100" :stroke-width="8" />
                </div>
              </div>

              <div class="checklist-items">
                <div v-for="item in publishChecklist" :key="item.id" class="checklist-item"
                  :class="{ completed: item.completed }">
                  <div class="item-header">
                    <el-checkbox v-model="item.completed" @change="updateChecklistStatus" />
                    <div class="item-info">
                      <div class="item-title">{{ item.title }}</div>
                      <div class="item-desc">{{ item.description }}</div>
                    </div>
                    <div class="item-actions">
                      <el-tag :type="item.completed ? 'success' : 'info'" size="small">
                        {{ item.category }}
                      </el-tag>
                    </div>
                  </div>
                  <div v-if="item.details" class="item-details">
                    {{ item.details }}
                  </div>
                </div>
              </div>

              <div class="publish-summary">
                <div class="summary-card">
                  <div class="summary-title">发布就绪状态</div>
                  <div class="summary-status">
                    <el-icon :size="24" :class="canPublish ? 'success' : 'warning'">
                      <component :is="canPublish ? Check : Warning" />
                    </el-icon>
                    <span class="status-text">{{ canPublish ? '可以发布' : '检查未完成' }}</span>
                  </div>
                  <div v-if="canPublish" class="publish-info">
                    <div class="info-item">
                      <span class="info-label">预计发布时间:</span>
                      <span class="info-value">{{ publishTime }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">发布版本:</span>
                      <span class="info-value">v1.0.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DocumentChecked,
  VideoPlay,
  Upload,
  Check,
  Warning,
  Cpu,
  Lightning,
  WindPower,
  Monitor,
  TrendCharts,
  Lock,
  List,
} from '@element-plus/icons-vue'

// Emits
const emit = defineEmits<{
  publish: []
}>()

// 响应式数据
const activeTestCategory = ref('function')
const loading = ref(false)
const runningTests = ref(false)

// 测试分类
const testCategories = [
  {
    id: 'function',
    name: '功能测试',
    description: '测试产品功能点',
    icon: DocumentChecked,
    status: 'passed'
  },
  {
    id: 'hardware',
    name: '硬件测试',
    description: '测试硬件兼容性',
    icon: Cpu,
    status: 'warning'
  },
  {
    id: 'performance',
    name: '性能测试',
    description: '测试性能指标',
    icon: TrendCharts,
    status: 'passed'
  },
  {
    id: 'security',
    name: '安全测试',
    description: '检查安全配置',
    icon: Lock,
    status: 'passed'
  },
  {
    id: 'publish',
    name: '发布检查',
    description: '发布前最终检查',
    icon: List,
    status: 'pending'
  }
]

// 功能测试数据
const functionTests = ref([
  {
    id: 'switch_test',
    name: '开关功能测试',
    description: '测试LED开关的开/关功能',
    result: 'passed',
    details: '开关功能正常，响应时间 < 100ms'
  },
  {
    id: 'brightness_test',
    name: '亮度调节测试',
    description: '测试亮度从0-100%的调节功能',
    result: 'passed',
    details: '亮度调节线性度良好，精度 ±2%'
  },
  {
    id: 'sensor_test',
    name: '传感器读取测试',
    description: '测试温度和湿度传感器的读取功能',
    result: 'warning',
    details: '湿度传感器精度需要校准，误差 ±5%'
  }
])

// 性能测试数据
const performanceData = reactive({
  cpuUsage: 45,
  memoryUsage: 62,
  powerConsumption: 85,
  responseTime: 150
})

// 安全检查数据
const securityChecks = ref([
  {
    id: 'auth_check',
    name: '设备认证检查',
    description: '检查设备认证机制是否正确配置',
    passed: true
  },
  {
    id: 'encryption_check',
    name: '数据加密检查',
    description: '检查数据传输和存储加密',
    passed: true
  },
  {
    id: 'firmware_check',
    name: '固件安全检查',
    description: '检查固件签名和完整性验证',
    passed: false,
    recommendation: '建议启用固件签名验证功能'
  },
  {
    id: 'access_check',
    name: '访问控制检查',
    description: '检查设备访问权限控制',
    passed: true
  }
])

// 发布检查清单
const publishChecklist = ref([
  {
    id: 'function_complete',
    title: '功能定义完成',
    description: '所有功能点已正确定义和配置',
    category: '功能',
    completed: true,
    details: '已定义3个功能点：开关、亮度调节、传感器'
  },
  {
    id: 'panel_complete',
    title: '面板设计完成',
    description: '控制面板已设计并配置完成',
    category: '界面',
    completed: true,
    details: '已创建手机端控制面板，包含所有控制组件'
  },
  {
    id: 'hardware_complete',
    title: '硬件配置完成',
    description: '硬件模组和固件已正确配置',
    category: '硬件',
    completed: true,
    details: '已选择ESP32模组并配置相应固件'
  },
  {
    id: 'config_complete',
    title: '产品配置完成',
    description: '多语言、告警、安全等配置已完成',
    category: '配置',
    completed: false,
    details: '还需要完成安全配置的最后检查'
  },
  {
    id: 'test_passed',
    title: '测试通过',
    description: '所有测试项目均已通过',
    category: '测试',
    completed: false,
    details: '安全测试中还有1项未通过'
  },
  {
    id: 'doc_complete',
    title: '文档完善',
    description: '产品文档已编写完成',
    category: '文档',
    completed: false,
    details: 'API文档和用户手册需要补充'
  }
])

// 计算属性
const activeTestCategoryData = computed(() => {
  return testCategories.find(cat => cat.id === activeTestCategory.value)
})

const overallProgress = computed(() => {
  const passedCount = testCategories.filter(cat => cat.status === 'passed').length
  return Math.round((passedCount / testCategories.length) * 100)
})

const totalChecks = computed(() => publishChecklist.value.length)
const completedChecks = computed(() => publishChecklist.value.filter(item => item.completed).length)
const canPublish = computed(() => completedChecks.value === totalChecks.value)
const publishing = ref(false)

const publishTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30) // 假设30分钟后发布
  return now.toLocaleString()
})

// 方法
const getTestStatusType = (status: string) => {
  const map: Record<string, string> = {
    passed: 'success',
    warning: 'warning',
    failed: 'danger',
    pending: 'info'
  }
  return map[status] || 'info'
}

const getTestStatusText = (status: string) => {
  const map: Record<string, string> = {
    passed: '通过',
    warning: '部分通过',
    failed: '失败',
    pending: '未测试'
  }
  return map[status] || status
}

const getResultType = (result: string) => {
  const map: Record<string, string> = {
    passed: 'success',
    warning: 'warning',
    failed: 'danger'
  }
  return map[result] || 'info'
}

const getResultText = (result: string) => {
  const map: Record<string, string> = {
    passed: '通过',
    warning: '警告',
    failed: '失败'
  }
  return map[result] || result
}

const runTests = async () => {
  runningTests.value = true

  try {
    // 模拟测试过程
    for (let i = 0; i < functionTests.value.length; i++) {
      const test = functionTests.value[i]
      ElMessage.info(`正在测试: ${test.name}`)

      // 模拟测试时间
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 随机更新测试结果（演示用）
      if (Math.random() > 0.7) {
        test.result = 'passed'
      }
    }

    // 更新测试状态
    const failedCount = functionTests.value.filter(t => t.result === 'failed').length
    const warningCount = functionTests.value.filter(t => t.result === 'warning').length

    if (failedCount === 0 && warningCount === 0) {
      testCategories.find(cat => cat.id === activeTestCategory.value)!.status = 'passed'
    } else if (failedCount === 0) {
      testCategories.find(cat => cat.id === activeTestCategory.value)!.status = 'warning'
    } else {
      testCategories.find(cat => cat.id === activeTestCategory.value)!.status = 'failed'
    }

    ElMessage.success('测试完成')
  } catch (error) {
    ElMessage.error('测试失败')
  } finally {
    runningTests.value = false
  }
}

const retryTest = async (test?: any) => {
  ElMessage.info(`重试测试: ${test.name}`)

  // 模拟重试
  setTimeout(() => {
    if (test) {
      test.result = Math.random() > 0.5 ? 'passed' : 'warning'
      ElMessage.success(`${test.name} 重试完成`)
    }
  }, 1000)
}

const updateChecklistStatus = () => {
  // 检查清单状态更新后自动检查
  const configItem = publishChecklist.value.find(item => item.id === 'config_complete')
  const testItem = publishChecklist.value.find(item => item.id === 'test_passed')

  if (configItem) {
    // 简化检查逻辑，实际应该检查配置完成情况
    configItem.completed = Math.random() > 0.5
  }

  if (testItem) {
    // 检查测试状态
    const allTestsPassed = testCategories.every(cat => cat.status === 'passed')
    testItem.completed = allTestsPassed
  }
}

const publishProduct = async () => {
  if (!canPublish.value) {
    ElMessage.warning('请先完成所有发布检查项')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要发布这个产品吗？发布后功能点将无法修改。',
      '发布确认',
      {
        confirmButtonText: '确定发布',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    publishing.value = true
    ElMessage.info('正在发布产品...')

    // 模拟发布过程
    await new Promise(resolve => setTimeout(resolve, 3000))

    emit('publish')
    ElMessage.success('产品发布成功！')

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布失败')
    }
  } finally {
    publishing.value = false
  }
}

// 初始化
onMounted(() => {
  // 初始化检查状态
  updateChecklistStatus()
})
</script>

<style lang="scss" scoped>
.product-test {
  height: 100%;
  padding: 24px;
  background: var(--bg-canvas);

  .test-designer {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    height: 100%;

    .test-sidebar,
    .test-content {
      background: var(--bg-card);
      border: 1px solid var(--border-base);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-card);
    }

    .test-sidebar {
      .test-categories {
        flex: 1;
        padding: 0;

        .category-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-base);
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: var(--bg-canvas);
            transform: translateY(-2px);
          }

          &.active {
            border-left: 4px solid var(--el-color-primary);
            background: rgba(var(--el-color-primary-rgb), 0.05);
          }

          .category-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
          }

          .category-info {
            flex: 1;

            .category-name {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 4px;
            }

            .category-status {
              display: flex;
            }
          }
        }
      }

      .test-progress {
        padding: 20px;
        border-top: 1px solid var(--border-base);

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .progress-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .progress-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--el-color-primary);
          }
        }
      }
    }

    .test-content {
      .content-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-base);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;

          .header-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
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
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }
      }

      .test-panel {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .test-section {
          padding: 20px;
          border-bottom: 1px solid var(--border-base);

          &:last-child {
            border-bottom: none;
          }

          h4 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }
        }

        .function-tests {
          .test-item {
            border: 1px solid var(--border-base);
            border-radius: 8px;
            margin-bottom: 12px;
            overflow: hidden;

            .test-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 16px;

              .test-info {
                .test-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                  margin-bottom: 4px;
                }

                .test-desc {
                  font-size: 12px;
                  color: var(--text-secondary);
                }
              }

              .test-result {
                display: flex;
                align-items: center;
                gap: 8px;
              }
            }

            .test-details {
              padding: 0 16px 16px;
              background: var(--bg-canvas);

              pre {
                margin: 0;
                font-size: 12px;
                color: var(--text-secondary);
                white-space: pre-wrap;
              }
            }
          }
        }

        .hardware-tests {
          .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;

            .test-card {
              display: flex;
              align-items: center;
              padding: 16px;
              border: 1px solid var(--border-base);
              border-radius: 8px;
              background: var(--bg-canvas);

              .card-icon {
                margin-right: 12px;
                color: var(--el-color-primary);
              }

              .card-info {
                flex: 1;

                .card-title {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                  margin-bottom: 4px;
                }

                .card-desc {
                  font-size: 12px;
                  color: var(--text-secondary);
                }
              }
            }
          }
        }

        .performance-metrics {
          .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;

            .metric-card {
              text-align: center;
              padding: 20px;
              border: 1px solid var(--border-base);
              border-radius: 8px;
              background: var(--bg-canvas);

              .metric-value {
                font-size: 24px;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
              }

              .metric-label {
                font-size: 12px;
                color: var(--text-secondary);
                margin-bottom: 12px;
              }

              .metric-status {
                margin-top: 12px;
              }
            }
          }
        }

        .security-checks {
          .check-item {
            border: 1px solid var(--border-base);
            border-radius: 8px;
            margin-bottom: 12px;
            overflow: hidden;

            .check-header {
              display: flex;
              align-items: center;
              padding: 16px;

              .check-icon {
                margin-right: 12px;

                &.success {
                  color: var(--el-color-success);
                }

                &.warning {
                  color: var(--el-color-warning);
                }
              }

              .check-info {
                flex: 1;

                .check-name {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                  margin-bottom: 4px;
                }

                .check-desc {
                  font-size: 12px;
                  color: var(--text-secondary);
                }
              }
            }

            .check-recommendation {
              padding: 0 16px 16px;
              background: rgba(var(--el-color-warning-rgb), 0.05);
              border-top: 1px solid rgba(var(--el-color-warning-rgb), 0.2);
              font-size: 12px;
              color: var(--text-secondary);
            }
          }
        }

        .publish-checklist {
          .checklist-header {
            margin-bottom: 20px;

            h4 {
              margin: 0 0 12px 0;
              font-size: 16px;
              font-weight: 600;
              color: var(--text-primary);
            }

            .checklist-summary {
              display: flex;
              align-items: center;
              gap: 12px;

              .summary-text {
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
          }

          .checklist-items {
            .checklist-item {
              border: 1px solid var(--border-base);
              border-radius: 8px;
              margin-bottom: 12px;
              transition: all 0.3s ease;

              &.completed {
                border-color: var(--el-color-success);
                background: rgba(var(--el-color-success-rgb), 0.05);
              }

              .item-header {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;

                .item-info {
                  flex: 1;

                  .item-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                  }

                  .item-desc {
                    font-size: 12px;
                    color: var(--text-secondary);
                  }
                }

                .item-actions {
                  flex-shrink: 0;
                }
              }

              .item-details {
                padding: 0 16px 16px;
                font-size: 12px;
                color: var(--text-secondary);
                background: var(--bg-canvas);
                border-top: 1px solid var(--border-base);
              }
            }
          }

          .publish-summary {
            margin-top: 24px;

            .summary-card {
              padding: 20px;
              border: 1px solid var(--border-base);
              border-radius: 8px;
              background: var(--bg-canvas);
              text-align: center;

              .summary-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 16px;
              }

              .summary-status {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 16px;

                .success {
                  color: var(--el-color-success);
                }

                .warning {
                  color: var(--el-color-warning);
                }

                .status-text {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                }
              }

              .publish-info {
                .info-item {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 8px;
                  font-size: 12px;

                  .info-label {
                    color: var(--text-secondary);
                  }

                  .info-value {
                    color: var(--text-primary);
                    font-weight: 500;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .test-designer {
    grid-template-columns: 1fr;

    .test-sidebar {
      order: 2;
    }

    .test-content {
      order: 1;
    }
  }
}

@media (max-width: 768px) {
  .product-test {
    padding: 16px;
  }

  .test-designer {
    gap: 16px;

    .sidebar-header,
    .content-header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }
    }

    .test-sidebar {
      .test-categories {
        .category-item {
          flex-direction: column;
          text-align: center;
          gap: 8px;

          .category-icon {
            margin-right: 0;
            margin-bottom: 8px;
          }
        }
      }

      .test-progress {
        padding: 16px;
      }
    }

    .test-content {
      .test-panel {
        .test-section {
          padding: 16px;
        }

        .hardware-tests .test-grid {
          grid-template-columns: 1fr;
        }

        .performance-metrics .metric-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .publish-checklist {
          .checklist-items .checklist-item .item-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      }
    }
  }
}
</style>
