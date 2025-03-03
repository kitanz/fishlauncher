<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'
import { useLogStore } from '../stores/logStore'
import { useNotification } from '@kyvg/vue3-notification'

const router = useRouter()
const appStore = useAppStore()
const logStore = useLogStore()
const { notify } = useNotification()

const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  // Load current game directory from store
  await appStore.initializeApp()
})

async function selectDirectory(): Promise<void> {
  // This is handled by the main process via a dialog
  const result = await window.electron.ipcRenderer.invoke('select-directory')
  
  if (result.canceled) return
  
  if (result.filePaths && result.filePaths.length > 0) {
    appStore.gameDirectory = result.filePaths[0]
  }
}

async function saveSettings(): Promise<void> {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const success = await appStore.setGameDirectory(appStore.gameDirectory)
    
    if (success) {
      successMessage.value = 'Settings saved successfully'
      logStore.addLog('success', 'Settings saved successfully')
      notify({
        type: 'success',
        title: 'Success',
        text: 'Settings saved successfully'
      })
      // Navigate back to home after saving
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      errorMessage.value = 'Failed to save settings'
      logStore.addLog('error', 'Failed to save settings')
      notify({
        type: 'error',
        title: 'Error',
        text: 'Failed to save settings'
      })
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while saving settings'
    logStore.addLog('error', 'Error saving settings', error instanceof Error ? error.message : String(error))
    notify({
      type: 'error',
      title: 'Error',
      text: 'An error occurred while saving settings'
    })
    console.error(error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-content">
      <section class="settings-section">
        <h2>Settings</h2>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <div class="settings-form">
          <div class="form-group">
            <label for="gameDirectory">Game Directory</label>
            <div class="directory-input">
              <input 
                id="gameDirectory"
                type="text"
                v-model="appStore.gameDirectory"
                placeholder="Select game directory"
                readonly
              />
              <button @click="selectDirectory" class="browse-button">Browse</button>
            </div>
            <p class="help-text">Select the folder where your game is installed</p>
          </div>
          
          <button 
            @click="saveSettings" 
            class="save-button"
            :disabled="isSaving || !appStore.gameDirectory"
          >
            <span v-if="isSaving" class="spinner-small"></span>
            {{ isSaving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow-y: auto;
  width: 100vw;
}

.settings-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

.settings-section {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.settings-section h2 {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #4CAF50;
  border-bottom: 1px solid #333;
  padding-bottom: 0.5rem;
}

.settings-form {
  background-color: #252525;
  border-radius: 8px;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #eee;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #aaa;
}

.directory-input {
  display: flex;
  gap: 0.5rem;
}

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #444;
  background-color: #1a1a1a;
  color: #ffffff;
  border-radius: 4px;
  font-size: 0.9rem;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.browse-button {
  background-color: #333;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
}

.browse-button:hover {
  background-color: #444;
  transform: translateY(-2px);
}

.save-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

.save-button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-2px);
}

.save-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid rgba(244, 67, 54, 0.3);
  text-align: center;
}

.success-message {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid rgba(76, 175, 80, 0.3);
  text-align: center;
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
</style> 