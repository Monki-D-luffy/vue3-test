/**
 * src/utils/serial.ts
 * 串口数据转换专用工具集
 */

// 文本转 Hex 字符串 (e.g. "AB" -> "41 42")
export function textToHex(text: string): string {
    const encoder = new TextEncoder()
    const view = encoder.encode(text)
    return Array.from(view)
        .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ')
}

// Hex 字符串转文本 (e.g. "41 42" -> "AB")
// 处理包含空格、0x前缀等杂质的输入
export function hexToText(hex: string): string {
    const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '')
    if (cleanHex.length % 2 !== 0) return '' // 长度不对无法解析

    const bytes = new Uint8Array(cleanHex.length / 2)
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
    }
    return new TextDecoder().decode(bytes)
}

// 原始 Uint8Array 转 Hex 字符串
export function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ')
}

// 原始 Uint8Array 转文本
export function bytesToText(bytes: Uint8Array): string {
    // 使用 replace 过滤掉不可见字符（可选，视需求而定）
    return new TextDecoder().decode(bytes)
}

// Hex 字符串转原始 Uint8Array (用于发送)
export function hexToBytes(hex: string): Uint8Array | null {
    const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '')
    if (cleanHex.length % 2 !== 0) return null

    const bytes = new Uint8Array(cleanHex.length / 2)
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
    }
    return bytes
}