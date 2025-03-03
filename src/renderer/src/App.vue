<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, RouterView } from 'vue-router'
import { useLogStore } from './stores/logStore'
import { useAppStore } from './stores/appStore'
import { useNotification } from '@kyvg/vue3-notification'
import LogPanel from './components/LogPanel.vue'

const router = useRouter()
const logStore = useLogStore()
const appStore = useAppStore()
const { notify } = useNotification()

onMounted(async () => {
  try {
    const success = await appStore.initializeApp()
    if (!success) {
      throw new Error('Failed to initialize app')
    }
    
    // Log successful initialization
    logStore.addLog('success', 'Application initialized successfully')
    
    // If game directory is not set, redirect to settings
    if (!appStore.isGameDirectorySet) {
      router.push('/settings')
    }
  } catch (error) {
    console.error('Error initializing app:', error)
    logStore.addLog('error', 'Failed to initialize application', error instanceof Error ? error.message : String(error))
    notify({
      type: 'error',
      title: 'Error',
      text: 'Failed to initialize application'
    })
  }
})

// Window control functions
function minimizeWindow(): void {
  window.electron.ipcRenderer.send('minimize-window')
}

function closeWindow(): void {
  window.electron.ipcRenderer.send('close-window')
}
</script>

<template>
  <div class="app-container">
    <header class="titlebar">
      <div class="titlebar-content">
        <div class="window-title">
          {{ appStore.appName }}
        </div>
        <nav class="nav-links">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
          <RouterLink to="/settings" class="nav-link">Settings</RouterLink>
        </nav>
        <div class="window-controls">
          <button class="control-button logs" @click="logStore.toggleLogPanel" :class="{ 'active': logStore.showLogPanel }">
            <span>📋</span>
          </button>
          <button class="control-button minimize" @click="minimizeWindow">
            <span>─</span>
          </button>
          <button class="control-button close" @click="closeWindow">
            <span>×</span>
          </button>
        </div>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <!-- Log Panel -->
    <Transition name="slide">
      <LogPanel v-if="logStore.showLogPanel" class="top-right-logs" />
    </Transition>

    <!-- Notifications -->
    <notifications position="top right" :duration="5000" />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100vh;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  background-color: #121212;
  color: #f5f5f5;
  line-height: 1.6;
  overflow: hidden;
}

#app {
  height: 100vh;
  background-color: #121212;
  display: flex;
  flex-direction: column;
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  color: #ffffff;
  font-family: Arial, sans-serif;
  border: 1px solid #333;
}

.titlebar {
  -webkit-app-region: drag;
  height: 32px;
  min-height: 32px;
  flex-shrink: 0; /* Prevent titlebar from shrinking */
  background-color: #252525;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 9999;
  user-select: none;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #333;
}

.titlebar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0 16px;
}

.window-title {
  font-size: 14px;
  color: #ffffff;
  flex-shrink: 0;
  margin-right: 20px;
  opacity: 0.8;
}

.nav-links {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
  margin-right: auto;
  height: 100%;
  align-items: center;
}

.nav-link {
  color: #aaa;
  text-decoration: none;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  height: 24px;
  line-height: 24px;
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.nav-link:hover {
  color: #fff;
  background-color: #333;
}

.nav-link.router-link-active {
  color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.window-controls {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
  margin-left: 20px;
}

.control-button {
  background: none;
  border: none;
  color: #aaa;
  width: 46px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-app-region: no-drag;
}

.control-button:hover {
  background-color: #333;
}

.control-button.minimize:hover {
  background-color: #333;
}

.control-button.close:hover {
  background-color: #e81123;
  color: white;
}

.control-button span {
  font-size: 16px;
  line-height: 1;
  height: 16px;
}

/* Vue Notifications Custom Styles */
.vue-notification-group {
  margin-top: 40px !important; /* Push notifications below titlebar */
}

.vue-notification {
  padding: 10px;
  margin: 0 5px 5px;
  font-size: 14px;
  color: #ffffff;
  background: #252525;
  border-left: 5px solid #187FE7;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.vue-notification.warn {
  background: #252525;
  border-left-color: #ffb648;
}

.vue-notification.error {
  background: #252525;
  border-left-color: #E54D42;
}

.vue-notification.success {
  background: #252525;
  border-left-color: #68CD86;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 13px;
}

main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-top: 2.5rem; /* Add space below titlebar */
}

footer {
  background-color: #1e1e1e;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.7rem;
  color: #666;
}

.version {
  max-width: 1200px;
  margin: 0 auto;
}

button {
  cursor: pointer;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Top right logs positioning and animation */
.top-right-logs {
  position: fixed;
  top: 40px; /* Below the titlebar */
  right: 8px;
  z-index: 1000;
  width: 320px;
  background-color: #252525;
  border-radius: 8px;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.control-button.logs {
  width: 32px;
}

.control-button.logs.active {
  background-color: #333;
  color: #4CAF50;
}

/* Slide animation */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
