import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import axios from 'axios'
// Import electron-store dynamically
import { spawn } from 'child_process'
import StreamZip from 'node-stream-zip'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(app.getAppPath(), '../../.env') })

// Create a store for settings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any

// Initialize store asynchronously
const initStore = async (): Promise<void> => {
  const { default: Store } = await import('electron-store')
  store = new Store({
    defaults: {
      gameDirectory: process.env.DEFAULT_GAME_DIRECTORY || '',
      serverUrl: process.env.SERVER_URL || 'localhost/game-updates',
      appName: process.env.APP_NAME || 'Fish Launcher',
      appVersion: process.env.APP_VERSION || '0.0.0',
      enableAutoUpdates: process.env.ENABLE_AUTO_UPDATES === 'true'
    }
  })
}

// Call initStore immediately
initStore()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: is.dev ? false : true // Disable web security in development mode to allow loading remote images
    }
  })

  // Set Content-Security-Policy to allow loading images from external sources
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline';"]
      }
    });
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Window control handlers
  ipcMain.on('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.on('close-window', () => {
    if (mainWindow) {
      mainWindow.close()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Game launcher IPC handlers
  setupIpcHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Setup IPC handlers for game launcher functionality
function setupIpcHandlers(): void {
  // Get game directory
  ipcMain.handle('get-game-directory', async () => {
    return store.get('gameDirectory') as string
  })

  // Set game directory
  ipcMain.handle('set-game-directory', async (_, directory) => {
    try {
      await fs.access(directory)
      store.set('gameDirectory', directory)
      return true
    } catch (error) {
      console.error('Invalid directory:', error)
      return false
    }
  })

  // Get game version
  ipcMain.handle('get-game-version', async (_, gameDirectory) => {
    try {
      if (!gameDirectory) {
        return '0.0.0'
      }

      // Check if version.json exists in the game directory
      const versionPath = join(gameDirectory, 'version.json')
      try {
        const versionData = await fs.readFile(versionPath, 'utf-8')
        const versionInfo = JSON.parse(versionData)
        return versionInfo.version || '0.0.0'
      } catch {
        // Version file doesn't exist or is invalid
        return '0.0.0'
      }
    } catch (error) {
      console.error('Error getting game version:', error)
      return '0.0.0'
    }
  })

  // Check for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      const gameDir = store.get('gameDirectory') as string
      const serverUrl = store.get('serverUrl') as string
      
      if (!gameDir) {
        return { needsUpdate: false, error: 'Game directory not set' }
      }

      // Get remote version.json
      let remoteVersion;
      try {
        // First try to fetch from server
        const remoteVersionResponse = await axios.get(`${serverUrl}/version.json`)
        remoteVersion = remoteVersionResponse.data
      } catch {
        // If server fetch fails, use local version.json for testing
        console.log('Using local version.json for testing')
        try {
          // Fix the path to point to the project root
          const localTestVersionPath = join(process.cwd(), 'version.json')
          console.log('Looking for version.json at:', localTestVersionPath)
          const localTestVersionData = await fs.readFile(localTestVersionPath, 'utf-8')
          remoteVersion = JSON.parse(localTestVersionData)
        } catch (testError) {
          console.error('Error reading local test version.json:', testError)
          return { needsUpdate: false, error: 'Failed to check for updates' }
        }
      }
      
      // Check if local version.json exists
      let localVersion = { version: '0.0.0' }
      try {
        const localVersionPath = join(gameDir, 'version.json')
        const localVersionData = await fs.readFile(localVersionPath, 'utf-8')
        localVersion = JSON.parse(localVersionData)
      } catch {
        // Ignore error, will use default version
        console.log('Local version file not found, will update')
      }
      
      // Compare versions
      const needsUpdate = localVersion.version !== remoteVersion.version
      
      return {
        needsUpdate,
        updateInfo: needsUpdate ? remoteVersion : null
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      return { needsUpdate: false, error: 'Failed to check for updates' }
    }
  })

  // Download and apply update
  ipcMain.handle('download-update', async (_, file, gameDirectory) => {
    try {
      const serverUrl = store.get('serverUrl') as string
      
      if (!gameDirectory) {
        return { success: false, error: 'Game directory not set' }
      }

      // Create temp directory if it doesn't exist
      const tempDir = join(gameDirectory, 'temp')
      try {
        await fs.mkdir(tempDir, { recursive: true })
      } catch {
        // Directory might already exist, ignore error
      }
      
      // Download update file
      const updateUrl = file.startsWith('http') ? file : `${serverUrl}/${file}`
      const updateFileName = updateUrl.split('/').pop() || 'update.zip'
      const updateFilePath = join(tempDir, updateFileName)
      
      const response = await axios({
        method: 'GET',
        url: updateUrl,
        responseType: 'arraybuffer'
      })
      
      await fs.writeFile(updateFilePath, response.data)
      
      // Extract update
      const zip = new StreamZip.async({ file: updateFilePath })
      await zip.extract(null, gameDirectory)
      await zip.close()
      
      // Get the version from the downloaded update
      let version = '1.0.0' // Default version if not found
      try {
        const versionPath = join(gameDirectory, 'version.json')
        const versionData = await fs.readFile(versionPath, 'utf-8')
        const versionInfo = JSON.parse(versionData)
        version = versionInfo.version || version
      } catch {
        // Version file doesn't exist in the update, create one with default version
        console.log('Version file not found in update, using default version')
      }
      
      // Write or update version.json
      await fs.writeFile(
        join(gameDirectory, 'version.json'),
        JSON.stringify({ version })
      )
      
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true })
      
      return { success: true }
    } catch (error) {
      console.error('Error downloading update:', error)
      return { success: false, error: 'Failed to download or apply update' }
    }
  })

  // Launch game
  ipcMain.handle('launch-game', async (_, gameDirectory) => {
    try {
      if (!gameDirectory) {
        return { success: false, error: 'Game directory not set' }
      }
      
      // Find executable (this will depend on your game)
      // For Unity games, it's typically a .exe file on Windows
      let exePath = ''
      
      if (process.platform === 'win32') {
        // Look for .exe files in the game directory
        const files = await fs.readdir(gameDirectory)
        const exeFiles = files.filter(file => file.endsWith('.exe'))
        
        if (exeFiles.length === 0) {
          return { success: false, error: 'No executable found in game directory' }
        }
        
        // Use the first .exe file found (you might want to be more specific)
        exePath = join(gameDirectory, exeFiles[0])
      } else if (process.platform === 'darwin') {
        // For macOS, look for .app bundles
        const files = await fs.readdir(gameDirectory)
        const appFiles = files.filter(file => file.endsWith('.app'))
        
        if (appFiles.length === 0) {
          return { success: false, error: 'No application found in game directory' }
        }
        
        exePath = join(gameDirectory, appFiles[0])
      } else {
        // For Linux, look for executable files
        const files = await fs.readdir(gameDirectory)
        const executableFiles = files.filter(file => !file.includes('.'))
        
        if (executableFiles.length === 0) {
          return { success: false, error: 'No executable found in game directory' }
        }
        
        exePath = join(gameDirectory, executableFiles[0])
      }
      
      // Launch the game
      spawn(exePath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: gameDirectory
      }).unref()
      
      return { success: true }
    } catch (error) {
      console.error('Error launching game:', error)
      return { success: false, error: 'Failed to launch game' }
    }
  })

  // Get news items
  ipcMain.handle('get-news-items', async () => {
    try {
      const serverUrl = store.get('serverUrl') as string
      
      try {
        // First try to fetch from server
        const newsResponse = await axios.get(`${serverUrl}/news.json`)
        return newsResponse.data
      } catch {
        // If server fetch fails, use local news.json for testing
        console.log('Using local news.json for testing')
        try {
          // Fix the path to point to the project root
          const localNewsPath = join(process.cwd(), 'news.json')
          console.log('Looking for news.json at:', localNewsPath)
          const localNewsData = await fs.readFile(localNewsPath, 'utf-8')
          return JSON.parse(localNewsData)
        } catch (testError) {
          console.error('Error reading local test news.json:', testError)
          return []
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      return []
    }
  })

  // Get app settings
  ipcMain.handle('get-app-settings', async () => {
    return {
      appName: store.get('appName'),
      appVersion: store.get('appVersion'),
      serverUrl: store.get('serverUrl'),
      enableAutoUpdates: store.get('enableAutoUpdates')
    }
  })

  // Select directory dialog
  ipcMain.handle('select-directory', async () => {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return { canceled: true }
    
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })
    
    return result
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
