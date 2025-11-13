// mock-server/routes/auth.js
const Mock = require('mockjs')

module.exports = function (server, db) {
    // 登录接口
    server.post('/api/auth/login', (req, res) => {
        const { account, password } = req.body
        if ((account === '1067360038@qq.com' && password === '123456') || (account === 'admin' && password === '123456')) {
            res.json({
                code: 200, message: "登录成功", success: true,
                data: { token: "mock_token_" + Mock.Random.string(32), userId: Mock.Random.guid(), nickname: "Admin", email: account }
            })
        } else {
            res.status(401).json({ code: 401, message: "账号或密码错误", success: false, data: null })
        }
    })

    // Token 校验中间件
    server.use('/api', (req, res, next) => {
        if (req.path === '/auth/login') return next()
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            next()
        } else {
            console.warn(`[Mock Server] WARN: /api${req.path} 请求未携带 Token，已放行`)
            next()
        }
    })
}