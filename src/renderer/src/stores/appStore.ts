import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNotification } from '@kyvg/vue3-notification'
import { useLogStore } from './logStore'

export interface AppSettings {
  gameDirectory: string
  enableAutoUpdates: boolean
}

export const useAppStore = defineStore('app', () => {
  const { notify } = useNotification()
  const logStore = useLogStore()

  // State
  const appName = ref('Fish Launcher')
  const appVersion = ref('1.0.0')
  const serverUrl = ref('http://localhost:3000')
  const gameDirectory = ref('')
  const enableAutoUpdates = ref(true)

  // Computed
  const isGameDirectorySet = computed(() => !!gameDirectory.value)

  // Helper function for notifications
  function showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, text: string): void {
    notify({
      type,
      title,
      text,
      ignoreDuplicates: true,
      id: `${type}-${title}-${text}` // Unique ID based on content
    })
    
    // Also log to our log system
    logStore.addLog(type, text)
  }

  // Actions
  async function initializeApp(): Promise<boolean> {
    try {
      const settings = await window.electron.ipcRenderer.invoke('get-app-settings')
      if (settings) {
        gameDirectory.value = settings.gameDirectory || ''
        enableAutoUpdates.value = settings.enableAutoUpdates ?? true
      }
      
      showNotification('success', 'Success', 'App initialized successfully')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showNotification('error', 'Error', `Failed to initialize app: ${errorMessage}`)
      return false
    }
  }

  async function setGameDirectory(path: string): Promise<boolean> {
    try {
      const success = await window.electron.ipcRenderer.invoke('set-game-directory', path)
      if (success) {
        gameDirectory.value = path
      }
      showNotification('success', 'Success', 'Game directory set successfully')
      return success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showNotification('error', 'Error', `Failed to set game directory: ${errorMessage}`)
      return false
    }
  }

  return {
    appName,
    appVersion,
    serverUrl,
    gameDirectory,
    enableAutoUpdates,
    isGameDirectorySet,
    initializeApp,
    setGameDirectory,
    showNotification
  }
}) 