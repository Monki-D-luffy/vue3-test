// mock-server/seeder.js
const fs = require('fs')
const Mock = require('mockjs')
const { formatTimestamp, getNowString } = require('./utils')

module.exports = function preSeedDatabase(dbPath) {
    console.log('--- [Mock Server] 正在重新生成所有模拟数据... ---')

    let dbData = {
        devices: [],
        deviceLogs: [],
        products: [],
        firmwares: [],
        upgradeTasks: [],
        campaigns: []
    }

    // --- 1. 生成产品 ---
    const products = [
        { id: 'prod_light_01', name: '智能灯泡', type: '智能灯泡' },
        { id: 'prod_socket_01', name: '智能插座', type: '智能插座' },
        { id: 'prod_sensor_th', name: '温湿度计', type: '温湿度计' },
        { id: 'prod_cam_01', name: '摄像头', type: '摄像头' },
        { id: 'prod_water_meter', name: 'NB-IoT水表', type: 'NB-IoT水表' }
    ]
    dbData.products = products

    // --- 2. 生成固件 ---
    dbData.firmwares.push(
        {
            id: 'fw_001', version: '1.1.0', productId: 'prod_light_01', productName: '智能灯泡',
            releaseNotes: '1. 修复了低功耗模式下的连接 Bug \n2. 优化了配网速度',
            fileUrl: '/files/firmware_1.1.0.bin',
            uploadedAt: formatTimestamp(new Date('2024-10-26T10:00:00Z').getTime()).split('.')[0],
            verified: true
        },
        {
            id: 'fw_002', version: '1.0.1', productId: 'prod_socket_01', productName: '智能插座',
            releaseNotes: '1. 紧急修复安全漏洞',
            fileUrl: '/files/firmware_1.0.1.bin',
            uploadedAt: formatTimestamp(new Date('2024-10-25T14:30:00Z').getTime()).split('.')[0],
            verified: true
        },
        {
            id: 'fw_003', version: '2.0.0', productId: 'prod_cam_01', productName: '摄像头',
            releaseNotes: '1. 增加 AI 人形检测 \n2. 优化夜视模式',
            fileUrl: '/files/firmware_2.0.0.bin',
            uploadedAt: formatTimestamp(new Date('2024-10-27T11:00:00Z').getTime()).split('.')[0],
            verified: true
        }
    )

    // --- 3. 生成设备 ---
    const dataCenters = ['CN', 'US-WEST', 'EU-CENTRAL', 'IN', 'US-EAST', 'EU-WEST', 'SG']
    const minTime = new Date('2022-01-01 00:00:00').getTime()
    const maxTime = new Date('2025-12-31 23:59:59').getTime()

    for (let i = 0; i < 202; i++) {
        const activeTs = minTime + Math.random() * (maxTime - minTime)
        const lastOnlineTs = activeTs + Math.random() * (maxTime - activeTs)
        const randomProduct = Mock.Random.pick(products)

        let firmwareVersion = '1.0.0'
        let hasNewFirmware = false
        const latestFirmware = dbData.firmwares.find(f => f.productId === randomProduct.id)
        if (latestFirmware) {
            if (Math.random() < 0.5) {
                hasNewFirmware = true
            } else {
                firmwareVersion = latestFirmware.version
                hasNewFirmware = false
            }
        }

        dbData.devices.push(Mock.mock({
            'id': '@guid',
            'name': '@ctitle(3, 7)',
            'status|1': ["在线", "离线", "未激活", "故障"],
            'puuid': /PU-202[3-5][0-9]{4}/,
            'productInfo': `${randomProduct.name} / ${randomProduct.id}`,
            'deviceType': randomProduct.type,
            'productId': randomProduct.id,
            'firmwareVersion': firmwareVersion,
            'hasNewFirmware': hasNewFirmware,
            'sn': /SN_[A-Z0-9]{12}/,
            'isBound|1-2': true,
            'dataCenter|1': dataCenters,
            'gmtActive': formatTimestamp(activeTs).split('.')[0],
            'gmtLastOnline': formatTimestamp(lastOnlineTs).split('.')[0]
        }))
    }

    // --- 4. 生成历史任务 ---
    dbData.upgradeTasks.push({
        id: 'task_' + Mock.Random.guid(),
        deviceId: dbData.devices[0].id, deviceName: dbData.devices[0].name,
        firmwareId: 'fw_001', firmwareVersion: '1.1.0', status: 'success', progress: 100, errorMessage: null,
        startedAt: formatTimestamp(new Date('2024-10-27T11:00:00Z').getTime()).split('.')[0],
        finishedAt: formatTimestamp(new Date('2024-10-27T11:05:00Z').getTime()).split('.')[0]
    })
    dbData.upgradeTasks.push({
        id: 'task_' + Mock.Random.guid(),
        deviceId: dbData.devices[1].id, deviceName: dbData.devices[1].name,
        firmwareId: 'fw_002', firmwareVersion: '1.0.1', status: 'failed', progress: 40, errorMessage: '设备意外离线',
        startedAt: formatTimestamp(new Date('2024-10-26T11:00:00Z').getTime()).split('.')[0],
        finishedAt: formatTimestamp(new Date('2024-10-26T11:02:00Z').getTime()).split('.')[0]
    })

    // --- 5. 生成日志 ---
    const logEvents = ['设备上报', '平台下发', '设备在线', '设备离线', '设备告警']
    const logTypes = ['数据转换', '状态通知', '云端处理', 'OTA升级', '告警事件']
    const logSources = ['设备本身', '平台下发', '云端规则']
    const detailsTemplate = /TkkAilQ[A-Za-z0-9+/=]{60,100}/
    let logIdCounter = 1

    dbData.devices.forEach(device => {
        const logCount = Mock.Random.integer(5, 20);
        for (let i = 0; i < logCount; i++) {
            const logTimeTs = minTime + Math.random() * (maxTime - minTime)
            dbData.deviceLogs.push(Mock.mock({
                id: logIdCounter++,
                deviceId: device.id,
                time: formatTimestamp(logTimeTs),
                'event|1': logEvents, 'type|1': logTypes, 'details': detailsTemplate, 'source|1': logSources, 'switch|1-2': true
            }))
        }
    });
    dbData.deviceLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8')
    console.log('--- [Mock Server] db.json 文件已成功覆盖 ---')
}