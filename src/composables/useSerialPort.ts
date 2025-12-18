/**
 * src/composables/useSerialPort.ts
 * 修复：增加连接互斥锁，防止 "open() is already in progress" 错误
 */

import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { hexToBytes } from '@/utils/serial'

// --- 全局单例状态 ---
const isConnected = ref(false)
// 连接中状态锁，防止重复点击
const isOpening = ref(false)
const port = ref<any>(null)
const logs = ref<SerialLog[]>([])

// 发送相关的全局状态：映射到主输入框
const inputContent = ref('')
const isHexSend = ref(false)

// 循环发送状态
const isCycling = ref(false)
const cycleInterval = ref(1000)
let cycleTimer: ReturnType<typeof setInterval> | null = null


const stats = reactive({
    rxBytes: 0,
    txBytes: 0,
    rxPackets: 0,
    txPackets: 0
})

const config = reactive({
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    chunkTimeout: 20
})

// 内部缓冲区状态
const bufferState = reactive({
    buffer: new Uint8Array(0),
    timer: null as ReturnType<typeof setTimeout> | null
})

let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null
let keepReading = false

export interface SerialLog {
    id: string
    timestamp: number
    type: 'RX' | 'TX' | 'SYS'
    originalData: Uint8Array
    content?: string
    source?: string
}

