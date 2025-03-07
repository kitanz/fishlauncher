import { app } from 'electron'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import StreamZip from 'node-stream-zip'
import { UpdateInfo } from '../../renderer/types'

/**
 * Checks for game updates by comparing local version with remote version
 * @param gameDirectory - Path to the game directory
 * @param serverUrl - URL of the update server
 * @returns Object containing update information
 */
export async function checkForGameUpdates(gameDirectory: string, serverUrl: string): Promise<{
  needsUpdate: boolean
  updateInfo?: UpdateInfo
  error?: string
}> {
  try {
    // Check if game directory exists
    if (!fs.existsSync(gameDirectory)) {
      return { needsUpdate: false, error: 'Game directory not found' }
    }

    // Read local version
    const versionFilePath = path.join(gameDirectory, 'version.json')
    let localVersion = '0.0.0'
    
    if (fs.existsSync(versionFilePath)) {
      const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'))
      localVersion = versionData.version || '0.0.0'
    }

    // Fetch remote version
    console.log(`Checking for updates from: ${serverUrl}/version.json`)
    const response = await axios.get(`${serverUrl}/version.json`)
    const remoteVersionData = response.data
    
    if (!remoteVersionData || !remoteVersionData.version) {
      return { needsUpdate: false, error: 'Invalid version data from server' }
    }

    const remoteVersion = remoteVersionData.version
    
    // Compare versions
    if (remoteVersion !== localVersion) {
      return {
        needsUpdate: true,
        updateInfo: {
          version: remoteVersion,
          file: remoteVersionData.file,
          releaseDate: remoteVersionData.releaseDate,
          releaseNotes: remoteVersionData.releaseNotes
        }
      }
    }

    return { needsUpdate: false }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return { 
      needsUpdate: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Downloads and applies a game update
 * @param updateInfo - Information about the update
 * @param gameDirectory - Path to the game directory
 * @param serverUrl - URL of the update server
 * @param progressCallback - Callback for reporting download progress
 * @returns Object indicating success or failure
 */
export async function downloadAndApplyUpdate(
  updateInfo: UpdateInfo,
  gameDirectory: string,
  serverUrl: string,
  progressCallback: (progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(app.getPath('temp'), 'game-updates')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Download update file
    const updateUrl = `${serverUrl}/${updateInfo.file}`
    console.log(`Downloading update from: ${updateUrl}`)
    
    const updateFilePath = path.join(tempDir, path.basename(updateInfo.file))
    const writer = fs.createWriteStream(updateFilePath)
    
    const response = await axios({
      url: updateUrl,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        progressCallback(progress)
      }
    })

    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    // Extract update
    console.log('Extracting update...')
    const zip = new StreamZip.async({ file: updateFilePath })
    await zip.extract(null, gameDirectory)
    await zip.close()

    // Update version file
    const versionFilePath = path.join(gameDirectory, 'version.json')
    fs.writeFileSync(versionFilePath, JSON.stringify({
      version: updateInfo.version,
      updateDate: new Date().toISOString()
    }))

    // Clean up
    fs.unlinkSync(updateFilePath)

    return { success: true }
  } catch (error) {
    console.error('Error downloading update:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
} 