<script setup lang="ts">
import { ref } from 'vue'
import { Link, Connection, Setting, Close, RefreshRight, Switch, Loading } from '@element-plus/icons-vue'
import { useSerialPort } from '@/composables/useSerialPort'
import { ElMessage } from 'element-plus'

// 接收外部传入的 style/class
const { isConnected, isOpening, port, config, requestPort, open, close } = useSerialPort()

const baudRates = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]

const dataBitsOpts = [7, 8]
const stopBitsOpts = [1, 2]
const parityOpts = [
    { label: 'None', value: 'none' },
    { label: 'Even', value: 'even' },
    { label: 'Odd', value: 'odd' }
]

const isReconnecting = ref(false)

// --- 自动重启连接逻辑 ---
const handleConfigChange = async () => {
    if (isConnected.value) {
        if (isReconnecting.value) return // 防止连击
        try {
            isReconnecting.value = true
            await close()
            // 🔥 关键：必须给一点时间让串口释放资源，否则马上 open 会报错
            await new Promise(resolve => setTimeout(resolve, 300))
            await open()
            ElMessage.success({ message: '配置已更新', grouping: true, type: 'success' })
        } catch (e) {
            console.error(e)
        } finally {
            isReconnecting.value = false
        }
    }
}

// --- 主按钮逻辑 ---
const handleMainAction = async () => {
    // 如果正在重连或正在打开，禁止操作
    if (isReconnecting.value || isOpening.value) return

    if (isConnected.value) {
        await close()
    } else {
        if (!port.value) {
            const success = await requestPort()
            if (success) await open()
        } else {
            await open()
        }
    }
}

// --- 切换设备 ---
const handleChangeDevice = async () => {
    if (isReconnecting.value || isOpening.value) return
    if (isConnected.value) await close()
    const success = await requestPort()
    if (success) await open()
}
</script>

<template>
    <div class="serial-connector-card">
        <div class="device-group">
            <div class="icon-3d-wrapper" :class="{ active: isConnected, loading: isReconnecting || isOpening }">
                <el-icon :size="20" class="status-icon">
                    <component :is="(isReconnecting || isOpening) ? Loading : (isConnected ? Link : Connection)"
                        :class="{ 'spin-anim': isReconnecting || isOpening }" />
                </el-icon>
                <div class="glow-effect" v-if="isConnected && !isReconnecting"></div>
            </div>

            <div class="info-group">
                <span class="label">Serial Link</span>
                <div class="value-row">
                    <span class="value">
                        {{ isOpening ? '正在连接...' : (isReconnecting ? '更新配置...' : (isConnected ? '已连接设备' : (port ? '设备就绪'
                            : '未连接'))) }}
                    </span>
                </div>
            </div>
        </div>

        <div class="control-group">

            <el-tooltip v-if="port" content="切换串口设备" placement="bottom" :show-after="500">
                <button class="icon-btn" @click="handleChangeDevice" :disabled="isOpening">
                    <el-icon>
                        <Switch />
                    </el-icon>
                </button>
            </el-tooltip>

            <el-popover placement="bottom-end" :width="280" trigger="click" popper-class="param-popover">
                <template #reference>
                    <button class="icon-btn" title="更多参数" :disabled="isOpening">
                        <el-icon>
                            <Setting />
                        </el-icon>
                    </button>
                </template>
                <div class="params-card">
                    <div class="params-header">高级参数设置</div>
                    <div class="param-grid">
                        <div class="param-item">
                            <span class="param-label">数据位 (Data Bits)</span>
                            <el-radio-group v-model="config.dataBits" size="small" @change="handleConfigChange">
                                <el-radio-button v-for="opt in dataBitsOpts" :key="opt" :value="opt" :label="opt">{{ opt
                                    }}</el-radio-button>
                            </el-radio-group>
                        </div>
                        <div class="param-item">
                            <span class="param-label">停止位 (Stop Bits)</span>
                            <el-radio-group v-model="config.stopBits" size="small" @change="handleConfigChange">
                                <el-radio-button v-for="opt in stopBitsOpts" :key="opt" :value="opt" :label="opt">{{ opt
                                    }}</el-radio-button>
                            </el-radio-group>
                        </div>
                        <div class="param-item">
                            <span class="param-label">校验位 (Parity)</span>
                            <el-select v-model="config.parity" size="small" @change="handleConfigChange">
                                <el-option v-for="opt in parityOpts" :key="opt.value" :label="opt.label"
                                    :value="opt.value" />
                            </el-select>
                        </div>
                    </div>
                </div>
            </el-popover>

            <div class="param-input-wrapper" title="分包超时时间(ms)">
                <span class="prefix-label">超时</span>
                <el-input-number v-model="config.chunkTimeout" :min="0" :max="1000" :step="10" :controls="false"
                    class="modern-input-number" placeholder="0" @change="handleConfigChange" :disabled="isOpening" />
                <span class="suffix-label">ms</span>
            </div>

            <el-select v-model="config.baudRate" placeholder="波特率" class="modern-select" popper-class="modern-popper"
                style="width: 150px" @change="handleConfigChange" :disabled="isOpening">
                <template #prefix>
                    <span class="select-prefix">波特率</span>
                </template>
                <el-option v-for="rate in baudRates" :key="rate" :label="rate" :value="rate" />
            </el-select>

            <div class="divider"></div>

            <button class="gradient-btn" :class="{
                'is-danger': isConnected && !isReconnecting && !isOpening,
                'is-loading': isReconnecting || isOpening
            }" @click="handleMainAction" :disabled="isReconnecting || isOpening">
                <el-icon class="mr-1" :class="{ 'spin-anim': isReconnecting || isOpening }">
                    <component :is="(isReconnecting || isOpening) ? Loading : (isConnected ? Close : RefreshRight)" />
                </el-icon>
                <span>
                    {{ isOpening ? '连接中...' : (isReconnecting ? '重连中...' : (isConnected ? '断开' : (port ? '立即连接' :
                        '选择设备'))) }}
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
/* 样式部分完全保持不变，直接复用 */
.serial-connector-card {
    background: var(--app-bg-card);
    border-radius: 16px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--app-shadow-md);
    border: var(--app-glass-border);
    backdrop-filter: var(--app-glass-blur);
    transition: all 0.3s ease;
    height: 64px;
}

