import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAppStore } from './appStore'

export interface UpdateInfo {
  version: string
  url: string
  notes: string
}

export const useGameStore = defineStore('game', () => {
  const appStore = useAppStore()

  // State
  const gameVersion = ref('')
  const latestVersion = ref('')
  const updateAvailable = ref(false)
  const updateInfo = ref<UpdateInfo | null>(null)
  const isCheckingUpdate = ref(false)
  const isDownloading = ref(false)
  const isLaunching = ref(false)
  const downloadProgress = ref(0)
  const showProgress = ref(false)

  // Actions
  async function checkForUpdates(): Promise<void> {
    isCheckingUpdate.value = true
    try {
      const result = await window.electron.ipcRenderer.invoke('check-for-updates')
      if (result.error) {
        appStore.showNotification('error', 'Update Check Failed', result.error)
        return
      }

      if (result.needsUpdate && result.updateInfo) {
        updateAvailable.value = true
        updateInfo.value = result.updateInfo
        latestVersion.value = result.updateInfo.version
        appStore.showNotification('info', 'Update Available', `Version ${result.updateInfo.version} is available`)
      } else {
        updateAvailable.value = false
        appStore.showNotification('success', 'Up to Date', 'Your game is up to date')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      appStore.showNotification('error', 'Error', `Failed to check for updates: ${errorMessage}`)
    } finally {
      isCheckingUpdate.value = false
    }
  }

  async function downloadUpdate(): Promise<void> {
    if (!updateInfo.value) {
      appStore.showNotification('error', 'Error', 'No update information available')
      return
    }

    isDownloading.value = true
    showProgress.value = true
    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        downloadProgress.value = i
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      gameVersion.value = updateInfo.value.version
      updateAvailable.value = false
      updateInfo.value = null
      appStore.showNotification('success', 'Success', 'Game updated successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      appStore.showNotification('error', 'Error', `Failed to download update: ${errorMessage}`)
    } finally {
      isDownloading.value = false
      showProgress.value = false
      downloadProgress.value = 0
    }
  }

  async function launchGame(): Promise<void> {
    isLaunching.value = true
    try {
      const success = await window.electron.ipcRenderer.invoke('launch-game')
      if (success) {
        appStore.showNotification('success', 'Success', 'Game launched successfully')
      } else {
        throw new Error('Failed to launch game')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      appStore.showNotification('error', 'Error', `Failed to launch game: ${errorMessage}`)
    } finally {
      isLaunching.value = false
    }
  }

  return {
    gameVersion,
    latestVersion,
    updateAvailable,
    updateInfo,
    isCheckingUpdate,
    isDownloading,
    isLaunching,
    downloadProgress,
    showProgress,
    checkForUpdates,
    downloadUpdate,
    launchGame
  }
}) 