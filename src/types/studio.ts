// src/types/studio.d.ts

// ==========================================
// Studio 相关类型定义
// ==========================================

// 功能点 (Data Point) 定义
export interface DataPoint {
  id: string;
  code: string; // 标识符，如 "switch_led"
  name: string; // 显示名称，如 "LED开关"
  dataType: DataPointType;
  direction: 'input' | 'output'; // 传输方向
  description?: string;
  unit?: string; // 单位，如 "°C", "%"
  min?: number; // 数值类型的最小值
  max?: number; // 数值类型的最小值
  step?: number; // 数值类型的步长
  enumValues?: Array<{value: any, description: string}>; // 枚举值
  defaultValue?: any; // 默认值
}

// 数据点类型
export type DataPointType = 'boolean' | 'integer' | 'float' | 'enum' | 'string' | 'binary';

// 面板配置
export interface PanelConfig {
  theme: PanelTheme;
  components: PanelComponent[];
  layout: PanelLayout;
}

// 面板主题
export interface PanelTheme {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: 'small' | 'medium' | 'large';
}

// 面板组件
export interface PanelComponent {
  id: string;
  type: PanelComponentType;
  dataPointId: string; // 关联的功能点ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: PanelComponentStyle;
  config: any; // 组件特有配置
}

// 面板组件类型
export type PanelComponentType =
  | 'switch'
  | 'slider'
  | 'button'
  | 'text'
  | 'progress'
  | 'chart'
  | 'image'
  | 'color_picker';

// 面板组件样式
export interface PanelComponentStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadow?: boolean;
}

// 面板布局
export interface PanelLayout {
  width: number; // 手机宽度
  height: number; // 手机高度
  backgroundImage?: string;
  gridSize: number; // 网格大小
  snapToGrid: boolean; // 是否吸附到网格
}

// 硬件模组
export interface HardwareModule {
  id: string;
  name: string;
  type: 'wifi' | 'zigbee' | 'bluetooth' | 'cellular';
  manufacturer: string;
  chipModel: string;
  flashSize: number; // KB
  ramSize: number; // KB
  gpioCount: number;
  adcCount: number;
  pwmCount: number;
  price: number;
  description: string;
  recommendedFor: string[]; // 推荐用途
  resourceUsage: {
    flash: number; // 预估占用flash大小
    ram: number;   // 预估占用ram大小
  };
}

// 固件配置
export interface FirmwareConfig {
  id: string;
  name: string;
  version: string;
  productId: string;
  moduleId: string;
  features: string[]; // 支持的功能列表
  fileSize: number;
  checksum: string;
  downloadUrl: string;
  compileTime: string;
  notes: string;
}

// 多语言配置
export interface I18nConfig {
  defaultLanguage: string;
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
  translations: Record<string, Record<string, string>>; // language -> key -> value
}

// 告警配置
export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // 冷却时间（秒）
}

// 告警条件
export interface AlertCondition {
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'between' | 'contains';
  dataPointId: string;
  value: any;
  value2?: any; // 用于between操作符
}

// 测试用例
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated';
  category: 'functional' | 'performance' | 'security' | 'compatibility';
  steps: TestStep[];
  expectedResult: string;
  timeout: number; // 超时时间（秒）
  dataPoints: string[]; // 涉及的功能点
}

// 测试步骤
export interface TestStep {
  id: string;
  action: string;
  description: string;
  expectedValue?: any;
  delay?: number; // 执行前的延迟（毫秒）
}

// 测试结果
export interface TestResult {
  testCaseId: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration: number; // 执行时间（毫秒）
  errorMessage?: string;
  actualValue?: any;
  expectedValue?: any;
  logs: string[];
  timestamp: string;
}

// 测试报告
export interface TestReport {
  id: string;
  productId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number;
  duration: number;
  results: TestResult[];
  generatedAt: string;
  recommendations: string[];
}

// Studio 步骤状态
export interface StudioStepState {
  step: number;
  completed: boolean;
  data: any; // 步骤特有的数据
  validated: boolean;
  lastModified: string;
}

// 产品开发状态
export interface ProductDevState {
  id: string;
  productId: string;
  currentStep: number;
  steps: Record<number, StudioStepState>;
  createdAt: string;
  updatedAt: string;
}

// AI 对话消息
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
  };
}

// 调试日志
export interface DebugLog {
  id: string;
  type: 'serial' | 'virtual' | 'ai';
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source?: string;
  data?: any;
}

// 代码生成配置
export interface CodeGenConfig {
  language: 'c' | 'cpp' | 'python' | 'javascript';
  framework?: string;
  includeComments: boolean;
  optimizeForSize: boolean;
  targetPlatform: string;
}

// 生成的代码
export interface GeneratedCode {
  id: string;
  type: 'header' | 'source' | 'config' | 'makefile';
  language: string;
  filename: string;
  content: string;
  generatedAt: string;
  checksum: string;
}

// 产品发布配置
export interface PublishConfig {
  version: string;
  releaseNotes: string;
  targetPlatforms: string[];
  visibility: 'private' | 'public' | 'beta';
  autoUpdate: boolean;
  requireApproval: boolean;
  supportContact: string;
}

// 发布记录
export interface PublishRecord {
  id: string;
  productId: string;
  version: string;
  status: 'draft' | 'reviewing' | 'published' | 'rejected';
  config: PublishConfig;
  publishedAt?: string;
  publishedBy?: string;
  downloadCount: number;
  feedbackCount: number;
}

// 配网配置
export interface NetworkConfig {
  protocols: Array<{
    type: 'wifi' | 'bluetooth' | 'zigbee' | 'cellular';
    enabled: boolean;
    config: any;
  }>;
  timeout: number;
  retryCount: number;
  security: 'none' | 'wpa2' | 'wpa3';
  guides: Array<{
    language: string;
    title: string;
    content: string;
    images: string[];
  }>;
}

// 统计数据
export interface StudioStats {
  totalProducts: number;
  activeProjects: number;
  completedProjects: number;
  averageDevTime: number;
  popularModules: Array<{
    moduleId: string;
    name: string;
    usageCount: number;
  }>;
  recentActivity: Array<{
    type: 'create' | 'update' | 'publish' | 'test';
    productId: string;
    productName: string;
    timestamp: string;
  }>;
}
