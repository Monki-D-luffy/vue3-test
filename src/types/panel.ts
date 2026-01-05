// src/types/panel.ts

// 1. 支持的组件类型枚举
export type ComponentType = 'Text' | 'Image' | 'Switch' | 'Slider' | 'Button' | 'Dashboard' | 'EnumSelector';

// 2. 组件元数据 (左侧物料堆使用)
export interface ComponentMeta {
    type: ComponentType;
    name: string;
    icon: string; // Iconify 图标 ID
    defaultProps: Record<string, any>; // 拖入时的默认样式/属性
}

// 3. 组件实例 (中间画布使用)
export interface PanelComponent {
    id: string;        // 唯一实例 ID (e.g., "switch_x9z2")
    type: ComponentType;
    name: string;

    // 样式属性 (所见即所得的核心)
    style: {
        width?: number | string;
        height?: number;
        fontSize?: number;
        color?: string;
        background?: string;
        radius?: number;
        [key: string]: any;
    };

    // 数据绑定 (Step 1 <-> Step 2 的桥梁)
    binding?: {
        dpId?: number;   // 绑定的 DP ID
        bindType?: string;
    };
}

// 4. 物料库清单 (左侧列表的数据源)
export const COMPONENT_LIBRARY: Record<string, ComponentMeta[]> = {
    basic: [
        {
            type: 'Text',
            name: '文本',
            icon: 'ri:text-spacing',
            defaultProps: { fontSize: 16, color: '#1a1a1a', text: '文本内容', align: 'left' }
        },
        {
            type: 'Button',
            name: '按钮',
            icon: 'ri:cursor-line',
            defaultProps: { text: '点击执行', background: '#1a1a1a', color: '#fff', radius: 8 }
        },
    ],
    control: [
        {
            type: 'Switch',
            name: '开关',
            icon: 'ri:toggle-line',
            defaultProps: { activeColor: '#1a1a1a', inactiveColor: '#e2e8f0' }
        },
        {
            type: 'Slider',
            name: '滑块',
            icon: 'ri:equalizer-line',
            defaultProps: { min: 0, max: 100, activeColor: '#1a1a1a', trackColor: '#e2e8f0' }
        },
        {
            type: 'EnumSelector',
            name: '模式选择',
            icon: 'ri:function-line',
            defaultProps: {
                layout: 'segmented', // 风格：segmented (分段) | grid (网格)
                activeColor: '#1a1a1a',
                options: [ // 默认演示数据
                    { label: '自动', value: 'auto', icon: 'ri:refresh-line' },
                    { label: '睡眠', value: 'sleep', icon: 'ri:moon-line' },
                    { label: '强劲', value: 'strong', icon: 'ri:flashlight-line' }
                ]
            }
        },
    ],
    sensor: [
        {
            type: 'Dashboard',
            name: '仪表盘',
            icon: 'ri:speed-mini-fill',
            defaultProps: { min: 0, max: 100, unit: '℃', color: '#1a1a1a' }
        },
    ]
};