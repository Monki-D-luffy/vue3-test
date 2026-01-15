<template>
  <div class="debug-container">
    <el-card class="debug-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <h2>📡 后端数据调试台</h2>
            <el-tag :type="token ? 'success' : 'danger'" effect="dark" class="ml-2">
              {{ token ? 'Token 已就绪' : 'Token 缺失' }}
            </el-tag>
          </div>
          <el-button @click="$router.back()">返回概览</el-button>
        </div>
      </template>

      <!-- 环境诊断面板 -->
      <el-alert
        v-if="!token"
        title="鉴权警告"
        type="error"
        description="检测到当前未登录或 Token 丢失，后端请求大概率会失败 (401 Unauthorized)。请先去登录页获取 Token。"
        show-icon
        class="mb-4"
      />

      <el-descriptions title="🔎 环境诊断" border :column="2" class="mb-4">
        <el-descriptions-item label="Mock 模式">
          <el-switch
            v-model="isMock"
            active-text="开启 (Mock)"
            inactive-text="关闭 (真实后端)"
            @change="toggleMock"
          />
          <span class="tip-text ml-2">(切换需刷新页面)</span>
        </el-descriptions-item>
        <el-descriptions-item label="API Base URL">
          <code>{{ currentBaseURL }}</code>
        </el-descriptions-item>
        <el-descriptions-item label="Token 签名">
          <code v-if="token">{{ token.substring(0, 15) }}...</code>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="User ID">
          {{ authStore.userInfo?.userId || '未登录' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="test-sections">
        <div class="section">
          <h3>☁️ 身份服务 (Identity Proxy)</h3>
          <p class="desc">
            测试路径: <code>/api/identity/...</code> (前端) ->
            <code>https://iotserver...</code> (云端)
          </p>
          <div class="custom-request">
            <el-input v-model="identityUserName" placeholder="userName" class="url-input" />
            <el-input
              v-model="identityPassword"
              placeholder="password"
              show-password
              class="url-input"
            />
            <el-input v-model="identityProductName" placeholder="productName" class="url-input" />
          </div>
          <div class="actions">
            <el-button type="primary" @click="testIdentity" :loading="loading.identity">
              登录测试 (获取 Token)
            </el-button>
          </div>
          <el-input
            v-if="result.identity"
            type="textarea"
            :rows="5"
            v-model="result.identity"
            readonly
            class="result-box"
          />
        </div>

        <el-divider />

        <div class="section">
          <h3>🏢 业务服务 (Business Proxy)</h3>
          <p class="desc">
            测试路径: <code>/api/...</code> (前端) ->
            <code>{{
              isMock ? 'http://localhost:3000' : 'https://iotserver.dabbsson.cn/manager-api/'
            }}</code>
          </p>
          <div class="actions">
            <el-button type="success" @click="testBusiness" :loading="loading.business">
              获取设备列表 (测试业务接口)
            </el-button>
          </div>
          <el-input
            v-if="result.business"
            type="textarea"
            :rows="5"
            v-model="result.business"
            readonly
            class="result-box"
          />
        </div>

        <el-divider />

        <div class="section">
          <h3>🛠️ 万能请求器</h3>
          <div class="custom-request">
            <el-select v-model="customMethod" style="width: 100px">
              <el-option label="POST" value="POST" />
              <el-option label="GET" value="GET" />
            </el-select>
            <el-input
              v-model="customUrl"
              placeholder="输入接口地址，例如 /Devices/GetDevices (无需 /api 前缀)"
              class="url-input"
            />
            <el-button type="warning" @click="testCustom" :loading="loading.custom"
              >发送请求</el-button
            >
          </div>
          <el-input
            v-model="customBody"
            type="textarea"
            :rows="3"
            placeholder="请求体 JSON (仅 POST 需要)"
            class="mt-2"
          />
          <el-input
            v-if="result.custom"
            type="textarea"
            :rows="8"
            v-model="result.custom"
            readonly
            class="result-box mt-2"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import request from '@/api/core/request'
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const token = computed(() => authStore.token)

const STORAGE_KEY_MOCK = 'USE_MOCK_DATA'
const isMock = ref(localStorage.getItem(STORAGE_KEY_MOCK) === 'true')

// 获取当前环境的 BaseURL
const currentBaseURL = computed(() => {
  return isMock.value
    ? import.meta.env.VITE_API_URL_MOCK || 'http://localhost:3000'
    : import.meta.env.VITE_API_URL_REAL || '/api'
})

const loading = reactive({
  identity: false,
  business: false,
  custom: false,
})

const result = reactive({
  identity: '',
  business: '',
  custom: '',
})

const customMethod = ref('POST')
// ✅ 修正：默认路径去掉 /api，防止双重前缀
const customUrl = ref('/Devices/GetDevices')
const customBody = ref('{\n  "pageIndex": 1,\n  "pageSize": 10\n}')

const identityUserName = ref('DabbssonIoT')
const identityPassword = ref('123456')
const identityProductName = ref('ManagerIdentity')

// 切换 Mock 模式
const toggleMock = (val: boolean | string | number) => {
  localStorage.setItem(STORAGE_KEY_MOCK, String(val))
  ElMessage.info('Mock 模式已切换，即将刷新页面生效...')
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

// 1. 测试身份服务
const testIdentity = async () => {
  loading.identity = true
  result.identity = 'Requesting...'
  try {
    const res = await request.post('/identity/api/Login/LoginByPwd', {
      userName: identityUserName.value,
      password: identityPassword.value,
      productName: identityProductName.value,
    })
    result.identity = JSON.stringify(res, null, 2)
    ElMessage.success('身份服务连接成功！')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    result.identity = `Error: ${message}\n\nHint: Check Network tab for details.`
  } finally {
    loading.identity = false
  }
}

// 2. 测试业务服务
const testBusiness = async () => {
  loading.business = true
  result.business = 'Requesting...'
  try {
    // ✅ 修正：移除开头的 /api
    // 组合后变成 /api/Devices/GetDevices
    // 触发 Vite 代理转发到本地 Mock
    const res = await request.post('/Devices/GetDevices', {
      pageIndex: 1,
      pageSize: 5,
    })
    result.business = JSON.stringify(res, null, 2)
    ElMessage.success('业务服务连接成功！')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    result.business = `Error: ${message}`
  } finally {
    loading.business = false
  }
}

// 3. 自定义测试
const testCustom = async () => {
  loading.custom = true
  result.custom = 'Requesting...'
  try {
    // 这里的 customUrl.value 输入时也不要带 /api
    let res
    if (customMethod.value === 'GET') {
      res = await request.get(customUrl.value)
    } else {
      let body = {}
      try {
        body = JSON.parse(customBody.value || '{}')
      } catch {
        ElMessage.error('JSON 格式错误')
        loading.custom = false
        return
      }
      res = await request.post(customUrl.value, body)
    }
    result.custom = JSON.stringify(res, null, 2)
    ElMessage.success('请求发送成功')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    result.custom = `Error: ${message}`
  } finally {
    loading.custom = false
  }
}
</script>

<style scoped>
.debug-container {
  padding: 24px;
  background-color: var(--app-bg-canvas);
  min-height: 100vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h2 {
  margin: 0;
  font-size: 18px;
}

.tip-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.desc {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.actions {
  margin-bottom: 16px;
}

.result-box {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
}

.custom-request {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.url-input {
  flex: 1;
}

.ml-2 {
  margin-left: 8px;
}
</style>
