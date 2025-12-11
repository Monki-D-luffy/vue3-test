<template>
    <div class="page-container">
        <PageMainHeader title="系统设置" subtitle="配置平台基础参数、通知服务与安全策略" />

        <div class="card-base setting-card">
            <el-tabs v-model="activeTab" class="system-tabs">

                <el-tab-pane label="基础设置" name="basic">
                    <div class="tab-content">
                        <h3 class="section-title">平台信息</h3>
                        <el-form label-position="top" class="setting-form">
                            <el-form-item label="平台名称">
                                <el-input v-model="form.siteName" />
                            </el-form-item>
                            <el-form-item label="管理员邮箱">
                                <el-input v-model="form.adminEmail" />
                            </el-form-item>
                            <el-button type="primary">保存更改</el-button>
                        </el-form>
                    </div>
                </el-tab-pane>

                <el-tab-pane label="通知服务" name="notification">
                    <div class="tab-content">
                        <el-empty description="邮件与短信服务配置开发中..." />
                    </div>
                </el-tab-pane>

                <el-tab-pane label="访问控制" name="security">
                    <div class="tab-content">
                        <el-empty description="IP 白名单与 API 密钥管理" />
                    </div>
                </el-tab-pane>

            </el-tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import PageMainHeader from '@/components/PageMainHeader.vue'

const activeTab = ref('basic')
const form = reactive({
    siteName: 'IoT Device Manager',
    adminEmail: 'admin@example.com'
})
</script>

<style scoped>
.page-container {
    /* 保证底部留白 */
    padding-bottom: 40px;
}

.setting-card {
    background: var(--app-bg-card);
    min-height: 600px;
    /* 给一个最小高度，防止内容太少时卡片太扁 */
    padding: 10px 0;
    /* Tabs 风格特殊，上下留白，左右贴边 */
}

/* --- 定制 Tabs 样式 --- */
/* 让 Tabs 头部贴合卡片内边距 */
:deep(.el-tabs__header) {
    padding: 0 24px;
    margin-bottom: 24px;
}

:deep(.el-tabs__item) {
    font-size: 15px;
    height: 48px;
    line-height: 48px;
    color: var(--app-text-sub);
}

:deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    font-weight: 600;
}

/* 内容区域缩进 */
.tab-content {
    padding: 0 24px 24px 24px;
    max-width: 800px;
    /* 设置最大宽度，防止在大屏上表单拉太长难看 */
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--app-text-main);
    border-left: 4px solid var(--el-color-primary);
    padding-left: 10px;
}
</style>