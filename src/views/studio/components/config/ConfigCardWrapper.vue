<template>
    <div class="config-container">
        <div class="page-header">
            <div>
                <h2 class="page-title">产品智能配置</h2>
                <p class="page-desc">
                    配置产品的云端逻辑与交互表现。已启用
                    <span class="highlight-num">{{ activeCount }}</span> / {{ configCards.length }} 个模块
                </p>
            </div>
            <div class="header-actions">
                <el-button round>重置默认</el-button>
                <el-button type="primary" color="#1f1f1f" class="gold-btn">预览面板</el-button>
            </div>
        </div>

        <el-row :gutter="20">
            <el-col v-for="item in configCards" :key="item.id" :xs="24" :sm="12" :md="12" :lg="8" :xl="8">
                <div class="standard-card hover-effect" :class="{ 'is-selected': item.isActive }"
                    @click="openDetail(item)">
                    <div class="card-body">
                        <div class="icon-wrapper">
                            <el-icon :size="24" :color="item.isActive ? '#ffd700' : '#fff'">
                                <component :is="item.icon" />
                            </el-icon>
                        </div>

                        <div class="content-wrapper">
                            <div class="card-header-row">
                                <h3 class="card-title">{{ item.title }}</h3>
                            </div>
                            <p class="card-desc">{{ item.desc }}</p>

                            <div class="tags-row">
                                <el-tag v-for="tag in item.tags" :key="tag" size="small" class="black-gold-tag">
                                    {{ tag }}
                                </el-tag>
                            </div>
                        </div>

                        <div class="switch-wrapper" @click.stop>
                            <el-switch v-model="item.isActive" inline-prompt active-text="ON" inactive-text="OFF"
                                class="gold-switch" />
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <el-drawer v-model="drawerVisible" :show-close="false" size="480px" class="black-gold-drawer">
            <template #header="{ close, titleId, titleClass }">
                <div class="drawer-header-custom">
                    <div class="drawer-title-area">
                        <el-icon :size="20" color="#ffd700" style="margin-right: 8px">
                            <component :is="currentConfig?.icon" />
                        </el-icon>
                        <span class="drawer-title">{{ currentConfig?.title || '配置详情' }}</span>
                    </div>
                    <el-button circle icon="Close" class="close-btn" @click="close" />
                </div>
            </template>

            <div class="drawer-content">
                <div class="info-block">
                    <h4 class="section-title">功能状态</h4>
                    <div class="status-panel" :class="{ 'is-active': currentConfig?.isActive }">
                        <span>当前模块状态：{{ currentConfig?.isActive ? '已启用' : '未启用' }}</span>
                        <el-switch v-model="currentConfig!.isActive" class="gold-switch" />
                    </div>
                </div>

                <div class="info-block">
                    <h4 class="section-title">基础配置</h4>
                    <el-form label-position="top">
                        <el-form-item label="配置名称">
                            <el-input v-model="mockFormData.name" placeholder="请输入配置名称" />
                        </el-form-item>
                        <el-form-item label="描述信息">
                            <el-input v-model="mockFormData.desc" type="textarea" :rows="3" placeholder="请输入描述" />
                        </el-form-item>
                    </el-form>
                </div>

                <div class="info-block">
                    <h4 class="section-title">高级参数</h4>
                    <el-alert title="此配置将影响设备端行为，请谨慎修改。" type="warning" :closable="false" show-icon
                        style="margin-bottom: 16px; background: #fffbf0; color: #8a6d3b;" />
                    <div class="mock-param-row">
                        <span>参数同步策略</span>
                        <el-radio-group v-model="mockFormData.strategy">
                            <el-radio value="instant">实时</el-radio>
                            <el-radio value="lazy">懒加载</el-radio>
                        </el-radio-group>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="drawer-footer">
                    <el-button @click="drawerVisible = false">取消</el-button>
                    <el-button type="primary" class="gold-btn-solid" @click="saveConfig">保存变更</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, reactive } from 'vue'
