const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('openSettings', () => {
    ipcRenderer.invoke('openSettings')
})

contextBridge.exposeInMainWorld('setOpacity', (opacity) => {
    console.log(opacity)
    ipcRenderer.invoke('setOpacity', opacity)
})

contextBridge.exposeInMainWorld('setStartup', (startup) => {
    ipcRenderer.invoke('setStartup', startup)
})

contextBridge.exposeInMainWorld('getStartup', () => {
    return ipcRenderer.invoke('getStartup')
})

contextBridge.exposeInMainWorld('getOpacity', () => {
    return ipcRenderer.invoke('getOpacity')
})

contextBridge.exposeInMainWorld('getVersion', () => {
    return ipcRenderer.invoke('getVersion')
})