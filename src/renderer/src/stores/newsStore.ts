import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAppStore } from './appStore'

export interface NewsItem {
  id: string
  title: string
  date: string
  content: string
  image?: string
  imageLoaded?: boolean
}

export const useNewsStore = defineStore('news', () => {
  const appStore = useAppStore()

  // State
  const newsItems = ref<NewsItem[]>([])
  const isLoadingNews = ref(false)

  // Actions
  async function loadNewsItems(): Promise<void> {
    isLoadingNews.value = true
    try {
      const response = await window.electron.ipcRenderer.invoke('get-news-items')
      if (response.error) {
        appStore.showNotification('error', 'Failed to Load News', response.error)
        return
      }
      
      newsItems.value = response.items.map((item: NewsItem) => ({
        ...item,
        imageLoaded: false
      }))
      
      appStore.showNotification('success', 'News', 'News items loaded successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      appStore.showNotification('error', 'Error', `Failed to load news: ${errorMessage}`)
    } finally {
      isLoadingNews.value = false
    }
  }

  function setImageLoadStatus(id: string, loaded: boolean): void {
    const item = newsItems.value.find(item => item.id === id)
    if (item) {
      item.imageLoaded = loaded
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return {
    newsItems,
    isLoadingNews,
    loadNewsItems,
    setImageLoadStatus,
    formatDate
  }
}) 