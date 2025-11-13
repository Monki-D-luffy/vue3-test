// mock-server/routes/firmware.js
const Mock = require('mockjs')
const { formatTimestamp, getNowString, isTimeAfter } = require('../utils')

module.exports = function (server, db) {

    // 1. 固件上传
    server.post('/api/firmwares', (req, res) => {
        const { version, productId, releaseNotes } = req.body
        const product = db.get('products').find({ id: productId }).value()
        if (!product) return res.status(404).json({ code: 404, message: "产品不存在", success: false })

        const newFirmware = {
            id: 'fw_' + Mock.Random.guid(),
            version, productId, releaseNotes,
            productName: product.name,
            fileUrl: `/files/firmware_${version}.bin`,
            uploadedAt: getNowString(),
            verified: false
        }

        db.get('firmwares').push(newFirmware).write()

        // 简单模拟：通知设备有更新
        db.get('devices').filter({ productId: productId }).each(d => d.hasNewFirmware = true).write()

        res.json({ code: 200, message: '上传成功', success: true, data: newFirmware })
    })

    // 2. 触发升级
    server.post('/api/devices/upgrade', (req, res) => {
        const { deviceId } = req.body
        const device = db.get('devices').find({ id: deviceId }).value()
        if (!device) return res.status(404).json({ code: 404, message: "设备不存在", success: false })

        // 查找最新已验证固件 (时间戳排序)
        const latestFirmware = db.get('firmwares')
            .filter(f => f.productId === device.productId && f.verified === true)
            .value()
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]

        if (!latestFirmware) return res.status(400).json({ code: 400, message: "没有找到可用的已验证固件", success: false })

        const newTask = {
            id: 'task_' + Mock.Random.guid(),
            deviceId: device.id,
            deviceName: device.name,
            firmwareId: latestFirmware.id,
            firmwareVersion: latestFirmware.version,
            status: 'pending',
            progress: 0,
            errorMessage: null,
            startedAt: getNowString(),
            finishedAt: null
        }

        db.get('upgradeTasks').push(newTask).write()
        db.get('devices').find({ id: deviceId }).assign({ status: '升级中' }).write()

        res.json({ code: 200, message: '升级任务已启动', success: true, data: newTask })
    })

    // 3. 轮询任务状态 (时间驱动)
    server.get('/api/upgrade-task/:id', (req, res) => {
        const taskId = req.params.id
        const task = db.get('upgradeTasks').find({ id: taskId }).value()

        if (!task) return res.status(404).json({ code: 404, message: "任务不存在", success: false })
        if (task.status === 'success' || task.status === 'failed') {
            return res.json({ code: 200, message: '获取成功', success: true, data: task })
        }

        const TOTAL_DURATION = 15000
        const elapsed = Date.now() - new Date(task.startedAt).getTime()

        let updates = {}
        if (elapsed < 2000) {
            updates = { status: 'downloading', progress: Math.min(30, Math.floor((elapsed / 2000) * 30)) }
        } else if (elapsed < TOTAL_DURATION) {
            updates = { status: 'installing', progress: 30 + Math.floor(((elapsed - 2000) / (TOTAL_DURATION - 2000)) * 69) }
        } else {
            // 模拟结果
            const isFail = taskId.charCodeAt(taskId.length - 1) % 10 === 0
            if (isFail) {
                updates = { status: 'failed', errorMessage: '校验失败', finishedAt: getNowString() }
                db.get('devices').find({ id: task.deviceId }).assign({ status: '故障' }).write()
            } else {
                updates = { status: 'success', progress: 100, finishedAt: getNowString() }
                // 重新检查更新
                const device = db.get('devices').find({ id: task.deviceId }).value()
                const newerFw = db.get('firmwares')
                    .filter(f => f.productId === device.productId && f.verified === true)
                    .filter(f => isTimeAfter(f.uploadedAt, task.startedAt)).value()

                db.get('devices').find({ id: task.deviceId }).assign({
                    status: '在线', firmwareVersion: task.firmwareVersion, hasNewFirmware: newerFw.length > 0
                }).write()
            }
        }

        db.get('upgradeTasks').find({ id: taskId }).assign(updates).write()
        res.json({ code: 200, message: '获取成功', success: true, data: { ...task, ...updates } })
    })
}