export function useSerialPort() {

    const addLog = (data: Uint8Array | string, type: 'RX' | 'TX' | 'SYS' = 'RX', source?: string) => {
        const now = Date.now()
        let bytes: Uint8Array

        if (typeof data === 'string') {
            bytes = new TextEncoder().encode(data)
        } else {
            bytes = data
        }

        if (type === 'RX') {
            stats.rxBytes += bytes.length
            stats.rxPackets++
        }
        if (type === 'TX') {
            stats.txBytes += bytes.length
            stats.txPackets++
        }

        logs.value.push({
            id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: now,
            type,
            originalData: bytes,
            source
        })

        if (logs.value.length > 1000) logs.value.shift()
    }

    // 辅助：追加数据
    const appendBuffer = (chunk: Uint8Array) => {
        const newBuffer = new Uint8Array(bufferState.buffer.length + chunk.length)
        newBuffer.set(bufferState.buffer)
        newBuffer.set(chunk, bufferState.buffer.length)
        bufferState.buffer = newBuffer
    }

    // 辅助：立即输出并清空缓冲区
    const flushBuffer = () => {
        if (bufferState.buffer.length === 0) return
        const completePacket = bufferState.buffer
        addLog(completePacket, 'RX', 'Device')
        bufferState.buffer = new Uint8Array(0)
        if (bufferState.timer) {
            clearTimeout(bufferState.timer)
            bufferState.timer = null
        }
    }

    const readLoop = async () => {
        if (!port.value || !port.value.readable) return

        try {
            reader = port.value.readable.getReader()
        } catch (e: any) {
            console.error('获取 reader 失败:', e)
            return
        }

        // 确保在后续使用时 reader 不为 null，使用局部 const 引用以便类型收窄
        if (!reader) return
        const localReader = reader

        try {
            while (keepReading) {
                const { value, done } = await localReader.read()
                if (done) break

                if (value) {
                    if (config.chunkTimeout <= 0 || bufferState.buffer.length > 2048) {
                        if (bufferState.buffer.length > 0) {
                            appendBuffer(value)
                            flushBuffer()
                        } else {
                            addLog(value, 'RX', 'Device')
                        }
                    } else {
                        appendBuffer(value)
                        if (bufferState.timer) clearTimeout(bufferState.timer)
                        bufferState.timer = setTimeout(() => {
                            flushBuffer()
                        }, config.chunkTimeout)
                    }
                }
            }
        } catch (error) {
            // 忽略因 close 导致的流中断错误
            if (keepReading) {
                console.error('流错误:', error)
                addLog('读取流异常中断', 'SYS', 'System')
            }
        } finally {
            if (localReader) {
                try { localReader.releaseLock() } catch (e) { }
            }
            reader = null
        }
    }

    const requestPort = async () => {
        if (!('serial' in navigator)) { ElMessage.error('不支持 Web Serial'); return false }
        try {
            // @ts-ignore
            const selectedPort = await navigator.serial.requestPort()
            port.value = selectedPort
            return true
        } catch (error: any) {
            // 用户取消选择不报错
            if (error.name !== 'NotFoundError') {
                ElMessage.error(`选择失败: ${error.message}`)
            }
            return false
        }
    }

    const open = async () => {
        if (!port.value) { ElMessage.warning('请先选择设备'); return }

        // 🔥 核心修复：防止重复点击或自动连接冲突
        if (isConnected.value || isOpening.value) return

        try {
            isOpening.value = true // 🔒 上锁

            const options = {
                baudRate: Number(config.baudRate),
                dataBits: Number(config.dataBits),
                stopBits: Number(config.stopBits),
                parity: String(config.parity) as 'none' | 'even' | 'odd'
            }

            await port.value.open(options)

            isConnected.value = true
            keepReading = true
            addLog('串口连接成功', 'SYS', 'System')
            ElMessage.success('已连接')

            readLoop()
        } catch (error: any) {
            console.error('Open error:', error)
            ElMessage.error(`无法打开: ${error.message}`)
            isConnected.value = false
        } finally {
            isOpening.value = false // 🔓 解锁
        }
    }

    const send = async (content: string, isHex: boolean = false, source: string = 'Manual') => {
        if (!port.value || !port.value.writable || !isConnected.value) {
            ElMessage.warning('串口未连接')
            return
        }
        let dataToWrite: Uint8Array | null
        if (isHex) {
            dataToWrite = hexToBytes(content)
            if (!dataToWrite) { ElMessage.error('Hex 格式错误'); return }
        } else {
            dataToWrite = new TextEncoder().encode(content)
        }
        try {
            // 使用局部非空引用以避免全局 writer 被判定为可能为 null
            const localWriter = port.value.writable.getWriter()
            writer = localWriter
            await localWriter.write(dataToWrite)
            addLog(dataToWrite, 'TX', source)
        } catch (error: any) {
            addLog(`发送失败: ${error.message}`, 'SYS', 'System')
        } finally {
            if (writer) { try { writer.releaseLock() } catch (e) { } writer = null }
        }
    }
    // 启动循环发送
    const startCycle = (content: string, interval: number, isHex: boolean) => {
        if (isCycling.value) stopCycle()
        if (!isConnected.value) { ElMessage.warning('请先连接串口'); return }

        isCycling.value = true
        cycleTimer = setInterval(() => {
            if (isConnected.value && isCycling.value) {
                send(content, isHex, 'Auto-Cycle')
            } else {
                stopCycle()
            }
        }, interval)
    }
    // 停止循环发送
    const stopCycle = () => {
        isCycling.value = false
        if (cycleTimer) {
            clearInterval(cycleTimer)
            cycleTimer = null
        }
    }
    /**
     * 🆕 循环发送控制
     */
    const toggleCycle = (active: boolean) => {
        if (!active) {
            isCycling.value = false
            if (cycleTimer) clearInterval(cycleTimer)
            return
        }

        if (!inputContent.value) {
            ElMessage.warning('请输入发送内容')
            isCycling.value = false
            return
        }

        isCycling.value = true
        cycleTimer = setInterval(() => {
            if (isConnected.value && isCycling.value) {
                send(inputContent.value, isHexSend.value, 'Auto-Cycle')
            } else {
                toggleCycle(false)
            }
        }, cycleInterval.value)
    }
    const close = async () => {
        // 1. 清理定时器
        if (bufferState.timer) clearTimeout(bufferState.timer)

        // 2. 停止读取标志，这会让 readLoop 退出 while
        keepReading = false

        // 3. 强制取消 reader
        if (reader) {
            try {
                await reader.cancel()
            } catch (e) {
                // 忽略 cancel 错误
            }
        }

        // 4. 关闭串口
        if (port.value) {
            try {
                await port.value.close()
            } catch (e: any) {
                // 忽略端口已关闭错误
                console.warn('Close warning:', e)
            }
        }

        isConnected.value = false
        isOpening.value = false // 确保异常状态下也能重置锁
        addLog('连接已关闭', 'SYS', 'System')
    }

    return {
        isConnected,
        isOpening, // 导出状态供 UI 使用
        isCycling,
        inputContent,
        isHexSend,
        cycleInterval,
        port,
        config,
        logs,
        stats,
        requestPort,
        open,
        startCycle,
        stopCycle,
        toggleCycle,
        close,
        send,
        clearLogs: () => (logs.value = []),
        resetStats: () => {
            stats.rxBytes = 0; stats.txBytes = 0;
            stats.rxPackets = 0; stats.txPackets = 0;
        }
    }
}