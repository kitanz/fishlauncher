import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { NewsItem } from '../../renderer/types'

/**
 * Fetches news items from the server
 * @param serverUrl - URL of the news server
 * @returns Array of news items
 */
export async function fetchNewsItems(serverUrl: string): Promise<{
  success: boolean
  news?: NewsItem[]
  error?: string
}> {
  try {
    console.log(`Fetching news from: ${serverUrl}/news.json`)
    const response = await axios.get(`${serverUrl}/news.json`)
    
    if (!response.data || !Array.isArray(response.data)) {
      return { success: false, error: 'Invalid news data from server' }
    }
    
    // Validate and transform news items
    const news = response.data
      .filter((item: any) => {
        return (
          item &&
          typeof item.id !== 'undefined' &&
          typeof item.title === 'string' &&
          typeof item.date === 'string' &&
          typeof item.content === 'string'
        )
      })
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        content: item.content,
        image: item.image || undefined
      }))
    
    // Cache news locally
    cacheNewsItems(news)
    
    return { success: true, news }
  } catch (error) {
    console.error('Error fetching news:', error)
    
    // Try to load from cache if network request fails
    const cachedNews = loadCachedNews()
    if (cachedNews && cachedNews.length > 0) {
      return { success: true, news: cachedNews }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Caches news items locally
 * @param news - Array of news items to cache
 */
function cacheNewsItems(news: NewsItem[]): void {
  try {
    const cacheDir = path.join(app.getPath('userData'), 'cache')
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    
    const cacheFile = path.join(cacheDir, 'news-cache.json')
    fs.writeFileSync(cacheFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      news
    }))
  } catch (error) {
    console.error('Error caching news:', error)
  }
}

/**
 * Loads cached news items
 * @returns Array of cached news items or undefined if not found
 */
function loadCachedNews(): NewsItem[] | undefined {
  try {
    const cacheFile = path.join(app.getPath('userData'), 'cache', 'news-cache.json')
    
    if (!fs.existsSync(cacheFile)) {
      return undefined
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
    
    // Check if cache is too old (more than 24 hours)
    const cacheTime = new Date(cacheData.timestamp).getTime()
    const now = new Date().getTime()
    const cacheAge = now - cacheTime
    
    if (cacheAge > 24 * 60 * 60 * 1000) {
      return undefined
    }
    
    return cacheData.news
  } catch (error) {
    console.error('Error loading cached news:', error)
    return undefined
  }
} 