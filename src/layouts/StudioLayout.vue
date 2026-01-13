<template>
  <div class="studio-layout">

    <div class="studio-scroll-area">
      <div class="studio-header-group">
        <div class="header-level-1">
          <div class="left-anchor">
            <el-button link class="back-btn" @click="goBack">
              <el-icon :size="20">
                <ArrowLeft />
              </el-icon>
            </el-button>
            <div class="divider-vertical"></div>
            <div class="product-meta">
              <div class="meta-text">
                <span class="product-name" title="智能空气净化器 Pro Max">
                  智能空气净化器 Pro Max
                </span>
                <div class="meta-sub">
                  <el-tag size="small" type="info" effect="plain" class="pid-tag">PID: {{ route.params.id || 'Unknown'
                    }}</el-tag>
                  <span class="protocol-badge">Wi-Fi + BLE</span>
                </div>
              </div>
            </div>
          </div>

          <div class="right-anchor">
            <el-button link class="help-link">帮助文档</el-button>
            <el-avatar :size="30" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          </div>
        </div>

        <div class="header-level-2">
          <div class="stepper-scroll-container">
            <div class="stepper-wrapper">
              <div v-for="(step, index) in steps" :key="step.key" class="step-item"
                :class="{ 'is-active': activeIndex === index, 'is-finished': activeIndex > index }">
                <div class="step-circle">
                  <el-icon v-if="activeIndex > index"><Select /></el-icon>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="step-title">{{ step.label }}</span>
                <div v-if="index < steps.length - 1" class="step-connector"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main class="studio-body">
        <div class="body-viewport-protection">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <footer class="studio-footer">
      <div class="footer-left">
        <el-button link @click="handleSaveDraft" :loading="store.isLoading">
          <el-icon class="mr-1">
            <Document />
          </el-icon>
          {{ store.isDirty ? '保存草稿 *' : '保存草稿' }}
          <span class="save-time" v-if="store.lastSavedTime">上次保存 {{ store.lastSavedTime }}</span>
        </el-button>
      </div>

      <div class="footer-center">
        <el-button :disabled="activeIndex === 0" @click="handlePrev" plain round>
          上一步
        </el-button>
        <el-button type="primary" color="#1a1a1a" @click="handleNext" round class="next-btn">
          {{ activeIndex === steps.length - 1 ? '完成发布' : '下一步' }}
        </el-button>
      </div>

      <div class="footer-right"></div>
    </footer>

    <el-dialog v-model="releaseDialogVisible" title="确认发布产品" width="500px" align-center destroy-on-close
      class="release-dialog">
      <div class="release-form">
        <el-alert title="发布后，产品将进入正式环境，配置不可随意回滚。" type="warning" show-icon :closable="false" class="mb-4" />

        <el-form :model="releaseForm" label-position="top">
          <el-form-item label="发布版本号 (Version)">
            <el-input v-model="releaseForm.version" placeholder="例如: v1.0.0" />
          </el-form-item>
          <el-form-item label="版本说明 (Release Notes)">
            <el-input v-model="releaseForm.note" type="textarea" :rows="3" placeholder="简要描述本次发布的特性..." />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="releaseDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="store.isLoading" @click="confirmRelease">
            确认发布
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStudioStore } from '@/stores/studioStore'; // ✅ 引入 Store
import { ArrowLeft, Select, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const store = useStudioStore(); // ✅ 初始化 Store

const steps = [
  { key: 'define', label: '功能定义', route: 'ProductFunction' },
  { key: 'panel', label: '面板设计', route: 'ProductPanel' },
  { key: 'hardware', label: '硬件开发', route: 'ProductHardware' },
  { key: 'config', label: '产品配置', route: 'ProductConfig' },
  { key: 'release', label: '产品发布', route: 'ProductRelease' },
];

const activeIndex = computed(() => (route.meta.step as number) || 0);

// --- 初始化逻辑 ---
onMounted(() => {
  // 确保 Store 知道当前的产品 ID
  if (route.params.id) {
    store.initStudio(route.params.id as string);
  }
});

// --- 导航逻辑 ---
const goBack = () => router.push('/products');

const handlePrev = () => {
  if (activeIndex.value > 0) {
    const prev = steps[activeIndex.value - 1];
    if (prev && prev.route) {
      router.push({ name: prev.route as string });
    }
  }
};

// --- ✅ 修复：保存草稿 ---
const handleSaveDraft = async () => {
  await store.saveDraft();
};

// --- ✅ 修复：发布逻辑 ---
const releaseDialogVisible = ref(false);
const releaseForm = reactive({
  version: 'v1.0.0',
  note: ''
});

const handleNext = () => {
  if (activeIndex.value < steps.length - 1) {
    // 正常下一步
    const next = steps[activeIndex.value + 1];
    if (next && next.route) {
      router.push({ name: next.route as string });
    }
  } else {
    // 到了最后一步：弹出发布确认框
    releaseDialogVisible.value = true;
  }
};

const confirmRelease = async () => {
  if (!releaseForm.version) {
    ElMessage.warning('请输入版本号');
    return;
  }

  const success = await store.publishProduct(releaseForm.version, releaseForm.note);
  if (success) {
    releaseDialogVisible.value = false;
    // 发布成功后，跳转回列表页或详情页
    setTimeout(() => {
      router.push('/products');
    }, 1000);
  }
};
</script>

<style scoped>
/* 核心布局逻辑：视口固定操作栏 */
.studio-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f5f7fa;
  overflow: hidden;
}

.studio-scroll-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}

/* --- Header 层 --- */
.studio-header-group {
  flex-shrink: 0;
  background: #fff;
}

.header-level-1 {
  height: 60px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.left-anchor,
.right-anchor {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.product-name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.header-level-2 {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 1100px;
}

.stepper-scroll-container {
  width: 100%;
  padding: 0 24px;
}

.stepper-wrapper {
  display: flex;
  align-items: center;
}

.step-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 8px;
}

.is-active .step-circle {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
}

.is-finished .step-circle {
  background: #e1f3d8;
  color: #67c23a;
  border-color: #67c23a;
}

.step-connector {
  width: 40px;
  height: 1px;
  background: #ebeef5;
  margin: 0 16px;
}

/* --- Body 层 --- */
.studio-body {
  flex: 1;
  background: #f5f7fa;
}

.body-viewport-protection {
  min-width: 1100px;
  padding: 24px;
}

/* --- ✅ Footer 层 --- */
.studio-footer {
  height: 72px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  z-index: 1000;
}

.footer-left,
.footer-right {
  width: 240px;
  flex-shrink: 0;
}

.footer-center {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.mr-1 {
  margin-right: 4px;
}

.save-time {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>