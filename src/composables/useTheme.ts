import { ref, watchEffect } from 'vue'

export function useTheme() {
    // 1. 初始化状态 (优先从本地获取，其次跟随系统)
    const isDark = ref(localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))

    const toggleTheme = () => {
        isDark.value = !isDark.value
    }

    // 2. 副作用：同步到 HTML Class 和本地存储
    watchEffect(() => {
        const root = document.documentElement
        if (isDark.value) {
            root.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }

        // 向全局触发一个自定义事件，方便 ECharts 等组件监听并重绘
        window.dispatchEvent(new CustomEvent('theme-change', { detail: isDark.value ? 'dark' : 'light' }))
    })

    return {
        isDark,
        toggleTheme
    }
}