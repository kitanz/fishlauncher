import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'

/**
 * Validates if a directory is a valid game directory
 * @param directory - Path to check
 * @returns Boolean indicating if directory is valid
 */
export function isValidGameDirectory(directory: string): boolean {
  try {
    if (!fs.existsSync(directory)) {
      return false
    }
    
    // Check for essential game files/folders
    // This should be customized based on your game's structure
    const requiredFiles = ['version.json']
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(directory, file))) {
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('Error validating game directory:', error)
    return false
  }
}

/**
 * Opens a directory selection dialog
 * @param title - Dialog title
 * @param defaultPath - Default path to show
 * @returns Selected directory path or undefined if canceled
 */
export async function selectDirectory(title: string, defaultPath?: string): Promise<string | undefined> {
  try {
    const result = await dialog.showOpenDialog({
      title,
      defaultPath,
      properties: ['openDirectory']
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return undefined
    }
    
    return result.filePaths[0]
  } catch (error) {
    console.error('Error selecting directory:', error)
    return undefined
  }
}

/**
 * Gets the game version from the version file
 * @param gameDirectory - Path to the game directory
 * @returns Game version or undefined if not found
 */
export function getGameVersion(gameDirectory: string): string | undefined {
  try {
    if (!fs.existsSync(gameDirectory)) {
      return undefined
    }
    
    const versionFilePath = path.join(gameDirectory, 'version.json')
    
    if (!fs.existsSync(versionFilePath)) {
      return undefined
    }
    
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'))
    return versionData.version
  } catch (error) {
    console.error('Error getting game version:', error)
    return undefined
  }
}

/**
 * Creates a directory if it doesn't exist
 * @param directory - Path to create
 * @returns Boolean indicating success
 */
export function ensureDirectoryExists(directory: string): boolean {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
    return true
  } catch (error) {
    console.error('Error creating directory:', error)
    return false
  }
} 