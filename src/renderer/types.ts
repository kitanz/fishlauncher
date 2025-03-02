// Define types for update info and news items
export interface UpdateInfo {
  version: string
  file: string
  releaseDate?: string
  releaseNotes?: string
}

export interface NewsItem {
  id: number
  title: string
  date: string
  content: string
  image?: string
} 