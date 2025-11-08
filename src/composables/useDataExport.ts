// src/composables/useDataExport.ts
import { ref } from 'vue'
import api from '@/api'
import { ElMessage, ElLoading } from 'element-plus'

// 定义列的结构
interface ExportColumn {
    label: string // CSV 文件的表头
    key: string   // 对应 data 中的字段
}

export function useDataExport() {
    const isExporting = ref(false)

    /**
     * 将数据（通常是对象数组）转换为 CSV 字符串
     */
    const convertToCSV = (data: any[], columns: ExportColumn[]): string => {
        // 1. 创建表头
        const headers = columns.map(col => col.label)
        let csv = headers.join(',') + '\n'

        // 2. 创建数据行
        data.forEach(row => {
            const rowData = columns.map(col => {
                let value = row[col.key]

                // 简单处理：如果值是 null 或 undefined，转换为空字符串
                if (value === null || value === undefined) {
                    value = ''
                }

                // CSV 规范：如果值中包含逗号、引号或换行符，用双引号包裹
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    value = `"${value.replace(/"/g, '""')}"`
                }

                return value
            })
            csv += rowData.join(',') + '\n'
        })

        return csv
    }

    /**
     * 触发下载
     */
    const downloadFile = (csvContent: string, filename: string) => {
        // 添加 BOM 头解决 Excel 打开中文乱码问题
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' })

        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.href = url
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)

        link.click()

        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    /**
     * 主函数：调用 API 获取所有数据并导出
     * @param apiEndpoint API 终点
     * @param currentFilters 当前的筛选条件
     * @param columns 列定义
     * @param filename 导出的文件名
     * @param dataProcessor (可选) 数据处理器，在转换为CSV前格式化数据
     */
    const exportData = async (
        apiEndpoint: string,
        currentFilters: Record<string, any>,
        columns: ExportColumn[],
        filename: string,
        // ✨ 1. (关键重构) 添加可选的数据处理器参数
        // 默认处理器：什么都不做，直接返回原数据
        dataProcessor: (data: any[]) => any[] = (data) => data
    ) => {
        if (isExporting.value) return
        isExporting.value = true

        const loadingInstance = ElLoading.service({
            lock: true,
            text: '正在导出数据...',
            background: 'rgba(0, 0, 0, 0.7)',
        })

        try {
            // 1. 准备参数
            const exportParams: any = { ...currentFilters }
            delete exportParams._page
            delete exportParams._limit

            // 2. 请求所有数据
            const response = await api.get(apiEndpoint, { params: exportParams })

            const allData = response.data.data || response.data

            if (!allData || allData.length === 0) {
                ElMessage.warning('没有可导出的数据')
                return
            }

            // ✨ 2. (关键重构) 在转换CSV前，调用数据处理器
            const processedData = dataProcessor(allData)

            // 3. 转换为 CSV (使用处理过的数据)
            const csvContent = convertToCSV(processedData, columns)

            // 4. 下载
            downloadFile(csvContent, filename)

            ElMessage.success(`数据导出成功！共 ${processedData.length} 条。`)

        } catch (error) {
            console.error('Export failed:', error)
            ElMessage.error('数据导出失败')
        } finally {
            isExporting.value = false
            loadingInstance.close()
        }
    }

    return {
        isExporting,
        exportData
    }
}