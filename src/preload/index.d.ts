import { ElectronAPI } from '@electron-toolkit/preload'

// Define types for update info and news items
interface UpdateInfo {
  version: string
  file: string
  releaseDate?: string
  releaseNotes?: string
}

interface NewsItem {
  id: number
  title: string
  date: string
  content: string
  image?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      checkForUpdates: () => Promise<{ needsUpdate: boolean, updateInfo?: UpdateInfo, error?: string }>
      downloadUpdate: (updateInfo: UpdateInfo) => Promise<{ success: boolean, error?: string }>
      launchGame: () => Promise<{ success: boolean, error?: string }>
      getGameDirectory: () => Promise<string>
      setGameDirectory: (directory: string) => Promise<boolean>
      getNewsItems: () => Promise<NewsItem[]>
    }
  }
}
