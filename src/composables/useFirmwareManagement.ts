// src/composables/useFirmwareManagement.ts
import { ref, reactive } from 'vue'
import {
    fetchFirmwares,
    fetchProducts,
    uploadFirmware,
    type Firmware,
    type Product,
    type FirmwareUploadData,
    type PaginatedResponse
} from '@/api/index' // 导入我们定义好的 API 函数和类型
import { ElMessage } from 'element-plus'

/**
 * 固件管理页面的所有状态和业务逻辑
 */
export function useFirmwareManagement() {
    // === 状态 (State) ===

    // 固件列表
    const firmwares = ref<Firmware[]>([])
    // 产品列表 (用于上传弹窗的下拉菜单)
    const products = ref<Product[]>([])

    // 页面加载状态
    const isLoading = ref(false)
    const isUploading = ref(false)

    // 分页状态
    const pagination = reactive({
        _page: 1,
        _limit: 10,
        total: 0
    })

    // 上传弹窗的状态
    const uploadModalVisible = ref(false)
    const uploadForm = reactive<FirmwareUploadData>({
        version: '',
        productId: '', // 将由下拉菜单选择
        releaseNotes: ''
    })

    // === 方法 (Methods) ===

    /**
     * 重置上传表单
     */
    const resetUploadForm = () => {
        uploadForm.version = ''
        uploadForm.productId = ''
        uploadForm.releaseNotes = ''
    }

    /**
     * 获取固件列表
     * @param page 要查询的页码
     */
    const getFirmwares = async (page = pagination._page) => {
        isLoading.value = true
        try {
            const params = {
                _page: page,
                _limit: pagination._limit,
                _sort: 'uploadedAt', // 按上传时间倒序
                _order: 'desc'
            }
            const response: PaginatedResponse<Firmware> = await fetchFirmwares(params)

            firmwares.value = response.items
            pagination.total = response.total
            pagination._page = page
        } catch (error) {
            console.error('获取固件列表失败:', error)
            ElMessage.error('获取固件列表失败')
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 获取产品列表 (用于下拉框)
     */
    const getProducts = async () => {
        try {
            // 只有当 products 列表为空时才去请求，避免重复请求
            if (products.value.length === 0) {
                products.value = await fetchProducts()
            }
        } catch (error) {
            console.error('获取产品列表失败:', error)
            ElMessage.error('获取产品列表失败')
        }
    }

    /**
     * 处理分页变化
     * @param newPage 新的页码
     */
    const handlePageChange = (newPage: number) => {
        getFirmwares(newPage)
    }

    /**
     * 打开上传弹窗
     */
    const openUploadDialog = () => {
        resetUploadForm()
        uploadModalVisible.value = true
        getProducts() // 异步加载产品列表
    }

    /**
     * 关闭上传弹窗
     */
    const closeUploadDialog = () => {
        uploadModalVisible.value = false
    }

    /**
     * 处理固件上传
     */
    const handleUpload = async () => {
        // 可以在这里添加表单验证逻辑
        if (!uploadForm.version || !uploadForm.productId) {
            ElMessage.warning('请填写完整的固件信息')
            return
        }

        isUploading.value = true
        try {
            await uploadFirmware(uploadForm)
            ElMessage.success('上传成功')
            closeUploadDialog()
            // 刷新列表并跳转回第一页
            getFirmwares(1)
        } catch (error) {
            console.error('上传固件失败:', error)
            ElMessage.error('上传固件失败')
        } finally {
            isUploading.value = false
        }
    }

    // === 导出 ===
    return {
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
        closeUploadDialog,
        handleUpload
    }
}