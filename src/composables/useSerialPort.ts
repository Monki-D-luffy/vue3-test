/**
 * src/composables/useSerialPort.ts
 * 修复：增加连接互斥锁，防止 "open() is already in progress" 错误
 */

import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { hexToBytes } from '@/utils/serial'

// --- 全局单例状态 ---
const isConnected = ref(false)
// 🆕 新增：连接中状态锁，防止重复点击
const isOpening = ref(false)
const port = ref<any>(null)
const logs = ref<SerialLog[]>([])

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
        // 防线1: 确保端口已连接且可读
        if (!port.value || !port.value.readable) return

        // 强制类型断言，或者使用局部变量捕获，避免 TS 认为 port.value 在在此期间变成了 null
        const currentPort = port.value

        // 创建 reader
        // 注意：getReader() 可能会报错，所以放在 try 块外层或单独处理
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

        try {
            reader = currentPort.readable.getReader()
        } catch (e) {
            console.error('无法获取 Reader:', e)
            return
        }

        try {
            // 循环读取
            while (true) {
                // 防线2: 在调用 read() 前再次检查 reader 是否存在
                if (!reader) break

                const { value, done } = await reader.read()

                if (done) {
                    // 流已关闭（通常是用户手动断开）
                    break
                }

                if (value) {
                    // 处理数据
                    // 这里调用你的数据解析逻辑，例如：
                    // parser.parse(value)
                    // 或者直接追加到 logs
                    const text = new TextDecoder().decode(value)
                    // emit('data', text) // 如果你有 emit
                    console.log('收到数据:', text) // 示例
                }
            }
        } catch (error) {
            console.error('读取错误:', error)
        } finally {
            // 防线3: 极其重要！必须释放锁，否则无法再次 open
            if (reader) {
                reader.releaseLock()
            }
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
            writer = port.value.writable.getWriter()
            if (writer) {
                await writer.write(dataToWrite)
                addLog(dataToWrite, 'TX', source)
            }
        } catch (error: any) {
            addLog(`发送失败: ${error.message}`, 'SYS', 'System')
        } finally {
            if (writer) { writer.releaseLock(); writer = null }
        }
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
        isOpening, // 🆕 导出状态供 UI 使用
        port,
        config,
        logs,
        stats,
        requestPort,
        open,
        close,
        send,
        clearLogs: () => (logs.value = []),
        resetStats: () => {
            stats.rxBytes = 0; stats.txBytes = 0;
            stats.rxPackets = 0; stats.txPackets = 0;
        }
    }
}