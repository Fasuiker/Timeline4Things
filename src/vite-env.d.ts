/// <reference types="vite/client" />

interface TimelineDesktopApi {
  loadData: () => Promise<string | null>
  saveData: (json: string) => Promise<boolean>
}

interface Window {
  timelineDesktop?: TimelineDesktopApi
}
