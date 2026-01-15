/**
 * IoT API 验证脚本 (免安装版 - 增强调试版 v4 - 终极修复)
 * 用途：无需 npm install，直接使用 Node.js v18+ 原生能力验证接口。
 * 运行方法：
 * 1. 保存为 verify_api_v2.js
 * 2. 运行: node verify_api_v2.js
 */

// 配置信息
const CONFIG = {
    identityUrl: 'https://iotserver.dabbsson.cn/manager-identity',
    managerUrl: 'https://iotserver.dabbsson.cn/manager',
    user: {
        userName: '2891608692@qq.com',
        password: '123456789',
        productName: 'ManagerIdentity'
    }
};

// 简易请求封装 (使用原生 fetch)
async function post(url, data, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log(`      -> 发送请求...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        let result;
        const text = await response.text();
        try {
            result = JSON.parse(text);
        } catch (e) {
            result = { rawText: text };
        }
        
        return {
            ok: response.ok,
            status: response.status,
            data: result
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            error: error.message
        };
    }
}

async function runTest() {
    console.log('🚀 开始验证 IoT 后端接口 (增强调试版 v4)...\n');

    // --- 第一步：登录 ---
    const loginUrl = `${CONFIG.identityUrl}/api/Login/LoginByPwd`;
    console.log(`1️⃣  尝试登录: ${loginUrl}`);
    
    const loginRes = await post(loginUrl, CONFIG.user);

    const resData = loginRes.data || {};
    const isSuccess = resData.Success === true || resData.success === true;
    const responseData = resData.Data || resData.data;

    if (loginRes.ok && isSuccess) {
        // 尝试多种字段名组合
        const token = responseData?.Access_Token || responseData?.access_token || responseData?.accessToken;
        const userName = responseData?.User_Name || responseData?.userName || responseData?.username || responseData?.NickName || responseData?.nickName;
        
        console.log(`   ✅ 登录成功!`);
        console.log(`   👤 用户: ${userName || '未知 (但登录成功)'}`);
        console.log(`   🔑 Token: ${token ? token.substring(0, 15) + '...' : '未获取到Token'}\n`);
        
        // 调试：如果用户名为 undefined，打印一下所有 Key 看看真正的名字是啥
        if (!userName) {
            console.log('   🔍 [调试] 登录返回的数据字段:', Object.keys(responseData));
        }

        if (token) {
            await fetchDevices(token);
            await fetchProducts(token);
        } else {
            console.error('   ❌ 严重错误: 登录显示成功但没有返回 Token');
        }

    } else {
        console.error(`   ❌ 登录失败: ${resData.Message || resData.message || loginRes.error}`);
    }
}

// 抽取设备获取逻辑
async function fetchDevices(token) {
    const deviceUrl = `${CONFIG.managerUrl}/api/Devices/GetDevices`;
    console.log(`2️⃣  尝试获取设备列表 (中国区): ${deviceUrl}`);
    
    const payload = { 
        pageIndex: 1, 
        pageSize: 5,
        country: 'CN' 
    };
    
    const deviceRes = await post(deviceUrl, payload, token);
    const resData = deviceRes.data || {};
    const isSuccess = resData.Success === true || resData.success === true;
    const list = resData.Data || resData.data || [];

    if (deviceRes.ok && isSuccess) {
        console.log(`   ✅ 设备列表获取成功! 发现 ${list.length} 台设备:`);
        
        if (list.length > 0) {
            // ★★★ 调试关键：打印第一条数据的原始结构，看看到底字段名是啥 ★★★
            console.log('   🔍 [调试] 第一台设备的原始数据结构:', JSON.stringify(list[0]));

            console.table(list.map(d => ({
                // 兼容 PascalCase (大驼峰) 和 camelCase (小驼峰)
                Product: d.ProductName || d.productName,
                UUID: d.UUID || d.uuid,
                Region: d.Country || d.country,
                Online: (d.OnlineStatus !== undefined ? d.OnlineStatus : d.onlineStatus)
            })));
        } else {
            console.log('      (列表为空)');
        }
    } else {
        console.error(`   ❌ 设备获取失败: ${resData.Message || resData.message}`);
    }
    console.log('');
}

// 新增：抽取产品获取逻辑
async function fetchProducts(token) {
    const productUrl = `${CONFIG.managerUrl}/api/Product/GetProducts`;
    console.log(`3️⃣  尝试获取产品列表 (验证备用接口): ${productUrl}`);
    
    const payload = { pageIndex: 1, pageSize: 5 };
    const res = await post(productUrl, payload, token);
    
    const resData = res.data || {};
    const isSuccess = resData.Success === true || resData.success === true;
    const list = resData.Data || resData.data || [];

    if (res.ok && isSuccess) {
        console.log(`   ✅ 产品列表获取成功! 发现 ${list.length} 个产品:`);
        if (list.length > 0) {
            // 兼容大小写
            console.table(list.map(p => ({
                Name: p.ProductName || p.productName,
                ID: p.ProductId || p.productId || p.id,
                Type: p.ProductType || p.productType
            })));
        }
    } else {
        console.error(`   ❌ 产品获取失败: ${resData.Message || resData.message}`);
    }
    console.log('\n🎉 验证结论: 只要看到绿色的“成功”，就说明前端代码也是通的，只是浏览器限制了。');
}

runTest();