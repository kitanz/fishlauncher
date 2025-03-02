<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const gameDirectory = ref('')
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(async () => {
  // Load current game directory
  gameDirectory.value = await window.api.getGameDirectory()
})

async function selectDirectory(): Promise<void> {
  // This is handled by the main process via a dialog
  const result = await window.electron.ipcRenderer.invoke('select-directory')
  
  if (result.canceled) return
  
  if (result.filePaths && result.filePaths.length > 0) {
    gameDirectory.value = result.filePaths[0]
  }
}

async function saveSettings(): Promise<void> {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const success = await window.api.setGameDirectory(gameDirectory.value)
    
    if (success) {
      successMessage.value = 'Settings saved successfully'
      // Navigate back to home after saving
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      errorMessage.value = 'Failed to save settings'
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while saving settings'
    console.error(error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="settings-container">
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
              v-model="gameDirectory"
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
          :disabled="isSaving || !gameDirectory"
        >
          <span v-if="isSaving" class="spinner-small"></span>
          {{ isSaving ? 'Saving...' : 'Save Settings' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.save-button:hover {
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