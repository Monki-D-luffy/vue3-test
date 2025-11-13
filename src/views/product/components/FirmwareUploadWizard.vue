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

            <el-form-item label="固件文件 (.bin / .hex)" prop="file">
                <el-upload ref="uploadRef" class="upload-demo" drag action="#" :auto-upload="false" :limit="1"
                    accept=".bin,.hex" :on-change="handleFileChange" :on-remove="handleFileRemove"
                    :on-exceed="handleExceed">
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                        拖拽文件到此处 或 <em>点击上传</em>
                        <div class="el-upload__tip">仅支持 .bin 或 .hex 格式文件</div>
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
import { ref, reactive, computed } from 'vue'
import { ElMessage, type FormInstance, type UploadProps, type UploadUserFile, type UploadInstance } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadFirmware } from '@/api'
import type { Product } from '@/types' // 如果路径不对请自行调整，例如 '@/api'

const props = defineProps<{
    modelValue: boolean
    product: Product
}>()

const emit = defineEmits(['update:modelValue', 'success'])

// --- 状态 ---
const uploading = ref(false)
const formRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>() // ✨ 获取 upload 实例引用
const hasFile = ref(false)

const form = reactive({
    version: '',
    releaseNotes: ''
})

const rules = {
    version: [
        { required: true, message: '请输入版本号', trigger: 'blur' },
        { pattern: /^\d+\.\d+\.\d+$/, message: '格式需为 x.y.z (如 1.0.0)', trigger: 'blur' }
    ],
    releaseNotes: [
        { required: true, message: '请输入发布说明', trigger: 'blur' }
    ]
}

const visible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

// --- ✨ 核心修复: 文件校验逻辑 ---
const handleFileChange: UploadProps['onChange'] = (file, fileList) => {
    // 1. 获取文件名后缀
    const fileName = file.name
    const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
    const isAllowed = fileExt === '.bin' || fileExt === '.hex'

    // 2. 校验失败处理
    if (!isAllowed) {
        ElMessage.error('文件格式错误！仅支持 .bin 或 .hex 文件')
        // 移除错误文件
        uploadRef.value!.clearFiles()
        hasFile.value = false
        return
    }

    // 3. 校验通过
    hasFile.value = true
    // 可以在这里读取 file.raw 进行进一步处理
}

const handleFileRemove = () => {
    hasFile.value = false
}

// 处理文件超出限制（覆盖上一个）
const handleExceed: UploadProps['onExceed'] = (files) => {
    uploadRef.value!.clearFiles()
    const file = files[0] as any
    uploadRef.value!.handleStart(file)
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
                await new Promise(resolve => setTimeout(resolve, 1000))

                await uploadFirmware({
                    productId: props.product.id,
                    version: form.version,
                    releaseNotes: form.releaseNotes
                })

                ElMessage.success('固件上传成功！')
                emit('success')
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
    form.version = ''
    form.releaseNotes = ''
    hasFile.value = false
    if (uploadRef.value) {
        uploadRef.value.clearFiles()
    }
}
</script>

<style scoped>
.el-upload__tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>