<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLogStore } from '../stores/logStore'
import { useNotification } from '@kyvg/vue3-notification'

// Define types locally since we can't import them
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
  imageLoaded?: boolean
}

const gameDirectory = ref('')
const gameVersion = ref('')
const latestVersion = ref('')
const updateAvailable = ref(false)
const updateInfo = ref<UpdateInfo | null>(null)
const isCheckingUpdate = ref(false)
const isDownloading = ref(false)
const isLaunching = ref(false)
const errorMessage = ref('')
const newsItems = ref<NewsItem[]>([])
const isLoadingNews = ref(false)
const downloadProgress = ref(0)
const showProgress = ref(false)

const logStore = useLogStore()
const { notify } = useNotification()

onMounted(async () => {
  // Load game directory
  gameDirectory.value = await window.api.getGameDirectory()
  
  // Check for updates
  await checkForUpdates()
  
  // Load news
  await loadNewsItems()
})

async function checkForUpdates(): Promise<void> {
  isCheckingUpdate.value = true
  errorMessage.value = ''
  
  try {
    // Get current game version
    if (gameDirectory.value) {
      try {
        gameVersion.value = await window.api.getGameVersion(gameDirectory.value)
      } catch (error) {
        console.error('Error getting game version:', error)
        gameVersion.value = '0.0.0'
        logStore.addLog('warning', 'Could not determine game version', error instanceof Error ? error.message : String(error))
        notify({
          type: 'warn',
          title: 'Warning',
          text: 'Could not determine game version'
        })
      }
    }
    
    // Get latest version info
    const updateData = await window.api.checkForUpdates()
    
    if (updateData && updateData.updateInfo) {
      latestVersion.value = updateData.updateInfo.version
      updateInfo.value = updateData.updateInfo
      
      // Compare versions to determine if update is needed
      updateAvailable.value = gameVersion.value !== latestVersion.value
      
      if (updateAvailable.value) {
        logStore.addLog('info', 'Update available', `New version ${latestVersion.value} is available`)
        notify({
          type: 'info',
          title: 'Update Available',
          text: `New version ${latestVersion.value} is available`
        })
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
    errorMessage.value = 'Failed to check for updates'
    logStore.addLog('error', 'Failed to check for updates', error instanceof Error ? error.message : String(error))
    notify({
      type: 'error',
      title: 'Error',
      text: 'Failed to check for updates'
    })
  } finally {
    isCheckingUpdate.value = false
  }
}

async function downloadUpdate(): Promise<void> {
  if (!updateInfo.value) return
  
  isDownloading.value = true
  errorMessage.value = ''
  showProgress.value = true
  downloadProgress.value = 0
  
  // Simulate progress updates
  const progressInterval = setInterval(() => {
    if (downloadProgress.value < 95) {
      downloadProgress.value += Math.random() * 10
      if (downloadProgress.value > 95) downloadProgress.value = 95
    }
  }, 500)
  
  try {
    // Update the API call to match the interface
    const result = await window.api.downloadUpdate(updateInfo.value.file, gameDirectory.value)
    
    if (result && result.success) {
      // Complete the progress bar
      downloadProgress.value = 100
      
      // Update the local version after successful download
      gameVersion.value = latestVersion.value
      updateAvailable.value = false
      
      logStore.addLog('success', 'Update downloaded successfully', `Updated to version ${latestVersion.value}`)
      notify({
        type: 'success',
        title: 'Success',
        text: 'Update downloaded successfully'
      })
    } else {
      errorMessage.value = result?.error || 'Failed to download update'
      logStore.addLog('error', 'Failed to download update', result?.error)
      notify({
        type: 'error',
        title: 'Error',
        text: 'Failed to download update'
      })
    }
  } catch (error) {
    console.error('Error downloading update:', error)
    errorMessage.value = 'Error occurred while downloading update'
    logStore.addLog('error', 'Error downloading update', error instanceof Error ? error.message : String(error))
    notify({
      type: 'error',
      title: 'Error',
      text: 'Error occurred while downloading update'
    })
  } finally {
    clearInterval(progressInterval)
    isDownloading.value = false
    
    // Hide progress bar after a delay
    setTimeout(() => {
      showProgress.value = false
    }, 2000)
  }
}

async function launchGame(): Promise<void> {
  isLaunching.value = true
  errorMessage.value = ''
  
  try {
    // Update the API call to match the interface
    const result = await window.api.launchGame(gameDirectory.value)
    
    if (!result || !result.success) {
      errorMessage.value = result?.error || 'Failed to launch game'
      logStore.addLog('error', 'Failed to launch game', result?.error)
      notify({
        type: 'error',
        title: 'Error',
        text: 'Failed to launch game'
      })
    } else {
      logStore.addLog('success', 'Game launched successfully')
      notify({
        type: 'success',
        title: 'Success',
        text: 'Game launched successfully'
      })
    }
  } catch (error) {
    console.error('Error launching game:', error)
    errorMessage.value = 'Error occurred while launching game'
    logStore.addLog('error', 'Error launching game', error instanceof Error ? error.message : String(error))
    notify({
      type: 'error',
      title: 'Error',
      text: 'Error occurred while launching game'
    })
  } finally {
    isLaunching.value = false
  }
}

async function loadNewsItems(): Promise<void> {
  isLoadingNews.value = true
  
  try {
    const news = await window.api.getNewsItems()
    // Initialize imageLoaded property for each news item
    newsItems.value = news.map(item => ({
      ...item,
      imageLoaded: true // Default to true, will be set to false if image fails to load
    }))
  } catch (error) {
    console.error('Error loading news:', error)
    logStore.addLog('error', 'Failed to load news items', error instanceof Error ? error.message : String(error))
    notify({
      type: 'error',
      title: 'Error',
      text: 'Failed to load news items'
    })
  } finally {
    isLoadingNews.value = false
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="home-container">
    <!-- Layout wrapper to place sections side by side -->
    <div class="layout-wrapper">
      <!-- News & Updates Section -->
      <section class="news-section">
        <h2>News & Updates</h2>
        
        <div v-if="isLoadingNews" class="loading-container">
          <div class="spinner"></div>
          <p>Loading news...</p>
        </div>
        
        <div v-else-if="newsItems.length === 0" class="empty-state">
          <p>No news available at this time.</p>
        </div>
        
        <div v-else class="news-grid">
          <div v-for="item in newsItems" :key="item.id" class="news-card">
            <div 
              class="news-image" 
              v-if="item.image"
            >
              <!-- Try using an actual img tag instead of background-image -->
              <img 
                :src="item.image" 
                :alt="item.title"
                @error="() => item.imageLoaded = false"
                v-if="item.imageLoaded !== false"
                class="news-img"
              />
              <!-- Fallback content if image fails to load -->
              <div class="image-fallback" v-if="item.imageLoaded === false">
                <span>{{ item.title }}</span>
              </div>
            </div>
            <div class="news-content">
              <h3>{{ item.title }}</h3>
              <div class="news-date">{{ formatDate(item.date) }}</div>
              <p class="news-text">{{ item.content }}</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Game Launcher Section -->
      <section class="launcher-section">
        <h2>Game Launcher</h2>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="launcher-card">
          <div class="launcher-info">
            <div class="info-row">
              <span class="info-label">Game Directory:</span>
              <span class="info-value">{{ gameDirectory || 'Not set' }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Current Version:</span>
              <span class="info-value">{{ gameVersion || 'Unknown' }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Latest Version:</span>
              <span class="info-value">{{ latestVersion || 'Unknown' }}</span>
            </div>
            
            <div class="status-row" v-if="updateAvailable">
              <div class="status-badge update-available">Update Available</div>
            </div>
            <div class="status-row" v-else-if="gameVersion">
              <div class="status-badge up-to-date">Up to Date</div>
            </div>
          </div>
          
          <div v-if="showProgress" class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${downloadProgress}%` }"></div>
            </div>
            <div class="progress-text">{{ Math.round(downloadProgress) }}%</div>
          </div>
          
          <div class="launcher-actions">
            <button 
              @click="checkForUpdates" 
              class="action-button check-button"
              :disabled="isCheckingUpdate"
            >
              <span v-if="isCheckingUpdate" class="spinner-small"></span>
              {{ isCheckingUpdate ? 'Checking...' : 'Check for Updates' }}
            </button>
            
            <button 
              v-if="updateAvailable" 
              @click="downloadUpdate" 
              class="action-button download-button"
              :disabled="isDownloading || !gameDirectory"
            >
              <span v-if="isDownloading" class="spinner-small"></span>
              {{ isDownloading ? 'Downloading...' : 'Download Update' }}
            </button>
            
            <button 
              @click="launchGame" 
              class="action-button launch-button"
              :disabled="isLaunching || !gameDirectory || isDownloading"
            >
              <span v-if="isLaunching" class="spinner-small"></span>
              {{ isLaunching ? 'Launching...' : 'Launch Game' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 100vw;
}

.layout-wrapper {
  display: flex;
  gap: 1.5rem;
  height: 100%;
}

/* News Section */
.news-section {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex: 1;
  max-width: 60%;
  overflow-y: auto;
  max-height: 600px;
}

/* Launcher Section */
.launcher-section {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
}

h2 {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #4CAF50;
  border-bottom: 1px solid #333;
  padding-bottom: 0.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #aaa;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(76, 175, 80, 0.1);
  border-radius: 50%;
  border-top-color: #4CAF50;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #aaa;
  background-color: #252525;
  border-radius: 8px;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.news-card {
  background-color: #252525;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.news-image {
  height: 120px;
  position: relative;
  overflow: hidden;
  background-color: #333;
}

.news-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.image-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333;
  color: #fff;
  font-weight: bold;
  padding: 1rem;
  text-align: center;
}

.news-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.news-content h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: #fff;
}

.news-date {
  font-size: 0.8rem;
  color: #aaa;
  margin-bottom: 0.5rem;
}

.news-text {
  margin: 0;
  color: #ddd;
  font-size: 0.85rem;
  line-height: 1.4;
  max-height: 4.2rem; /* Limit to 3 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* Launcher Section */
.launcher-card {
  background-color: #252525;
  border-radius: 8px;
  padding: 1.5rem;
  flex: 1;
}

.launcher-info {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.info-label {
  min-width: 140px;
  font-weight: bold;
  color: #aaa;
}

.info-value {
  color: #fff;
  word-break: break-all;
}

.status-row {
  margin-top: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.update-available {
  background-color: #ff9800;
  color: #000;
}

.up-to-date {
  background-color: #4CAF50;
  color: #fff;
}

.progress-container {
  margin: 1.5rem 0;
}

.progress-bar {
  height: 8px;
  background-color: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 0.8rem;
  color: #aaa;
}

.launcher-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.action-button {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 160px;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.check-button {
  background-color: #555;
  color: white;
}

.check-button:hover:not(:disabled) {
  background-color: #666;
}

.download-button {
  background-color: #ff9800;
  color: black;
}

.download-button:hover:not(:disabled) {
  background-color: #ffad33;
}

.launch-button {
  background-color: #4CAF50;
  color: white;
}

.launch-button:hover:not(:disabled) {
  background-color: #45a049;
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .layout-wrapper {
    flex-direction: column;
  }
  
  .news-section {
    max-width: 100%;
    max-height: 400px;
  }
  
  .news-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .news-grid {
    grid-template-columns: 1fr;
  }
  
  .launcher-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
}
</style> 