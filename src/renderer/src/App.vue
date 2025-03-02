<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'

const router = useRouter()
const isGameDirectorySet = ref(false)
const appName = ref('Fish Launcher')
const appVersion = ref('1.0.0')

onMounted(async () => {
  const gameDir = await window.api.getGameDirectory()
  isGameDirectorySet.value = !!gameDir
  
  // Get app settings
  const settings = await window.api.getAppSettings()
  if (settings) {
    appName.value = settings.appName || appName.value
    appVersion.value = settings.appVersion || appVersion.value
  }
  
  // If game directory is not set, redirect to settings
  if (!isGameDirectorySet.value) {
    router.push('/settings')
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
  <header>
    <div class="wrapper">
      <div class="app-title">{{ appName }}</div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/settings">Settings</RouterLink>
      </nav>
      
      <div class="window-controls">
        <button @click="minimizeWindow" class="control-button minimize">
          <span class="minimize-icon"></span>
        </button>
        <button @click="closeWindow" class="control-button close">
          <span class="close-icon"></span>
        </button>
      </div>
    </div>
  </header>

  <main>
    <RouterView />
  </main>
  
  <footer>
    <div class="version">{{ appName }} v{{ appVersion }}</div>
  </footer>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  background-color: #121212;
  color: #f5f5f5;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #1e1e1e;
  height: 40px;
  display: flex;
  align-items: center;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  -webkit-app-region: drag; /* Make header draggable */
}

.wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-weight: bold;
  color: #4CAF50;
  font-size: 1rem;
  margin-right: 0rem;
  -webkit-app-region: drag;
}

nav {
  display: flex;
  gap: 1.5rem;
  -webkit-app-region: no-drag; /* Make nav items clickable */
}

nav a {
  color: #aaa;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

nav a:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  color: #4CAF50;
  font-weight: 600;
  border-bottom: 2px solid #4CAF50;
}

/* Window controls */
.window-controls {
  display: flex;
  -webkit-app-region: no-drag; /* Make controls clickable */
}

.control-button {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 4px;
}

.minimize:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.close:hover {
  background-color: #e81123;
}

.minimize-icon {
  width: 10px;
  height: 1px;
  background-color: #aaa;
}

.close-icon {
  position: relative;
  width: 12px;
  height: 12px;
}

.close-icon::before,
.close-icon::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  background-color: #aaa;
  top: 50%;
  left: 0;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
}

.close:hover .close-icon::before,
.close:hover .close-icon::after {
  background-color: white;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 1rem 2rem;
  flex: 1;
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
</style>
