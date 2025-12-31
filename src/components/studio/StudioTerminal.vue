<template>
  <el-drawer
    v-model="visible"
    title="调试终端"
    size="60%"
    direction="btt"
    :before-close="handleClose"
    class="studio-terminal"
  >
    <!-- Tab导航 -->
    <el-tabs v-model="activeTab" class="terminal-tabs" @tab-click="onTabClick">
      <!-- Tab 1: 串口日志 -->
      <el-tab-pane label="串口日志" name="serial" lazy>
        <div class="terminal-content">
          <div class="terminal-header">
            <div class="connection-status">
              <el-tag :type="serialConnected ? 'success' : 'danger'" size="small">
                {{ serialConnected ? '已连接' : '未连接' }}
              </el-tag>
            </div>
            <div class="terminal-actions">
              <el-select
                v-model="selectedPort"
                placeholder="选择串口"
                size="small"
                style="width: 150px"
                @change="connectSerial"
              >
                <el-option v-for="port in availablePorts" :key="port" :label="port" :value="port" />
              </el-select>
              <el-button
                :type="serialConnected ? 'danger' : 'primary'"
                size="small"
                @click="toggleSerialConnection"
              >
                {{ serialConnected ? '断开' : '连接' }}
              </el-button>
              <el-button type="info" size="small" @click="clearSerialLog"> 清空 </el-button>
            </div>
          </div>
          <div class="terminal-log" ref="serialLogRef">
            <div
              v-for="(log, index) in serialLogs"
              :key="index"
              class="log-line"
              :class="getLogClass(log.type)"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
          </div>
          <div class="terminal-input">
            <el-input
              v-model="serialCommand"
              placeholder="输入命令..."
              size="small"
              @keyup.enter="sendSerialCommand"
            >
              <template #suffix>
                <el-button
                  type="primary"
                  size="small"
                  @click="sendSerialCommand"
                  :disabled="!serialConnected"
                >
                  发送
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 虚拟设备日志 -->
      <el-tab-pane label="虚拟设备日志" name="virtual" lazy>
        <div class="terminal-content">
          <div class="terminal-header">
            <div class="connection-status">
              <el-tag type="success" size="small">运行中</el-tag>
            </div>
            <div class="terminal-actions">
              <el-button type="warning" size="small" @click="simulateDeviceAction">
                模拟设备交互
              </el-button>
              <el-button type="info" size="small" @click="clearVirtualLog"> 清空 </el-button>
            </div>
          </div>
          <div class="terminal-log" ref="virtualLogRef">
            <div
              v-for="(log, index) in virtualLogs"
              :key="index"
              class="log-line"
              :class="getLogClass(log.type)"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-type">{{ log.type.toUpperCase() }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
          </div>
          <div class="virtual-preview">
            <div class="preview-title">当前设备状态：</div>
            <pre class="json-viewer">{{ JSON.stringify(currentDeviceState, null, 2) }}</pre>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 3: AI Copilot -->
      <el-tab-pane label="AI 助手" name="ai" lazy>
        <div class="terminal-content">
          <div class="ai-chat-container">
            <!-- 聊天记录 -->
            <div class="chat-messages" ref="chatMessagesRef">
              <div
                v-for="(message, index) in aiMessages"
                :key="index"
                class="message-item"
                :class="{
                  'user-message': message.role === 'user',
                  'ai-message': message.role === 'assistant',
                }"
              >
                <div class="message-avatar">
                  <el-avatar :size="32" :src="message.role === 'user' ? userAvatar : aiAvatar">
                    {{ message.role === 'user' ? '我' : 'AI' }}
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
            </div>

            <!-- 输入框 -->
            <div class="chat-input">
              <el-input
                v-model="aiQuestion"
                placeholder="询问关于产品开发的任何问题..."
                :disabled="aiThinking"
                @keyup.enter="askAI"
              >
                <template #suffix>
                  <el-button type="primary" :loading="aiThinking" @click="askAI"> 发送 </el-button>
                </template>
              </el-input>
            </div>

            <!-- 快捷问题 -->
            <div class="quick-questions">
              <div class="quick-title">快捷问题：</div>
              <div class="quick-buttons">
                <el-button
                  v-for="question in quickQuestions"
                  :key="question"
                  link
                  size="small"
                  @click="askQuickQuestion(question)"
                >
                  {{ question }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
// import ElJsonViewer from 'vue-json-viewer'

// Props
interface Props {
  modelValue: boolean
  productId?: string
}

const props = withDefaults(defineProps<Props>(), {
  productId: '',
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 响应式数据
const visible = ref(false)
const activeTab = ref('serial')

// 串口相关
const serialConnected = ref(false)
const selectedPort = ref('')
const availablePorts = ref<string[]>(['COM1', 'COM2', 'COM3', '/dev/ttyUSB0', '/dev/ttyUSB1'])
const serialLogs = ref<
  Array<{ timestamp: number; type: 'info' | 'error' | 'warn'; content: string }>
>([])
const serialCommand = ref('')
const serialLogRef = ref<HTMLElement>()

// 虚拟设备相关
const virtualLogs = ref<
  Array<{ timestamp: number; type: 'info' | 'error' | 'warn'; content: string }>
>([])
const currentDeviceState = ref<any>({})
const virtualLogRef = ref<HTMLElement>()

// AI 相关
const aiMessages = ref<Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>>(
  [],
)
const aiQuestion = ref('')
const aiThinking = ref(false)
const chatMessagesRef = ref<HTMLElement>()
const userAvatar = ref('')
const aiAvatar = ref('')

const quickQuestions = [
  '如何优化配网速度？',
  'ESP32的功耗优化建议',
  '如何设计更好的用户界面？',
  '固件OTA升级的最佳实践',
  '设备安全加固方案',
]

// 监听visible变化
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
  },
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 模拟设备状态
const initDeviceState = () => {
  currentDeviceState.value = {
    productId: props.productId,
    status: 'online',
    properties: {
      power: false,
      brightness: 50,
      temperature: 25,
      humidity: 60,
    },
    timestamp: Date.now(),
  }
}

// 串口相关方法
const toggleSerialConnection = async () => {
  if (serialConnected.value) {
    disconnectSerial()
  } else {
    await connectSerial()
  }
}

const connectSerial = async () => {
  if (!selectedPort.value) {
    ElMessage.warning('请先选择串口')
    return
  }

  try {
    // 这里应该调用实际的串口连接API
    serialConnected.value = true
    addSerialLog('info', `连接到串口: ${selectedPort.value}`)
    ElMessage.success('串口连接成功')
  } catch (error) {
    addSerialLog('error', `串口连接失败: ${error}`)
    ElMessage.error('串口连接失败')
  }
}

const disconnectSerial = () => {
  serialConnected.value = false
  addSerialLog('info', '串口连接已断开')
  ElMessage.info('串口已断开')
}

const sendSerialCommand = () => {
  if (!serialCommand.value.trim()) return
  if (!serialConnected.value) {
    ElMessage.warning('请先连接串口')
    return
  }

  addSerialLog('info', `> ${serialCommand.value}`)
  // 这里应该发送实际的串口命令
  serialCommand.value = ''
}

const clearSerialLog = () => {
  serialLogs.value = []
}

const addSerialLog = (type: 'info' | 'error' | 'warn', content: string) => {
  serialLogs.value.push({
    timestamp: Date.now(),
    type,
    content,
  })

  nextTick(() => {
    if (serialLogRef.value) {
      serialLogRef.value.scrollTop = serialLogRef.value.scrollHeight
    }
  })
}

// 虚拟设备相关方法
const simulateDeviceAction = () => {
  const actions = ['power', 'brightness', 'temperature', 'humidity']
  const action = actions[Math.floor(Math.random() * actions.length)]
  const value = action === 'power' ? Math.random() > 0.5 : Math.floor(Math.random() * 100)

  // 更新设备状态
  if (action === 'power') {
    currentDeviceState.value.properties.power = value
  } else if (action) {
    currentDeviceState.value.properties[action] = value
  }

  addVirtualLog('info', `设备属性更新: ${action} = ${value}`)
}

const clearVirtualLog = () => {
  virtualLogs.value = []
}

const addVirtualLog = (type: 'info' | 'error' | 'warn', content: string) => {
  virtualLogs.value.push({
    timestamp: Date.now(),
    type,
    content,
  })

  nextTick(() => {
    if (virtualLogRef.value) {
      virtualLogRef.value.scrollTop = virtualLogRef.value.scrollHeight
    }
  })
}

// AI 相关方法
const askAI = async () => {
  if (!aiQuestion.value.trim()) return

  const question = aiQuestion.value.trim()
  aiQuestion.value = ''

  // 添加用户消息
  addAIMessage('user', question)

  aiThinking.value = true
  try {
    // 这里应该调用实际的AI API
    await new Promise((resolve) => setTimeout(resolve, 2000)) // 模拟API调用

    const aiResponse = generateAIResponse(question)
    addAIMessage('assistant', aiResponse)
  } catch (error) {
    addAIMessage('assistant', '抱歉，我现在无法回答您的问题，请稍后再试。')
  } finally {
    aiThinking.value = false
  }
}

const askQuickQuestion = (question: string) => {
  aiQuestion.value = question
  askAI()
}

const addAIMessage = (role: 'user' | 'assistant', content: string) => {
  aiMessages.value.push({
    role,
    content,
    timestamp: Date.now(),
  })

  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const generateAIResponse = (question: string): string => {
  // 简单的模拟AI回复
  const responses = [
    '根据您的产品配置，建议使用ESP32模组，因为它具有更好的WiFi性能。',
    '在配网方面，可以考虑添加超时重试机制来提升成功率。',
    '对于功耗优化，建议在空闲时进入深度睡眠模式。',
    'UI设计方面，建议使用更大的触摸区域来提升用户体验。',
    'OTA升级时需要确保固件的完整性校验，防止升级失败。',
  ]
  return responses[Math.floor(Math.random() * responses.length)] || 'AI助手正在思考中...'
}

// 工具方法
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const getLogClass = (type: string): string => {
  return `log-${type}`
}

const onTabClick = (tab: any) => {
  // 切换Tab时的处理逻辑
}

const handleClose = () => {
  visible.value = false
}

// 初始化
onMounted(() => {
  initDeviceState()

  // 模拟一些初始日志
  addSerialLog('info', '调试终端已启动')
  addVirtualLog('info', '虚拟设备初始化完成')
  addAIMessage('assistant', '您好！我是您的产品开发AI助手，有什么问题都可以问我。')
})
</script>

<style lang="scss" scoped>
.studio-terminal {
  :deep(.el-drawer__body) {
    padding: 0;
    height: 100%;
  }

  .terminal-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;

    :deep(.el-tabs__header) {
      margin: 0;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;

      .el-tabs__nav {
        padding: 0 20px;
      }
    }

    :deep(.el-tabs__content) {
      flex: 1;
      height: calc(100% - 55px);
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  .terminal-content {
    height: 100%;
    display: flex;
    flex-direction: column;

    .terminal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;

      .connection-status {
        display: flex;
        align-items: center;
      }

      .terminal-actions {
        display: flex;
        gap: 8px;
      }
    }

    .terminal-log {
      flex: 1;
      padding: 12px 20px;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
      overflow-y: auto;

      .log-line {
        display: flex;
        margin-bottom: 2px;

        .log-time {
          color: #6c757d;
          margin-right: 8px;
          font-size: 11px;
          min-width: 80px;
        }

        .log-type {
          margin-right: 8px;
          padding: 0 4px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: bold;
          min-width: 40px;
          text-align: center;
        }

        .log-content {
          flex: 1;
          word-break: break-all;
        }

        &.log-info {
          .log-type {
            background: #007bff;
            color: white;
          }
        }

        &.log-error {
          .log-type {
            background: #dc3545;
            color: white;
          }
        }

        &.log-warn {
          .log-type {
            background: #ffc107;
            color: black;
          }
        }
      }
    }

    .terminal-input {
      padding: 12px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }
  }

  // AI 聊天样式
  .ai-chat-container {
    height: 100%;
    display: flex;
    flex-direction: column;

    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #fafafa;

      .message-item {
        display: flex;
        margin-bottom: 16px;
        max-width: 80%;

        &.user-message {
          margin-left: auto;
          flex-direction: row-reverse;

          .message-content {
            margin-left: 0;
            margin-right: 12px;
          }
        }

        &.ai-message {
          .message-content {
            margin-left: 12px;
          }
        }

        .message-avatar {
          flex-shrink: 0;
        }

        .message-content {
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

          .message-text {
            margin-bottom: 4px;
            line-height: 1.5;
          }

          .message-time {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }

    .chat-input {
      padding: 20px;
      background: white;
      border-top: 1px solid #e9ecef;
    }

    .quick-questions {
      padding: 0 20px 20px;
      background: white;

      .quick-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      .quick-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }

  .virtual-preview {
    padding: 12px 20px;
    background: white;
    border-top: 1px solid #e9ecef;

    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .json-viewer {
      max-height: 200px;
      overflow-y: auto;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .studio-terminal {
    :deep(.el-drawer) {
      width: 100% !important;
    }

    .terminal-header {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;

      .terminal-actions {
        justify-content: center;
      }
    }

    .chat-messages .message-item {
      max-width: 90%;
    }
  }
}
</style>
