<template>
  <div class="product-hardware">
    <div class="hardware-designer">
      <!-- 左侧：模组选择 -->
      <div class="module-selection">
        <div class="selection-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><Cpu /></el-icon>
            </div>
            <div class="header-text">
              <h3>模组选型</h3>
              <p>选择合适的硬件模组</p>
            </div>
          </div>
          <div class="selection-filter">
            <el-radio-group v-model="moduleCategory" size="small">
              <el-radio-button value="wifi">WiFi模组</el-radio-button>
              <el-radio-button value="zigbee">Zigbee模组</el-radio-button>
              <el-radio-button value="bluetooth">蓝牙模组</el-radio-button>
              <el-radio-button value="lora">LoRa模组</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="module-list">
          <div
            v-for="module in filteredModules"
            :key="module.id"
            class="module-card"
            :class="{ selected: selectedModule?.id === module.id }"
            @click="selectModule(module)"
          >
            <div class="module-header">
              <div class="module-icon">
                <el-icon :size="32"><component :is="module.icon || Cpu" /></el-icon>
              </div>
              <div class="module-info">
                <div class="module-name">{{ module.name }}</div>
                <div class="module-manufacturer">{{ module.manufacturer }}</div>
              </div>
              <el-tag :type="getCompatibilityTag(module.compatibility)" size="small">
                {{ module.compatibility === 'excellent' ? '完美兼容' : module.compatibility === 'good' ? '良好兼容' : '一般兼容' }}
              </el-tag>
            </div>

            <div class="module-specs">
              <div class="spec-item">
                <span class="spec-label">协议:</span>
                <span class="spec-value">{{ module.protocol }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">频率:</span>
                <span class="spec-value">{{ module.frequency }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">功耗:</span>
                <span class="spec-value">{{ module.power }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">价格:</span>
                <span class="spec-value">¥{{ module.price }}</span>
              </div>
            </div>

            <div class="module-features">
              <el-tag
                v-for="feature in module.features.slice(0, 3)"
                :key="feature"
                size="small"
                type="info"
              >
                {{ feature }}
              </el-tag>
              <el-tag v-if="module.features.length > 3" size="small" type="info">
                +{{ module.features.length - 3 }}
              </el-tag>
            </div>

            <div class="module-description">
              {{ module.description }}
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：配置面板 -->
      <div class="config-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><Setting /></el-icon>
            </div>
            <div class="header-text">
              <h3>硬件配置</h3>
              <p>配置选中的硬件模组</p>
            </div>
          </div>
        </div>

        <div class="config-content" v-loading="configLoading">
          <template v-if="selectedModule">
            <!-- 模组概览 -->
            <div class="config-section">
              <h4>模组概览</h4>
              <div class="module-overview">
                <div class="overview-item">
                  <div class="overview-label">选中模组</div>
                  <div class="overview-value">{{ selectedModule.name }}</div>
                </div>
                <div class="overview-item">
                  <div class="overview-label">制造商</div>
                  <div class="overview-value">{{ selectedModule.manufacturer }}</div>
                </div>
                <div class="overview-item">
                  <div class="overview-label">协议类型</div>
                  <div class="overview-value">{{ selectedModule.protocol }}</div>
                </div>
                <div class="overview-item">
                  <div class="overview-label">参考价格</div>
                  <div class="overview-value">¥{{ selectedModule.price }}</div>
                </div>
              </div>
            </div>

            <!-- 引脚配置 -->
            <div class="config-section">
              <h4>引脚配置</h4>
              <div class="pin-config">
                <div class="pin-mapping">
                  <div
                    v-for="pin in selectedModule.pins"
                    :key="pin.number"
                    class="pin-item"
                    :class="{ assigned: pin.assigned, available: !pin.assigned }"
                  >
                    <div class="pin-number">P{{ pin.number }}</div>
                    <div class="pin-function">
                      <el-select
                        v-model="pin.function"
                        placeholder="选择功能"
                        size="small"
                        @change="updatePinConfig(pin)"
                      >
                        <el-option
                          v-for="func in availableFunctions"
                          :key="func.value"
                          :label="func.label"
                          :value="func.value"
                        />
                      </el-select>
                    </div>
                    <div class="pin-description">{{ pin.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 电源配置 -->
            <div class="config-section">
              <h4>电源配置</h4>
              <el-form label-width="120px" size="small">
                <el-form-item label="工作电压">
                  <el-select v-model="hardwareConfig.power.voltage">
                    <el-option label="3.3V" value="3.3" />
                    <el-option label="5V" value="5.0" />
                    <el-option label="12V" value="12.0" />
                  </el-select>
                </el-form-item>
                <el-form-item label="最大电流">
                  <el-input-number
                    v-model="hardwareConfig.power.maxCurrent"
                    :min="0.1"
                    :max="5.0"
                    :step="0.1"
                    suffix="A"
                  />
                </el-form-item>
                <el-form-item label="功耗模式">
                <el-radio-group v-model="hardwareConfig.power.mode">
                  <el-radio value="normal">正常模式</el-radio>
                  <el-radio value="low-power">低功耗模式</el-radio>
                  <el-radio value="deep-sleep">深度睡眠</el-radio>
                </el-radio-group>
                </el-form-item>
              </el-form>
            </div>

            <!-- 固件配置 -->
            <div class="config-section">
              <h4>固件配置</h4>
              <div class="firmware-config">
                <div class="firmware-selector">
                  <div class="selector-header">
                    <span class="selector-title">选择固件版本</span>
                    <el-button type="primary" size="small" @click="createCustomFirmware">
                      创建自定义固件
                    </el-button>
                  </div>

                  <div class="firmware-list">
                    <div
                      v-for="firmware in compatibleFirmwares"
                      :key="firmware.id"
                      class="firmware-item"
                      :class="{ selected: selectedFirmware?.id === firmware.id }"
                      @click="selectFirmware(firmware)"
                    >
                      <div class="firmware-info">
                        <div class="firmware-name">{{ firmware.name }}</div>
                        <div class="firmware-version">v{{ firmware.version }}</div>
                        <div class="firmware-desc">{{ firmware.description }}</div>
                      </div>
                      <div class="firmware-meta">
                        <el-tag size="small" type="success">{{ firmware.size }}</el-tag>
                        <div class="firmware-date">{{ firmware.updateDate }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedFirmware" class="firmware-details">
                  <h5>固件详情</h5>
                  <div class="detail-item">
                    <span class="detail-label">版本:</span>
                    <span class="detail-value">v{{ selectedFirmware.version }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">大小:</span>
                    <span class="detail-value">{{ selectedFirmware.size }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">更新日期:</span>
                    <span class="detail-value">{{ selectedFirmware.updateDate }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">支持功能:</span>
                    <div class="feature-tags">
                      <el-tag
                        v-for="feature in selectedFirmware.features"
                        :key="feature"
                        size="small"
                        type="info"
                      >
                        {{ feature }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 兼容性检查 -->
            <div class="config-section">
              <h4>兼容性检查</h4>
              <div class="compatibility-check">
                <div class="check-result">
                  <div class="result-item">
                    <el-icon class="result-icon success"><Check /></el-icon>
                    <span>硬件兼容性: {{ getCompatibilityText(selectedModule.compatibility) }}</span>
                  </div>
                  <div class="result-item">
                    <el-icon class="result-icon success"><Check /></el-icon>
                    <span>功能点匹配: {{ functionPoints.length }} 个功能点已匹配</span>
                  </div>
                  <div class="result-item" :class="{ warning: pinConflicts.length > 0 }">
                    <el-icon :class="['result-icon', pinConflicts.length > 0 ? 'warning' : 'success']">
                      <component :is="pinConflicts.length > 0 ? Warning : Check" />
                    </el-icon>
                    <span>引脚冲突: {{ pinConflicts.length === 0 ? '无冲突' : `${pinConflicts.length} 个冲突` }}</span>
                  </div>
                </div>

                <div v-if="pinConflicts.length > 0" class="conflict-details">
                  <h5>引脚冲突详情</h5>
                  <div
                    v-for="conflict in pinConflicts"
                    :key="conflict.pin"
                    class="conflict-item"
                  >
                    <span class="conflict-pin">P{{ conflict.pin }}</span>
                    <span class="conflict-desc">{{ conflict.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="no-selection">
              <el-empty description="请先选择一个硬件模组">
                <template #image>
                  <el-icon size="64" style="color: #c0c4cc;"><Cpu /></el-icon>
                </template>
              </el-empty>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧：预览面板 -->
      <div class="preview-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="header-icon">
              <el-icon size="24"><View /></el-icon>
            </div>
            <div class="header-text">
              <h3>硬件预览</h3>
              <p>查看硬件配置预览</p>
            </div>
          </div>
        </div>

        <div class="preview-content">
          <template v-if="selectedModule">
            <!-- 模组预览 -->
            <div class="module-preview">
              <div class="preview-image">
                <el-image :src="selectedModule.image" fit="contain" />
              </div>
              <div class="preview-info">
                <h4>{{ selectedModule.name }}</h4>
                <p>{{ selectedModule.description }}</p>
              </div>
            </div>

            <!-- 引脚图 -->
            <div class="pin-diagram">
              <h4>引脚图</h4>
              <div class="pin-grid">
                <div
                  v-for="pin in selectedModule.pins"
                  :key="pin.number"
                  class="pin-diagram-item"
                  :class="{ assigned: pin.assigned }"
                >
                  <div class="pin-number">{{ pin.number }}</div>
                  <div class="pin-function">{{ pin.function || '未分配' }}</div>
                </div>
              </div>
            </div>

            <!-- 配置摘要 -->
            <div class="config-summary">
              <h4>配置摘要</h4>
              <div class="summary-item">
                <span class="summary-label">模组型号:</span>
                <span class="summary-value">{{ selectedModule.name }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">固件版本:</span>
                <span class="summary-value">{{ selectedFirmware?.name || '未选择' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">工作电压:</span>
                <span class="summary-value">{{ hardwareConfig.power.voltage }}V</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">最大电流:</span>
                <span class="summary-value">{{ hardwareConfig.power.maxCurrent }}A</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">功耗模式:</span>
                <span class="summary-value">{{ hardwareConfig.power.mode === 'normal' ? '正常模式' : hardwareConfig.power.mode === 'low-power' ? '低功耗模式' : '深度睡眠' }}</span>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="no-preview">
              <el-empty description="选择模组后查看预览" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Cpu,
  Setting,
  View,
  Check,
  Warning,
  Connection,
} from '@element-plus/icons-vue'

// 导入功能点数据（模拟从上一步获取）
const functionPoints = ref([
  { id: '1', code: 'switch_led', name: 'LED开关', type: 'boolean' },
  { id: '2', code: 'brightness', name: '亮度', type: 'integer' },
  { id: '3', code: 'temperature', name: '温度', type: 'float' },
])

// Emits
const emit = defineEmits<{
  next: []
  save: [data: any]
}>()

// 响应式数据
const moduleCategory = ref<'wifi' | 'zigbee' | 'bluetooth' | 'lora'>('wifi')
const selectedModule = ref<any>(null)
const selectedFirmware = ref<any>(null)
const configLoading = ref(false)

// 硬件配置
const hardwareConfig = reactive({
  power: {
    voltage: '3.3',
    maxCurrent: 0.5,
    mode: 'normal' as 'normal' | 'low-power' | 'deep-sleep'
  },
  pins: [] as any[]
})

// 可用功能列表
const availableFunctions = [
  { label: '未使用', value: '' },
  { label: '数字输出', value: 'digital_out' },
  { label: '数字输入', value: 'digital_in' },
  { label: '模拟输入', value: 'analog_in' },
  { label: 'PWM输出', value: 'pwm_out' },
  { label: 'I2C_SDA', value: 'i2c_sda' },
  { label: 'I2C_SCL', value: 'i2c_scl' },
  { label: 'SPI_MOSI', value: 'spi_mosi' },
  { label: 'SPI_MISO', value: 'spi_miso' },
  { label: 'SPI_SCK', value: 'spi_sck' },
  { label: 'UART_TX', value: 'uart_tx' },
  { label: 'UART_RX', value: 'uart_rx' },
]

// 模组数据
const modulesData = [
  {
    id: 'esp32-wroom-32',
    name: 'ESP32-WROOM-32',
    manufacturer: 'Espressif',
    protocol: 'WiFi + Bluetooth',
    category: 'wifi',
    compatibility: 'excellent',
    frequency: '2.4GHz/5GHz',
    power: '低功耗',
    price: 25,
    features: ['WiFi', 'Bluetooth', '大内存', '多核CPU', '丰富外设'],
    description: '集成WiFi和蓝牙的双核MCU，适用于物联网应用',
    image: '/images/modules/esp32.jpg',
    icon: Connection,
    pins: [
      { number: 1, description: '3.3V Power', assigned: false, function: '' },
      { number: 2, description: 'GND', assigned: false, function: '' },
      { number: 3, description: 'GPIO 0', assigned: false, function: 'digital_out' },
      { number: 4, description: 'GPIO 2', assigned: false, function: 'digital_out' },
      { number: 5, description: 'GPIO 4', assigned: false, function: 'analog_in' },
      { number: 12, description: 'GPIO 12', assigned: false, function: '' },
      { number: 13, description: 'GPIO 13', assigned: false, function: '' },
      { number: 14, description: 'GPIO 14', assigned: false, function: 'pwm_out' },
      { number: 15, description: 'GPIO 15', assigned: false, function: '' },
      { number: 16, description: 'GPIO 16 (RX2)', assigned: false, function: 'uart_rx' },
      { number: 17, description: 'GPIO 17 (TX2)', assigned: false, function: 'uart_tx' },
      { number: 18, description: 'GPIO 18', assigned: false, function: '' },
      { number: 19, description: 'GPIO 19', assigned: false, function: '' },
      { number: 21, description: 'GPIO 21 (SDA)', assigned: false, function: 'i2c_sda' },
      { number: 22, description: 'GPIO 22 (SCL)', assigned: false, function: 'i2c_scl' },
      { number: 23, description: 'GPIO 23', assigned: false, function: '' },
      { number: 25, description: 'GPIO 25', assigned: false, function: 'analog_in' },
      { number: 26, description: 'GPIO 26', assigned: false, function: 'analog_in' },
      { number: 27, description: 'GPIO 27', assigned: false, function: '' },
      { number: 32, description: 'GPIO 32', assigned: false, function: 'analog_in' },
      { number: 33, description: 'GPIO 33', assigned: false, function: 'analog_in' },
      { number: 34, description: 'GPIO 34', assigned: false, function: 'digital_in' },
      { number: 35, description: 'GPIO 35', assigned: false, function: 'digital_in' },
      { number: 36, description: 'GPIO 36', assigned: false, function: 'digital_in' },
      { number: 39, description: 'GPIO 39', assigned: false, function: 'digital_in' },
    ]
  },
  {
    id: 'esp8266-12f',
    name: 'ESP8266-12F',
    manufacturer: 'Espressif',
    protocol: 'WiFi',
    category: 'wifi',
    compatibility: 'good',
    frequency: '2.4GHz',
    power: '超低功耗',
    price: 8,
    features: ['WiFi', '低成本', '小尺寸', '丰富GPIO'],
    description: '低成本WiFi模组，适用于简单物联网应用',
    image: '/images/modules/esp8266.jpg',
    icon: Connection,
    pins: [
      { number: 1, description: '3.3V', assigned: false, function: '' },
      { number: 2, description: 'GND', assigned: false, function: '' },
      { number: 3, description: 'GPIO 0', assigned: false, function: 'digital_out' },
      { number: 4, description: 'GPIO 2', assigned: false, function: 'digital_out' },
      { number: 5, description: 'GPIO 4', assigned: false, function: '' },
      { number: 6, description: 'GPIO 5', assigned: false, function: '' },
      { number: 12, description: 'GPIO 12', assigned: false, function: 'pwm_out' },
      { number: 13, description: 'GPIO 13', assigned: false, function: 'pwm_out' },
      { number: 14, description: 'GPIO 14', assigned: false, function: 'pwm_out' },
      { number: 15, description: 'GPIO 15', assigned: false, function: '' },
      { number: 16, description: 'GPIO 16', assigned: false, function: 'digital_in' },
    ]
  },
  {
    id: 'cc2530',
    name: 'CC2530',
    manufacturer: 'Texas Instruments',
    protocol: 'Zigbee',
    category: 'zigbee',
    compatibility: 'excellent',
    frequency: '2.4GHz',
    power: '低功耗',
    price: 15,
    features: ['Zigbee', '低功耗', '网状网络', '大内存'],
    description: '专业Zigbee模组，支持网状网络和低功耗应用',
    image: '/images/modules/cc2530.jpg',
    icon: Connection,
    pins: [
      { number: 1, description: 'DVDD', assigned: false, function: '' },
      { number: 2, description: 'GND', assigned: false, function: '' },
      { number: 3, description: 'P0.0', assigned: false, function: 'digital_out' },
      { number: 4, description: 'P0.1', assigned: false, function: 'digital_in' },
      { number: 5, description: 'P0.2', assigned: false, function: 'analog_in' },
      { number: 6, description: 'P0.3', assigned: false, function: 'pwm_out' },
      { number: 7, description: 'P0.4', assigned: false, function: '' },
      { number: 8, description: 'P0.5', assigned: false, function: '' },
      { number: 9, description: 'P0.6', assigned: false, function: '' },
      { number: 10, description: 'P0.7', assigned: false, function: '' },
    ]
  },
  {
    id: 'nrf52832',
    name: 'nRF52832',
    manufacturer: 'Nordic Semiconductor',
    protocol: 'Bluetooth LE',
    category: 'bluetooth',
    compatibility: 'excellent',
    frequency: '2.4GHz',
    power: '超低功耗',
    price: 20,
    features: ['Bluetooth LE', '超低功耗', '高性能', '丰富外设'],
    description: '高性能蓝牙低功耗模组，适用于可穿戴设备和传感器网络',
    image: '/images/modules/nrf52832.jpg',
    icon: Connection,
    pins: [
      { number: 1, description: 'VDD', assigned: false, function: '' },
      { number: 2, description: 'GND', assigned: false, function: '' },
      { number: 3, description: 'P0.00', assigned: false, function: 'digital_out' },
      { number: 4, description: 'P0.01', assigned: false, function: 'digital_in' },
      { number: 5, description: 'P0.02', assigned: false, function: 'analog_in' },
      { number: 6, description: 'P0.03', assigned: false, function: 'pwm_out' },
      { number: 7, description: 'P0.04', assigned: false, function: 'uart_tx' },
      { number: 8, description: 'P0.05', assigned: false, function: 'uart_rx' },
      { number: 9, description: 'P0.06', assigned: false, function: 'i2c_sda' },
      { number: 10, description: 'P0.07', assigned: false, function: 'i2c_scl' },
    ]
  }
]

// 固件数据
const firmwaresData = [
  {
    id: 'esp32-basic-v1.0',
    name: 'ESP32基础固件',
    version: '1.0.0',
    moduleId: 'esp32-wroom-32',
    size: '512KB',
    updateDate: '2024-01-15',
    description: '基础物联网固件，支持WiFi连接和基本功能',
    features: ['WiFi连接', 'MQTT客户端', 'OTA升级', '基础安全'],
  },
  {
    id: 'esp32-advanced-v1.2',
    name: 'ESP32高级固件',
    version: '1.2.0',
    moduleId: 'esp32-wroom-32',
    size: '768KB',
    updateDate: '2024-01-20',
    description: '高级物联网固件，支持更多功能和优化',
    features: ['WiFi连接', 'MQTT客户端', 'OTA升级', 'TLS安全', '本地存储', '高级算法'],
  },
  {
    id: 'esp8266-basic-v2.1',
    name: 'ESP8266基础固件',
    version: '2.1.0',
    moduleId: 'esp8266-12f',
    size: '256KB',
    updateDate: '2024-01-10',
    description: '轻量级物联网固件，适用于资源受限设备',
    features: ['WiFi连接', 'MQTT客户端', 'OTA升级'],
  }
]

// 计算属性
const filteredModules = computed(() => {
  return modulesData.filter(module => module.category === moduleCategory.value)
})

const compatibleFirmwares = computed(() => {
  if (!selectedModule.value) return []
  return firmwaresData.filter(firmware => firmware.moduleId === selectedModule.value.id)
})

const pinConflicts = computed(() => {
  if (!selectedModule.value) return []

  const conflicts = []
  const usedFunctions = new Map()

  for (const pin of selectedModule.value.pins) {
    if (pin.function && usedFunctions.has(pin.function)) {
      conflicts.push({
        pin: pin.number,
        function: pin.function,
        description: `${pin.function} 功能被重复分配`
      })
    } else if (pin.function) {
      usedFunctions.set(pin.function, pin.number)
    }
  }

  return conflicts
})

// 方法
const getCompatibilityTag = (compatibility: string) => {
  const map: Record<string, string> = {
    excellent: 'success',
    good: 'primary',
    fair: 'warning'
  }
  return map[compatibility] || 'info'
}

const getCompatibilityText = (compatibility: string) => {
  const map: Record<string, string> = {
    excellent: '完美兼容',
    good: '良好兼容',
    fair: '一般兼容'
  }
  return map[compatibility] || compatibility
}

const selectModule = (module: any) => {
  selectedModule.value = module
  selectedFirmware.value = null
  hardwareConfig.pins = module.pins.map(pin => ({ ...pin }))

  // 自动选择第一个兼容的固件
  const compatibleFw = compatibleFirmwares.value
  if (compatibleFw.length > 0) {
    selectedFirmware.value = compatibleFw[0]
  }
}

const selectFirmware = (firmware: any) => {
  selectedFirmware.value = firmware
}

const updatePinConfig = (pin: { number: number; function: string; assigned: boolean }) => {
  const index = hardwareConfig.pins.findIndex(p => p.number === pin.number)
  if (index !== -1) {
    hardwareConfig.pins[index] = { ...pin }
  }
}

const createCustomFirmware = () => {
  ElMessage.info('自定义固件创建功能开发中...')
}

// 初始化
onMounted(() => {
  // 默认选择第一个WiFi模组
  if (filteredModules.value.length > 0) {
    selectModule(filteredModules.value[0])
  }
})
</script>

<style lang="scss" scoped>
.product-hardware {
  height: 100%;
  padding: 24px;
  background: var(--bg-canvas);

  .hardware-designer {
    display: grid;
    grid-template-columns: 320px 1fr 280px;
    gap: 24px;
    height: 100%;

    .module-selection,
    .config-panel,
    .preview-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-base);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-card);
    }

    .module-selection {
      .module-list {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .module-card {
          padding: 20px;
          border-bottom: 1px solid var(--border-base);
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: var(--bg-canvas);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }

          &.selected {
            border-left: 4px solid var(--el-color-primary);
            background: rgba(var(--el-color-primary-rgb), 0.05);
          }

          .module-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;

            .module-icon {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            .module-info {
              flex: 1;

              .module-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
              }

              .module-manufacturer {
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
          }

          .module-specs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;

            .spec-item {
              display: flex;
              justify-content: space-between;
              font-size: 12px;

              .spec-label {
                color: var(--text-secondary);
              }

              .spec-value {
                color: var(--text-primary);
                font-weight: 500;
              }
            }
          }

          .module-features {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
          }

          .module-description {
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.4;
          }
        }
      }
    }

    .config-panel {
      .config-content {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .config-section {
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

        .module-overview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;

          .overview-item {
            .overview-label {
              font-size: 12px;
              color: var(--text-secondary);
              margin-bottom: 4px;
            }

            .overview-value {
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
            }
          }
        }

        .pin-config {
          .pin-mapping {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;

            .pin-item {
              padding: 12px;
              border: 1px solid var(--border-base);
              border-radius: 8px;
              background: var(--bg-canvas);

              &.assigned {
                border-color: var(--el-color-success);
                background: rgba(var(--el-color-success-rgb), 0.05);
              }

              &.available {
                opacity: 0.7;
              }

              .pin-number {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 8px;
              }

              .pin-function {
                margin-bottom: 8px;
              }

              .pin-description {
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
          }
        }

        .firmware-config {
          .firmware-selector {
            margin-bottom: 20px;

            .selector-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;

              .selector-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
              }
            }

            .firmware-list {
              .firmware-item {
                padding: 12px;
                border: 1px solid var(--border-base);
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.3s ease;

                &:hover {
                  border-color: var(--el-color-primary);
                  background: rgba(var(--el-color-primary-rgb), 0.05);
                }

                &.selected {
                  border-color: var(--el-color-primary);
                  background: rgba(var(--el-color-primary-rgb), 0.1);
                }

                .firmware-info {
                  .firmware-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                  }

                  .firmware-version {
                    font-size: 12px;
                    color: var(--el-color-primary);
                    margin-bottom: 4px;
                  }

                  .firmware-desc {
                    font-size: 12px;
                    color: var(--text-secondary);
                  }
                }

                .firmware-meta {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 8px;

                  .firmware-date {
                    font-size: 12px;
                    color: var(--text-secondary);
                  }
                }
              }
            }
          }

          .firmware-details {
            h5 {
              margin: 0 0 12px 0;
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
            }

            .detail-item {
              display: flex;
              margin-bottom: 8px;

              .detail-label {
                font-size: 12px;
                color: var(--text-secondary);
                min-width: 60px;
              }

              .detail-value {
                font-size: 12px;
                color: var(--text-primary);
                font-weight: 500;
              }

              .feature-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-left: 8px;
              }
            }
          }
        }

        .compatibility-check {
          .check-result {
            margin-bottom: 20px;

            .result-item {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
              font-size: 14px;

              .result-icon {
                &.success {
                  color: var(--el-color-success);
                }

                &.warning {
                  color: var(--el-color-warning);
                }
              }

              &.warning {
                color: var(--el-color-warning);
              }
            }
          }

          .conflict-details {
            h5 {
              margin: 0 0 12px 0;
              font-size: 14px;
              font-weight: 600;
              color: var(--text-primary);
            }

            .conflict-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 8px;
              background: rgba(var(--el-color-warning-rgb), 0.1);
              border: 1px solid rgba(var(--el-color-warning-rgb), 0.3);
              border-radius: 4px;
              margin-bottom: 8px;

              .conflict-pin {
                font-weight: 600;
                color: var(--el-color-warning);
              }

              .conflict-desc {
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
          }
        }

        .no-selection {
          padding: 40px 20px;
          text-align: center;
        }
      }
    }

    .preview-panel {
      .preview-content {
        flex: 1;
        padding: 0;
        overflow-y: auto;

        .module-preview {
          padding: 20px;
          border-bottom: 1px solid var(--border-base);

          .preview-image {
            margin-bottom: 16px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-canvas);
            border-radius: 8px;
            overflow: hidden;
          }

          .preview-info {
            text-align: center;

            h4 {
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 600;
              color: var(--text-primary);
            }

            p {
              margin: 0;
              font-size: 12px;
              color: var(--text-secondary);
              line-height: 1.4;
            }
          }
        }

        .pin-diagram {
          padding: 20px;
          border-bottom: 1px solid var(--border-base);

          h4 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .pin-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;

            .pin-diagram-item {
              padding: 8px;
              border: 1px solid var(--border-base);
              border-radius: 4px;
              text-align: center;
              font-size: 12px;

              &.assigned {
                background: var(--el-color-success-light-9);
                border-color: var(--el-color-success);
              }

              .pin-number {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
              }

              .pin-function {
                color: var(--text-secondary);
                font-size: 11px;
              }
            }
          }
        }

        .config-summary {
          padding: 20px;

          h4 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;

            .summary-label {
              font-size: 12px;
              color: var(--text-secondary);
            }

            .summary-value {
              font-size: 12px;
              color: var(--text-primary);
              font-weight: 500;
            }
          }
        }

        .no-preview {
          padding: 40px 20px;
  text-align: center;
        }
      }
    }

    .selection-header,
    .panel-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-base);

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

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
            font-size: 16px;
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

      .selection-filter {
        display: flex;
        justify-content: center;
      }
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .hardware-designer {
    grid-template-columns: 300px 1fr 260px;
  }
}

@media (max-width: 1200px) {
  .hardware-designer {
    grid-template-columns: 1fr;

    .config-panel,
    .preview-panel {
      order: 3;
    }
  }
}

@media (max-width: 768px) {
  .product-hardware {
    padding: 16px;
  }

  .hardware-designer {
    gap: 16px;

    .selection-header,
    .panel-header {
      padding: 16px;

      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }

      .selection-filter {
        .el-radio-group {
          flex-direction: column;
          gap: 8px;
        }
      }
    }

    .module-selection {
      .module-list {
        .module-card {
          padding: 16px;

          .module-header {
            flex-direction: column;
            text-align: center;
            gap: 8px;

            .module-info {
              text-align: center;
            }
          }

          .module-specs {
            grid-template-columns: 1fr;
          }
        }
      }
    }

    .config-panel {
      .config-content {
        .config-section {
          padding: 16px;
        }

        .module-overview {
          grid-template-columns: 1fr;
        }

        .pin-config .pin-mapping {
          grid-template-columns: 1fr;
        }
      }
    }

    .preview-panel {
      .preview-content {
        .pin-diagram .pin-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }
  }
}
</style>
