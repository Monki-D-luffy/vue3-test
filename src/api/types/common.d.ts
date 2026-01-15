export interface ApiResponse<T = any> {
    code: number;
    message: string;
    success: boolean;
    data: T;
    total?: number; // 兼容某些直接返回 total 的接口
}

export interface PaginationResult<T> {
    items: T[];
    total: number;
}