.device-group {
    display: flex;
    align-items: center;
    gap: 14px;
}

.info-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--app-text-sub);
    font-weight: 700;
}

.value {
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text-main);
}

.icon-3d-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #f1f5f9;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s;
}

.icon-3d-wrapper.active {
    background: var(--app-gradient-primary);
    color: white;
    box-shadow: var(--app-glow-primary);
}

.spin-anim {
    animation: rotate 1s linear infinite;
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.glow-effect {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: inherit;
    filter: blur(8px);
    opacity: 0.6;
    z-index: -1;
    animation: pulse 2s infinite;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.divider {
    width: 1px;
    height: 24px;
    background: #e2e8f0;
    margin: 0 4px;
}

/* 按钮样式 */
.icon-btn {
    background: transparent;
    border: 1px solid transparent;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.icon-btn:hover:not(:disabled) {
    background: #f1f5f9;
    color: #6366f1;
}

.icon-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.gradient-btn {
    border: none;
    height: 36px;
    padding: 0 16px;
    border-radius: 10px;
    background: var(--app-gradient-primary);
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}

.gradient-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
}

.gradient-btn.is-danger {
    background: var(--app-gradient-danger);
    box-shadow: 0 4px 10px rgba(244, 63, 94, 0.3);
}

.gradient-btn.is-loading {
    opacity: 0.8;
    cursor: wait;
}

.gradient-btn:disabled {
    background: #cbd5e1;
    box-shadow: none;
    transform: none;
    cursor: not-allowed;
}

/* --- 表单控件美化 --- */

/* 分包时间容器 */
.param-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--el-fill-color-blank);
    border-radius: 8px;
    padding: 0 8px;
    height: 32px;
    border: 1px solid transparent;
    transition: all 0.2s;
}

.param-input-wrapper:hover {
    background: var(--el-border-color);
    border-color: #e2e8f0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.prefix-label,
.suffix-label {
    font-size: 12px;
    color: #909399;
    user-select: none;
}

.prefix-label {
    margin-right: 4px;
}

.suffix-label {
    margin-left: 2px;
}

/* 定制 InputNumber */
.modern-input-number {
    width: 40px !important;
    margin: 0 4px;
}

:deep(.modern-input-number .el-input__wrapper) {
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important;
    width: 100%;
}

:deep(.modern-input-number .el-input__inner) {
    font-size: 13px;
    font-weight: 600;
    color: var(--app-text-main);
    text-align: center;
    height: 28px;
    padding: 0;
}

/* 定制 Select */
.select-prefix {
    font-size: 12px;
    color: #909399;
    margin-right: 4px;
}

:deep(.modern-select .el-input__wrapper) {
    box-shadow: none !important;
    background-color: #f8fafc;
    border: 1px solid transparent;
    transition: all 0.2s;
    padding-left: 8px;
    border-radius: 8px;
    height: 32px;
}

:deep(.modern-select .el-input__wrapper:hover),
:deep(.modern-select.is-focus .el-input__wrapper) {
    background-color: white;
    border-color: #e2e8f0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03) !important;
}

:deep(.modern-select .el-input__inner) {
    font-size: 13px;
    font-weight: 600;
    color: var(--app-text-main);
    height: 32px;
}

/* Popover */
.params-card {
    padding: 8px;
}

.params-header {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
}

.param-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.param-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.param-label {
    font-size: 12px;
    color: #64748b;
}
</style>