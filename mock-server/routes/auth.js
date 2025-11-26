// mock-server/routes/auth.js
import Mock from 'mockjs';

export default function (server, db) {
    // 模拟网络延迟
    const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

    // 登录接口
    server.post('/api/auth/login', async (req, res) => {
        await delay(600);

        const { account, password } = req.body;

        if (password === '123456' && account === 'admin') {
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
            });
        } else {
            res.status(401).json({ code: 401, message: "账号或密码错误 (默认密码: 123456)", success: false, data: null });
        }
    });

    // 注册接口
    server.post('/api/auth/register', async (req, res) => {
        await delay(1000);

        const { email, password, nickname } = req.body;

        if (!email || !password) {
            return res.status(400).json({ code: 400, message: "邮箱和密码不能为空", success: false });
        }

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
    });

    // Token 校验中间件
    server.use('/api', (req, res, next) => {
        if (req.path === '/auth/login' || req.path === '/auth/register') return next();
        // dashboard 也不校验 token，防止统计卡片报错
        if (req.path.startsWith('/dashboard')) return next();

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            next();
        } else {
            // 暂时只警告不拦截，方便开发
            console.warn(`[Mock Server] WARN: /api${req.path} 请求未携带 Token`);
            next();
        }
    });
}