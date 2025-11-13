// 日期功能 mock-server/utils.js

// 1. 定义独立函数
function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    const Y = date.getFullYear() + '-'
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
    const D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' '
    const h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':'
    const m = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()) + ':'
    const s = (date.getSeconds() < 10 ? '0' + (date.getSeconds()) : date.getSeconds()) + '.'
    const ms = (date.getMilliseconds() < 100 ? (date.getMilliseconds() < 10 ? '00' : '0') : '') + date.getMilliseconds()
    return Y + M + D + h + m + s + ms
}

function getNowString() {
    // 直接调用上面的函数
    return formatTimestamp(Date.now()).split('.')[0]
}

function isTimeAfter(t1, t2) {
    return new Date(t1).getTime() > new Date(t2).getTime()
}

// 2. 统一导出
module.exports = {
    formatTimestamp,
    getNowString,
    isTimeAfter
}