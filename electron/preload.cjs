const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('timelineDesktop', {
  loadData: () => ipcRenderer.invoke('timeline:load-data'),
  saveData: (json) => ipcRenderer.invoke('timeline:save-data', json),
})
