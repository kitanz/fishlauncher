import { useLogStore } from '../stores/logStore'
import { useNotification } from '@kyvg/vue3-notification'

/**
 * Centralized error handling utility
 * @param error - The error object or message
 * @param context - The context where the error occurred
 */
export function handleError(error: unknown, context: string): void {
  const logStore = useLogStore()
  const { notify } = useNotification()
  
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Log to console
  console.error(`Error in ${context}:`, error)
  
  // Add to log store
  logStore.addLog('error', `Error in ${context}`, errorMessage)
  
  // Show notification
  notify({
    type: 'error',
    title: 'Error',
    text: `${context}: ${errorMessage}`
  })
} 