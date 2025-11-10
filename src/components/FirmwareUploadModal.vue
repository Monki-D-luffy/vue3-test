<template>
    <el-dialog v-model="visible" title="上传新固件" width="500px" :before-close="handleCancel">
        <el-form :model="form" label-width="80px" ref="formRef">
            <el-form-item label="固件版本" prop="version">
                <el-input v-model="form.version" placeholder="例如: 1.2.0" />
            </el-form-item>

            <el-form-item label="适用产品" prop="productId">
                <el-select v-model="form.productId" placeholder="请选择产品" style="width: 100%">
                    <el-option v-for="product in products" :key="product.id" :label="product.name"
                        :value="product.id" />
                </el-select>
            </el-form-item>

            <el-form-item label="发布说明" prop="releaseNotes">
                <el-input v-model="form.releaseNotes" type="textarea" :rows="4" placeholder="请输入此固件的更新内容..." />
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="isUploading">
                    确定上传
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import type { FirmwareUploadData, Product } from '@/api/index'
import type { FormInstance } from 'element-plus'

// 定义 Props
const props = defineProps({
    // v-model (控制显示/隐藏)
    modelValue: {
        type: Boolean,
        default: false
    },
    // v-model:form (双向绑定表单数据)
    formValue: {
        type: Object as PropType<FirmwareUploadData>,
        required: true
    },
    // 产品列表 (用于下拉)
    products: {
        type: Array as PropType<Product[]>,
        default: () => []
    },
    // 上传中的加载状态
    isUploading: {
        type: Boolean,
        default: false
    }
})

// 定义 Emits
const emit = defineEmits([
    'update:modelValue',
    'update:formValue',
    'submit'
])

const formRef = ref<FormInstance>()

// 使用 computed 来实现 v-model
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// 使用 computed 来实现 v-model:form
// 注意：这里我们是对一个对象进行双向绑定
const form = computed({
    get: () => props.formValue,
    set: (value) => emit('update:formValue', value)
})

// 处理取消
const handleCancel = () => {
    if (props.isUploading) return // 上传中不允许关闭
    visible.value = false
}

// 处理提交
const handleSubmit = () => {
    // 可以在这里加一个简单的表单校验
    formRef.value?.validate((valid) => {
        if (valid) {
            emit('submit') // 通知父组件执行提交
        } else {
            console.log('表单校验失败')
        }
    })
}
</script>

<style scoped>
/* 可以在这里添加局部样式 */
</style>