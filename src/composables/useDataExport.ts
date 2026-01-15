// src/composables/useDataExport.ts
import { ref } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import * as XLSX from 'xlsx'
import request from '@/api/core/request' // ✅ 使用统一的 request 实例

// 定义列的结构
interface ExportColumn {
    label: string // CSV/Excel 文件的表头
    key: string   // 对应 data 中的字段
}

export function useDataExport() {
    const isExporting = ref(false)

    /**
     * 导出数据主函数
     * @param apiEndpoint API路径 (例如 '/devices')
     * @param currentFilters 当前筛选条件
     * @param columns 导出的列定义
     * @param filename 文件名
     * @param dataProcessor 数据处理回调 (可选)
     */
    const exportData = async (
        apiEndpoint: string,
        currentFilters: any,
        columns: ExportColumn[],
        filename: string = 'export-data',
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
            // 1. 准备参数：移除分页参数，获取全量数据
            const exportParams: any = { ...currentFilters }
            delete exportParams._page
            delete exportParams._limit

            // 如果后端支持不分页参数，可以在这里加上，例如:
            // exportParams._limit = 9999

            // 2. 请求所有数据
            // ✅ 修正：使用 request.get，且注意 request 拦截器默认返回的是 response.data
            const res: any = await request.get(apiEndpoint, { params: exportParams })

            // ✅ 兼容处理：
            // 如果 res 本身是数组，说明后端直接返回了列表
            // 如果 res 是对象且有 data 字段，说明是标准结构 { code: 200, data: [...] }
            const allData = Array.isArray(res) ? res : (res.data || [])

            if (!allData || allData.length === 0) {
                ElMessage.warning('没有可导出的数据')
                return
            }

            // 3. 数据处理 (格式化日期、状态映射等)
            const processedData = dataProcessor(allData)

            // 4. 转换为 Excel 格式 (使用 xlsx 库)
            const exportList = processedData.map((item: any) => {
                const row: any = {}
                columns.forEach(col => {
                    row[col.label] = item[col.key]
                })
                return row
            })

            const ws = XLSX.utils.json_to_sheet(exportList)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
            XLSX.writeFile(wb, `${filename}.xlsx`)

            ElMessage.success(`数据导出成功！共 ${processedData.length} 条。`)

        } catch (error) {
            console.error('Export failed:', error)
            ElMessage.error('数据导出失败')
        } finally {
            loadingInstance.close()
            isExporting.value = false
        }
    }

    return {
        isExporting,
        exportData
    }
}