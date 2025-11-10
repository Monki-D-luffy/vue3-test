<template>
    <div class="product-management-view">
        <el-tabs v-model="activeTab" class="page-tabs">
            <el-tab-pane label="产品列表" name="productList">
                <div class="tab-content">
                    <el-empty description="产品列表待实现" />
                </div>
            </el-tab-pane>

            <el-tab-pane label="固件管理" name="firmwareManagement">
                <div class="tab-content">
                    <div class="toolbar">
                        <el-button type="primary" @click="openUploadDialog">
                            <el-icon>
                                <Upload />
                            </el-icon>
                            上传固件
                        </el-button>
                    </div>

                    <FirmwareList :firmwares="firmwares" :is-loading="isLoading" :pagination="pagination"
                        @page-change="handlePageChange" />
                </div>
            </el-tab-pane>
        </el-tabs>

        <FirmwareUploadModal v-model="uploadModalVisible" v-model:formValue="uploadForm" :products="products"
            :is-uploading="isUploading" @submit="handleUpload" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { useRouter } from 'vue-router' // 你原有的，暂时没用到
import { Upload } from '@element-plus/icons-vue'

// 导入我们新建的 composable 和 components
import { useFirmwareManagement } from '@/composables/useFirmwareManagement'
import FirmwareList from '@/components/FirmwareList.vue'
import FirmwareUploadModal from '@/components/FirmwareUploadModal.vue'

const activeTab = ref('productList')

// 1. 核心逻辑：从 composable 中解构所有状态和方法
const {
    firmwares,
    products,
    isLoading,
    isUploading,
    pagination,
    uploadModalVisible,
    uploadForm,
    getFirmwares,
    handlePageChange,
    openUploadDialog,
    handleUpload
} = useFirmwareManagement()

// 2. 在组件挂载时，自动加载第一页数据
onMounted(() => {
    // 我们只在 '固件管理' 标签页下加载数据
    // (如果你希望它预加载，也可以直接调用 getFirmwares())
    if (activeTab.value === 'firmwareManagement') {
        getFirmwares(1)
    }
})

// (可选) 监听 tab 切换，仅在首次切换到'固件管理'时加载数据
// watch(activeTab, (newTab) => {
//   if (newTab === 'firmwareManagement' && firmwares.value.length === 0) {
//     getFirmwares(1)
//   }
// })
// 简单起见，我们先用 onMounted，假设用户会自行点击或默认打开
// 修正：我们应该在 onMounted 时就加载，因为用户可能直接进入此页面
onMounted(() => {
    getFirmwares(1)
})
</script>

<style scoped>
.product-management-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
}

/* 让 el-tabs 占据所有可用空间 */
.page-tabs {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
}

/* 让 el-tabs 的内容区域 (el-tab-pane) 
  也能占据剩余空间
*/
:deep(.el-tabs__content) {
    flex: 1;
    height: 0;
    /* 关键：允许 flex: 1 生效 */
}

.el-tab-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.tab-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
}

.toolbar {
    margin-bottom: 16px;
}
</style>