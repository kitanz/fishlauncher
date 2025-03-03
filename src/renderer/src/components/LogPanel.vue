<script setup lang="ts">
import { useLogStore } from '../stores/logStore'
import { computed } from 'vue'

const logStore = useLogStore()

const typeIcons = {
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  success: '✅'
}

const formattedLogs = computed(() => {
  return logStore.logs.map(log => ({
    ...log,
    formattedTime: new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(log.timestamp)
  }))
})
</script>

<template>
  <div class="log-panel">
    <div class="log-header">
      <div class="log-title">
        <span class="log-icon">📋</span>
        System Logs
      </div>
      <div class="log-actions">
        <button 
          class="action-button" 
          @click="logStore.clearLogs"
          title="Clear logs"
        >
          Clear
        </button>
      </div>
    </div>
    
    <div class="log-content">
      <div v-if="formattedLogs.length === 0" class="empty-logs">
        No logs to display
      </div>
      <div v-else class="log-list">
        <div v-for="log in formattedLogs" 
             :key="log.id" 
             class="log-entry"
             :class="log.type"
        >
          <div class="log-entry-header">
            <span class="log-icon">{{ typeIcons[log.type] }}</span>
            <span class="log-time">{{ log.formattedTime }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.details" class="log-details">{{ log.details }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  background-color: #252525;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #1e1e1e;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid #333;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-icon {
  opacity: 0.8;
}

.log-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  background: none;
  border: none;
  color: #aaa;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #333;
  color: #fff;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  max-height: 400px;
}

.empty-logs {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.log-entry {
  padding: 8px 12px;
  border-left: 3px solid transparent;
  transition: background-color 0.2s ease;
}

.log-entry:hover {
  background-color: #2a2a2a;
}

.log-entry.success {
  border-left-color: #4CAF50;
}

.log-entry.error {
  border-left-color: #f44336;
}

.log-entry.warning {
  border-left-color: #ff9800;
}

.log-entry.info {
  border-left-color: #2196F3;
}

.log-entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-time {
  color: #666;
  font-size: 11px;
}

.log-message {
  color: #eee;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.4;
}

.log-details {
  color: #888;
  margin-top: 4px;
  font-size: 11px;
  font-family: monospace;
  word-break: break-all;
  background: #1e1e1e;
  padding: 4px 8px;
  border-radius: 4px;
}

/* Scrollbar styling */
.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.log-content::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 