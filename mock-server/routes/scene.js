const express = require('express');
const router = express.Router();

// 内存数据库 (模拟 DB)
let scenes = [
    {
        id: 'sc_001',
        name: '回家模式',
        description: '开启客厅灯光与空调',
        enabled: true,
        matchType: 'OR',
        triggers: [
            { id: 't1', type: 'manual', displayText: '手动触发', params: {} }
        ],
        actions: [
            { id: 'a1', type: 'device_write', displayText: '打开 客厅灯', params: { targetDeviceId: 'dev_1', dpId: '1', value: true } },
            { id: 'a2', type: 'delay', displayText: '延时 5秒', params: { delaySeconds: 5 } }
        ],
        lastTriggered: null
    }
];

// List
router.get('/', (req, res) => {
    res.json({ code: 200, data: scenes, total: scenes.length });
});

// Create
router.post('/', (req, res) => {
    const newScene = { ...req.body, id: `sc_${Date.now()}`, lastTriggered: null };
    scenes.unshift(newScene);
    res.json({ code: 200, data: newScene });
});

// Update
router.put('/:id', (req, res) => {
    const idx = scenes.findIndex(s => s.id === req.params.id);
    if (idx > -1) {
        scenes[idx] = { ...scenes[idx], ...req.body };
        res.json({ code: 200, data: scenes[idx] });
    } else {
        res.status(404).json({ code: 404, message: 'Scene not found' });
    }
});

// Delete
router.delete('/:id', (req, res) => {
    scenes = scenes.filter(s => s.id !== req.params.id);
    res.json({ code: 200, message: 'Deleted' });
});

// Execute (模拟执行逻辑)
router.post('/:id/execute', (req, res) => {
    const scene = scenes.find(s => s.id === req.params.id);
    if (scene) {
        scene.lastTriggered = new Date().toISOString();

        // 生成逼真的执行日志
        const logs = [];
        logs.push({ time: Date.now(), level: 'info', msg: `场景 [${scene.name}] 触发条件满足` });

        scene.actions.forEach((action, index) => {
            // 模拟一点时间差
            logs.push({
                time: Date.now() + (index * 500) + 100,
                level: 'success',
                msg: `执行动作: ${action.displayText} -> 成功`
            });
        });

        logs.push({ time: Date.now() + scene.actions.length * 500 + 200, level: 'info', msg: '场景执行完毕' });

        res.json({
            code: 200,
            data: {
                status: 'success',
                executionTime: scene.lastTriggered,
                logs: logs
            }
        });
    } else {
        res.status(404).json({ code: 404, message: 'Scene not found' });
    }
});

module.exports = router;