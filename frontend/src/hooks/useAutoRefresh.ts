import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshOptions {
  /** 刷新间隔（毫秒），默认 30000ms (30秒) */
  interval?: number
  /** 是否启用自动刷新，默认 true */
  enabled?: boolean
  /** 页面不可见时是否暂停刷新，默认 true */
  pauseOnHidden?: boolean
}

/**
 * 自动刷新 Hook
 * 用于定时刷新数据，支持页面可见性检测
 */
export function useAutoRefresh(
  refreshFn: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const {
    interval = 30000,
    enabled = true,
    pauseOnHidden = true,
  } = options

  const timerRef = useRef<number | null>(null)
  const isVisibleRef = useRef(true)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    clearTimer()
    if (enabled && (!pauseOnHidden || isVisibleRef.current)) {
      timerRef.current = window.setInterval(() => {
        refreshFn()
      }, interval)
    }
  }, [enabled, interval, pauseOnHidden, refreshFn, clearTimer])

  // 处理页面可见性变化
  useEffect(() => {
    if (!pauseOnHidden) return

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'
      if (isVisibleRef.current) {
        // 页面变为可见时，立即刷新一次并重启定时器
        refreshFn()
        startTimer()
      } else {
        // 页面不可见时，停止定时器
        clearTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pauseOnHidden, refreshFn, startTimer, clearTimer])

  // 启动/停止定时器
  useEffect(() => {
    if (enabled) {
      startTimer()
    } else {
      clearTimer()
    }
    return clearTimer
  }, [enabled, startTimer, clearTimer])

  // 返回手动控制方法
  return {
    /** 手动触发刷新 */
    refresh: refreshFn,
    /** 暂停自动刷新 */
    pause: clearTimer,
    /** 恢复自动刷新 */
    resume: startTimer,
  }
}

export default useAutoRefresh
