// src/constants/device.ts

/**
 * 设备列表导出列定义
 * 将这些静态数据从组件中移除，保持组件整洁
 */
export const DEVICE_EXPORT_COLUMNS = [
    { label: '设备名称', key: 'name' },
    { label: '设备SN', key: 'sn' },
    { label: '产品名称', key: 'productName' },
    { label: '数据中心', key: 'dataCenter' },
    { label: '状态', key: 'status' },
    { label: '固件版本', key: 'firmwareVersion' },
    { label: '激活时间', key: 'gmtActive' },
    { label: '最后在线', key: 'gmtLastOnline' }
]