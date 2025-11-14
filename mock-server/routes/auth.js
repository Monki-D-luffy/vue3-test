// mock-server/routes/auth.js
const Mock = require('mockjs')

module.exports = function (server, db) {
    // 模拟网络延迟，让 Loading 效果可见
    const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

    // 登录接口
    server.post('/api/auth/login', async (req, res) => {
        await delay(800); // 模拟 800ms 延迟

        const { account, password } = req.body
        // 简单模拟：特定账号或任意长度大于5的密码都允许登录（开发方便）
        if ((account === 'admin' && password === '123456') || (account && password && password.length >= 6)) {
            res.json({
                code: 200,
                message: "登录成功",
                success: true,
                data: {
                    token: "mock_token_" + Mock.Random.string(32),
                    userId: Mock.Random.guid(),
                    nickname: account.split('@')[0] || "Admin",
                    email: account
                }
            })
        } else {
            res.status(401).json({ code: 401, message: "账号或密码错误", success: false, data: null })
        }
    })

    // 注册接口 (新增)
    server.post('/api/auth/register', async (req, res) => {
        await delay(1200); // 注册稍微慢一点，模拟写库

        const { email, password, nickname } = req.body;

        if (!email || !password) {
            return res.status(400).json({ code: 400, message: "邮箱和密码不能为空", success: false });
        }

        // 模拟注册成功，直接返回登录态
        res.json({
            code: 200,
            message: "注册成功",
            success: true,
            data: {
                token: "mock_token_register_" + Mock.Random.string(32),
                userId: Mock.Random.guid(),
                nickname: nickname || email.split('@')[0],
                email: email
            }
        });
    })

    // Token 校验中间件
    server.use('/api', (req, res, next) => {
        // 白名单
        if (req.path === '/auth/login' || req.path === '/auth/register') return next()

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            next()
        } else {
            // 暂时只打印警告，不强制拦截，方便开发调试
            console.warn(`[Mock Server] WARN: /api${req.path} 请求未携带 Token`)
            next()
        }
    })
}