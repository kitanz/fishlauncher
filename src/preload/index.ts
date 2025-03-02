import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Define types for update info and news items
interface UpdateInfo {
  version: string
  file: string
  releaseDate?: string
  releaseNotes?: string
}

interface NewsItem {
  id: number | string
  title: string
  date: string
  content: string
  image?: string
}

interface AppSettings {
  appName: string
  appVersion: string
  serverUrl: string
  enableAutoUpdates: boolean
}

// Custom APIs for renderer
const api = {
  // Game launcher functions
  checkForUpdates: (): Promise<{ needsUpdate: boolean; updateInfo?: UpdateInfo; error?: string }> => 
    ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (file: string, gameDirectory: string): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke('download-update', file, gameDirectory),
  launchGame: (gameDirectory: string): Promise<{ success: boolean; error?: string }> => 
    ipcRenderer.invoke('launch-game', gameDirectory),
  getGameVersion: (gameDirectory: string): Promise<string> =>
    ipcRenderer.invoke('get-game-version', gameDirectory),
  
  // Settings functions
  getGameDirectory: (): Promise<string> => 
    ipcRenderer.invoke('get-game-directory'),
  setGameDirectory: (directory: string): Promise<boolean> => 
    ipcRenderer.invoke('set-game-directory', directory),
  
  // News functions
  getNewsItems: (): Promise<NewsItem[]> => 
    ipcRenderer.invoke('get-news-items'),
    
  // App settings
  getAppSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('get-app-settings')
}

// Extended electron API with window controls
const extendedElectronAPI = {
  ...electronAPI,
  ipcRenderer: {
    ...electronAPI.ipcRenderer,
    // Add window control methods
    send: (channel: string, ...args: unknown[]): void => {
      const validChannels = ['minimize-window', 'close-window', 'ping'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', extendedElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = extendedElectronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
