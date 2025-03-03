import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface LogEntry {
  id: number
  timestamp: Date
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  details?: string
}

export const useLogStore = defineStore('logs', () => {
  const logs = ref<LogEntry[]>([])
  const showLogPanel = ref(false)
  let nextId = 1

  function addLog(type: LogEntry['type'], message: string, details?: string): LogEntry {
    const log: LogEntry = {
      id: nextId++,
      timestamp: new Date(),
      type,
      message,
      details
    }
    logs.value.unshift(log) // Add to beginning of array
    
    // Keep only the last 100 logs
    if (logs.value.length > 100) {
      logs.value = logs.value.slice(0, 100)
    }
    
    return log
  }

  function clearLogs(): void {
    logs.value = []
  }

  function toggleLogPanel(): void {
    showLogPanel.value = !showLogPanel.value
  }

  return {
    logs,
    showLogPanel,
    addLog,
    clearLogs,
    toggleLogPanel
  }
}) 