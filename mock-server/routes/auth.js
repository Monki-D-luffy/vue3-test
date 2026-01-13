// mock-server/routes/auth.js

// 导出函数，接收 server (express实例) 和 db (json-server数据)
export default function (server, db) {

    // 1. 模拟 C# 登录接口
    // 前端 auth.ts 调用的是: /identity/api/Login/LoginByPwd
    server.post('/identity/api/Login/LoginByPwd', (req, res) => {
        const { userName, password, productName } = req.body;

        console.log('⚡ [Mock Auth] Receive Login:', { userName, password, productName });
        // 🔥🔥 修改点：只允许管理员账号登录 🔥🔥
        // 账号: admin (或 管理员)
        // 密码: 123456
        const isValidUser = (userName === 'admin' || userName === '管理员') && password === '123456';
        if (isValidUser) {
            // 构造符合真实后端 LoginResponseData 接口的数据结构
            // 注意：request.ts 会解包 code:200 的响应，所以这里返回标准结构
            res.json({
                code: 200,
                success: true,
                message: 'Mock Login Success',
                data: {
                    accessToken: 'mock-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
                    refreshToken: 'mock-refresh-token-xyz',
                    accessExpired: 7200,
                    userId: 'mock-user-007',
                    email: userName, // 回显登录的邮箱
                    role: 'Admin',
                    nickname: 'Mock Luffy (模拟用户)',
                    iconUrl: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
                    isEnabled: true
                }
            });
        } else {
            res.status(400).json({
                code: 400,
                success: false,
                message: '请输入账号和密码 (Mock)'
            });
        }
    });

    // 2. 模拟 Token 刷新接口
    server.post('/identity/api/Login/Refresh', (req, res) => {
        res.json({
            code: 200,
            success: true,
            message: 'Token Refreshed',
            data: {
                accessToken: `mock-refreshed-token-${Date.now()}`,
                refreshToken: 'mock-refresh-token-new'
            }
        });
    });

    // 3. 模拟注册 (可选)
    server.post('/auth/register', (req, res) => {
        res.json({
            code: 200,
            success: true,
            message: 'Mock Register Success',
            data: {
                token: 'mock-register-token',
                nickname: req.body.nickname || 'New User'
            }
        });
    });
}