import {
    Notebook, Connection, Timer, Share, Upload, Bell, Close
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// --- 数据定义 ---
interface ConfigItem {
    id: number
    title: string
    desc: string
    icon: any
    tags: string[]
    isActive: boolean
}

const configCards = ref<ConfigItem[]>([
    { id: 1, title: '多语言 (I18N)', desc: '托管 App 端的文案翻译，支持 AI 补全。', icon: markRaw(Notebook), tags: ['标准', '高级'], isActive: true },
    { id: 2, title: '配网引导', desc: '自定义设备配网时的图文引导与排查。', icon: markRaw(Connection), tags: ['网关', 'App'], isActive: true },
    { id: 3, title: '云端定时', desc: '无硬件 RTC，通过云端下发指令实现定时。', icon: markRaw(Timer), tags: ['云端', '低功耗'], isActive: false },
    { id: 4, title: '场景联动', desc: '定义设备作为条件或动作时的自动化规则。', icon: markRaw(Share), tags: ['点对点', '群控'], isActive: false },
    { id: 5, title: '固件升级 (OTA)', desc: '配置自动升级策略、升级文案及灰度推送。', icon: markRaw(Upload), tags: ['组件', '无感'], isActive: true },
    { id: 6, title: '告警配置', desc: '设置设备离线、数值越界等异常推送通知。', icon: markRaw(Bell), tags: ['短信', '电话'], isActive: false }
])

const activeCount = computed(() => configCards.value.filter(c => c.isActive).length)

// --- 抽屉逻辑 ---
const drawerVisible = ref(false)
const currentConfig = ref<ConfigItem | null>(null)
// 模拟表单数据
const mockFormData = reactive({
    name: '',
    desc: '',
    strategy: 'instant'
})

const openDetail = (item: ConfigItem) => {
    currentConfig.value = item
    // 模拟回填数据
    mockFormData.name = item.title + ' 配置集'
    mockFormData.desc = item.desc
    drawerVisible.value = true
}

const saveConfig = () => {
    ElMessage.success({
        message: '配置已保存',
        type: 'success',
        offset: 60,
    })
    drawerVisible.value = false
}
</script>

<style scoped>
/* --- 全局容器 --- */
.config-container {
    background-color: var(--bg-canvas, #f5f7fa);
    min-height: 100vh;
    padding: 24px;
}

/* --- 头部 --- */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 8px;
}

.page-desc {
    color: #606266;
    font-size: 14px;
}

.highlight-num {
    color: #d4af37;
    font-weight: bold;
    font-size: 16px;
}

.gold-btn {
    border: 1px solid #000;
    color: #d4af37 !important;
    background-color: #000 !important;
}

/* --- 卡片样式 (Modern Luxury Minimalist) --- */
.standard-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid #e4e7ed;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.standard-card:hover,
.standard-card.is-selected {
    border-color: #000000;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-body {
    display: flex;
    align-items: flex-start;
    gap: 16px;
}

.icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: #1f1f1f;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.content-wrapper {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.4;
}

.card-desc {
    font-size: 13px;
    color: #606266;
    margin: 0;
    line-height: 1.5;
    height: 40px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.tags-row {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

/* Tag 样式 */
:deep(.black-gold-tag) {
    background-color: #f4f4f5;
    border-color: #e9e9eb;
    color: #909399;
    border-radius: 4px;
}

.is-selected :deep(.black-gold-tag) {
    background-color: #000000;
    border-color: #000000;
    color: #d4af37;
}

/* 开关 */
.switch-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
    padding-left: 10px;
    align-self: center;
}

:deep(.gold-switch.el-switch) {
    --el-switch-on-color: #d4af37;
    --el-switch-off-color: #dcdfe6;
}

/* --- 抽屉样式深度定制 --- */
:deep(.black-gold-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 0;
    /* 移除默认内边距 */
    background: #1f1f1f;
    /* 黑头 */
    color: #fff;
}

:deep(.black-gold-drawer .el-drawer__body) {
    padding: 0;
}

:deep(.black-gold-drawer .el-drawer__footer) {
    border-top: 1px solid #f0f0f0;
    padding: 20px;
}

/* 自定义 Header */
.drawer-header-custom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: #1f1f1f;
    color: #fff;
}

.drawer-title-area {
    display: flex;
    align-items: center;
}

.drawer-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5px;
}

.close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #ffd700;
}

/* 抽屉内容区 */
.drawer-content {
    padding: 24px;
}

.info-block {
    margin-bottom: 32px;
}

.section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 16px;
    border-left: 3px solid #d4af37;
    padding-left: 8px;
}

/* 状态面板 */
.status-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    background: #f9f9f9;
    border: 1px solid #e4e7ed;
}

.status-panel.is-active {
    background: #fffdf0;
    border-color: #d4af37;
}

/* 模拟参数行 */
.mock-param-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
}

/* 抽屉底部按钮 */
.gold-btn-solid {
    background-color: #1f1f1f !important;
    border-color: #1f1f1f !important;
    color: #d4af37 !important;
    font-weight: 600;
}

.gold-btn-solid:hover {
    background-color: #000 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>