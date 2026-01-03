<template>
  <el-container class="studio-layout">
    <el-header class="studio-header">

      <div class="header-section left">
        <el-button link class="back-btn" @click="goBack">
          <el-icon :size="20">
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div class="divider"></div>
        <div class="product-info">
          <div class="product-icon">
            <el-icon>
              <files />
            </el-icon>
          </div>
          <div class="info-text">
            <span class="product-name">智能空气净化器 Pro</span>
            <el-tag size="small" type="info" effect="plain" class="pid-tag">PID: x8s9d7</el-tag>
          </div>
        </div>
      </div>

      <div class="header-section center">
        <div class="stepper-container">
          <div v-for="(step, index) in steps" :key="step.key" class="nav-step" :class="{
            'is-active': activeIndex === index,
            'is-finished': activeIndex > index,
            'is-next': activeIndex < index
          }" @click="handleStepClick(step)">
            <div class="step-indicator">
              <el-icon v-if="activeIndex > index" class="icon-finished"><Select /></el-icon>
              <span v-else class="step-num">{{ index + 1 }}</span>
            </div>
            <span class="step-label">{{ step.label }}</span>

            <div v-if="index < steps.length - 1" class="step-line"></div>
          </div>
        </div>
      </div>

      <div class="header-section right">
        <el-button-group>
          <el-button plain size="default">
            <el-icon class="el-icon--left">
              <Document />
            </el-icon>
            草稿
          </el-button>
          <el-button type="primary" color="#000" size="default">
            <el-icon class="el-icon--left">
              <Promotion />
            </el-icon>
            发布
          </el-button>
        </el-button-group>

        <div class="divider"></div>

        <el-dropdown trigger="click">
          <span class="user-avatar">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>帮助文档</el-dropdown-item>
              <el-dropdown-item divided>退出工作台</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-main class="studio-canvas">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ArrowLeft, Files, Document, Promotion, Select
} from '@element-plus/icons-vue';

// --- State ---
const router = useRouter();
const route = useRoute();

// --- Configuration ---
const steps = [
  { key: 'define', label: '功能定义', route: 'ProductFunction' },
  { key: 'panel', label: '面板设计', route: 'ProductPanel' },
  { key: 'hardware', label: '硬件开发', route: 'ProductHardware' },
  { key: 'config', label: '产品配置', route: 'ProductConfig' },
  { key: 'test', label: '测试发布', route: 'ProductTest' }
];

// --- Computed ---
// 根据当前路由名称计算 Active Index
const activeIndex = computed(() => {
  const index = steps.findIndex(s => s.route === route.name);
  return index !== -1 ? index : 0;
});

// --- Actions ---
const goBack = () => {
  router.push('/products');
};

const handleStepClick = (step: any) => {
  // 核心修复：允许点击跳转
  router.push({ name: step.route });
  console.log('Navigating to:', step.label);
};

</script>

<style scoped>
/* Studio Layout CSS 
  Design Token Mapping:
  --bg-canvas: #f5f7fa
  --bg-card: #ffffff
  --border-base: #e4e7ed
  --text-primary: #303133
  --color-primary: var(--el-color-primary)
*/

.studio-layout {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-canvas, #f5f7fa);
  display: flex;
  flex-direction: column;
}

/* --- Header Styles --- */
.studio-header {
  height: 64px;
  /* 紧凑高度 */
  background-color: var(--bg-card, #ffffff);
  border-bottom: 1px solid var(--border-base, #e4e7ed);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  z-index: 10;
}

.header-section {
  display: flex;
  align-items: center;
}

.header-section.left {
  width: 280px;
  /* 固定宽度，防止挤压中间 */
}

.header-section.center {
  flex: 1;
  justify-content: center;
}

.header-section.right {
  width: 280px;
  /* 固定宽度，对称 */
  justify-content: flex-end;
  gap: 16px;
}

/* Back & Product Info */
.back-btn {
  color: var(--text-secondary, #909399);
  padding: 0;
}

.back-btn:hover {
  color: var(--el-color-primary);
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--border-base, #e4e7ed);
  margin: 0 16px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-icon {
  width: 32px;
  height: 32px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.pid-tag {
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  margin-top: 2px;
  border: none;
  background-color: var(--bg-canvas);
}

/* --- Stepper Navigation (Custom) --- */
.stepper-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-step {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: all 0.2s;
  padding: 6px 12px;
  border-radius: 20px;
}

.nav-step:hover {
  background-color: var(--bg-canvas, #f5f7fa);
}

.step-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--border-base, #e4e7ed);
  color: var(--text-secondary, #909399);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s;
}

.step-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #909399);
  transition: color 0.3s;
}

.step-line {
  width: 32px;
  height: 2px;
  background-color: var(--border-base, #ebedf0);
  margin-left: 12px;
  margin-right: 4px;
}

/* Active State */
.nav-step.is-active .step-indicator {
  background-color: var(--el-color-primary);
  color: white;
  box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.4);
}

.nav-step.is-active .step-label {
  color: var(--text-primary, #303133);
  font-weight: 600;
}

/* Finished State */
.nav-step.is-finished .step-indicator {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border: 1px solid var(--el-color-success-light-5);
}

.nav-step.is-finished .step-label {
  color: var(--text-primary, #303133);
}

.nav-step.is-finished+.nav-step .step-indicator {
  /* Next step logic if needed */
}

/* User Avatar */
.user-avatar {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 50%;
  transition: border-color 0.2s;
}

.user-avatar:hover {
  border-color: var(--el-color-primary-light-5);
}

/* --- Main Canvas --- */
.studio-canvas {
  padding: 0;
  /* Let children handle padding for full-bleed flexibility */
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 64px);
}

/* Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
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