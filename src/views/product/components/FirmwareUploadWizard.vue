<template>
    <el-dialog v-model="visible" :title="`上传固件 - ${product?.name}`" width="500px" :before-close="handleClose">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" label-position="top">

            <el-alert :title="`当前正在为 [${product?.name}] 上传固件，请确保文件匹配。`" type="info" :closable="false" show-icon
                style="margin-bottom: 20px;" />

            <el-form-item label="固件版本 (SemVer)" prop="version">
                <el-input v-model="form.version" placeholder="例如: 1.2.0" />
            </el-form-item>

            <el-form-item label="发布说明 / 更新日志" prop="releaseNotes">
                <el-input v-model="form.releaseNotes" type="textarea" :rows="4" placeholder="请输入修复的Bug或新增功能..." />
            </el-form-item>

            <el-form-item label="固件文件 (.bin)" prop="file">
                <el-upload class="upload-demo" drag action="#" :auto-upload="false" :limit="1"
                    :on-change="handleFileChange" :on-remove="handleFileRemove">
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        拖拽文件到此处 或 <em>点击上传</em>
                    </div>
                </el-upload>
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" :loading="uploading" @click="submitUpload">
                    确认上传
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadFirmware } from '@/api'
import type { Product } from '@/types'

const props = defineProps<{
    modelValue: boolean
    product: Product
}>()

const emit = defineEmits(['update:modelValue', 'success'])

// --- 状态 ---
const uploading = ref(false)
const formRef = ref<FormInstance>()
const hasFile = ref(false)

const form = reactive({
    version: '',
    releaseNotes: ''
})

// 简单的版本号正则
const rules = {
    version: [
        { required: true, message: '请输入版本号', trigger: 'blur' },
        { pattern: /^\d+\.\d+\.\d+$/, message: '格式需为 x.y.z (如 1.0.0)', trigger: 'blur' }
    ],
    releaseNotes: [
        { required: true, message: '请输入发布说明', trigger: 'blur' }
    ]
}

// --- 计算属性实现 v-model ---
const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// --- 文件处理 (模拟) ---
const handleFileChange = (file: any) => {
    hasFile.value = true
    // 实际项目中这里会处理 file.raw
}
const handleFileRemove = () => {
    hasFile.value = false
}

// --- 提交 ---
const submitUpload = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            if (!hasFile.value) {
                ElMessage.warning('请选择固件文件')
                return
            }

            uploading.value = true
            try {
                // 模拟上传延迟
                await new Promise(resolve => setTimeout(resolve, 1000))

                await uploadFirmware({
                    productId: props.product.id,
                    version: form.version,
                    releaseNotes: form.releaseNotes
                })

                ElMessage.success('固件上传成功！')
                emit('success') // 通知父组件刷新列表
                handleClose()
            } catch (error) {
                console.error(error)
            } finally {
                uploading.value = false
            }
        }
    })
}

const handleClose = () => {
    if (uploading.value) return
    visible.value = false
    // 重置表单
    form.version = ''
    form.releaseNotes = ''
    hasFile.value = false
}
</script>