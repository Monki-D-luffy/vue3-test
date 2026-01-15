/**
 * src/api/types/auth.ts
 * 认证相关的类型定义
 */

// 1. 登录参数 (POST /api/Login/LoginByPwd)
export interface LoginParams {
    userName: string;     // 用户名/邮箱
    password: string;     // 密码
    productName: string;  // 必填，固定为 'ManagerIdentity'
}

// 2. 刷新 Token 参数
export interface RefreshTokenParams {
    refreshToken: string; // 旧的刷新令牌
}

// 3. 登录/刷新 返回的有效载荷 (Data 部分)
// 为了兼容后端可能返回的 PascalCase (Access_Token) 或 camelCase
export interface LoginResult {
    // --- 核心令牌 ---
    accessToken?: string;
    Access_Token?: string; // 兼容后端 C# 风格
    token?: string;

    refreshToken?: string;
    Refresh_Token?: string; // 兼容后端 C# 风格

    // --- 有效期 ---
    expiresIn?: number;
    Expires_In?: number;

    // --- 用户信息 (根据 verify_api_v2.js 观察到的字段) ---
    userId?: string;
    User_Id?: string;

    userName?: string;
    User_Name?: string;

    nickName?: string;
    NickName?: string;

    avatar?: string;
}

// 4. 注册参数 (如果需要)
export interface RegisterParams {
    userName: string;
    password: string;
    confirmPassword?: string;
    nickName?: string;
    phoneNumber?: string;
    email?: string;
}