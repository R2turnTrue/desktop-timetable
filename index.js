const { autoUpdater } = require('electron')
const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('path')
const fs = require('fs')

if (require('electron-squirrel-startup')) app.quit();

const server = 'https://update.electronjs.org'
const url = `${server}/R2turnTrue/desktop-timetable/${process.platform}-${process.arch}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })

setInterval(() => {
  autoUpdater.checkForUpdates()
}, 60000)

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['설치하기', '나중에..'],
    title: '업데이트',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail:
      '새로운 버전이 다운로드되었어요!'
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('error', (message) => {
  console.error('There was a problem updating the application')
  console.error(message)
})

const koffi = require('koffi')

const user32 = koffi.load('user32.dll')
const kernel32 = koffi.load('kernel32.dll')

const SetWindowPos = user32.func('__stdcall', 'SetWindowPos', 'bool', ['void *', 'void *', 'int', 'int', 'int', 'int', 'uint'])
const HWND_BOTTOM = 1
const HWND_NOTOPMOST = -2
const GetSystemMetrics = user32.func('__stdcall', 'GetSystemMetrics', 'int', ['int'])
//const LockWindowUpdate = user32.func('__stdcall', 'LockWindowUpdate', 'bool', ['void *'])
//const UnlockWindowUpdate = user32.func('__stdcall', 'UnlockWindowUpdate', 'bool', ['void *'])
const GetLastError = kernel32.func('__stdcall', 'GetLastError', 'int', [])
const GetWindowLongA = user32.func('__stdcall', 'GetWindowLongA', 'long', ['void *', 'int'])
const SetWindowLongA = user32.func('__stdcall', 'SetWindowLongA', 'long', ['void *', 'int', 'long'])
const SetLayeredWindowAttributes = user32.func('__stdcall', 'SetLayeredWindowAttributes', 'bool', ['void *', 'unsigned long', 'unsigned char', 'unsigned long'])

/**
 * @type {BrowserWindow}
 */
let settingsWindow

const CONFIG_DIR = path.join(app.getPath("appData"), 'timetable_settings.json')

let configurations = {
  opacity: 210,
  startup: true
}

const createSettings = async () => {
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  settingsWindow.on('close', (e) => {
    settingsWindow = undefined
  })

  await settingsWindow.loadFile('settings.html')
}

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  ipcMain.handle('openSettings', () => {
    if (settingsWindow == undefined) createSettings()
    else settingsWindow.focus()
  })
  
  ipcMain.handle('setStartup', (e, startup) => {
    configurations.startup = startup

    app.setLoginItemSettings({
      openAtLogin: startup,
      path: app.getPath('exe')
    })
  })

  ipcMain.handle('getStartup', (e) => {
    return configurations.startup || true
  })

  ipcMain.handle('getVersion', (e) => {
    return app.getVersion()
  })

  ipcMain.handle('setOpacity', (e, opacity) => {
    configurations.opacity = opacity
    SetLayeredWindowAttributes(hwnd, 0, opacity, 0x00000002)
  })

  ipcMain.handle('getOpacity', (e) => {
    return configurations.opacity || 210
  })

  await win.loadFile('index.html')

  //win.webContents.openDevTools({ mode: 'detach' })
  //await win.loadURL('http://xn--s39aj90b0nb2xw6xh.kr/')
  
  const desktopWidth = GetSystemMetrics(0) // SM_CXSCREEN
  //const desktopHeight = GetSystemMetrics(1) // SM_CYSCREEN

  console.log(desktopWidth)

  let hwnd = win.getNativeWindowHandle()

  console.log(hwnd)

  hwnd = hwnd.readInt32LE(0)

  console.log(hwnd.toString(16))

  const SWP_NOSIZE = 0x0001
  const SWP_NOMOVE = 0x0002
  const SWP_NOACTIVATE = 0x0010

  const st = GetWindowLongA(hwnd, -20)

  // desktopWidth - 800, 600

  SetWindowLongA(hwnd, -20, st | 0x00080000 | 0x08000000)
  SetLayeredWindowAttributes(hwnd, 0, configurations.opacity || 210, 0x00000002)
  
  setInterval(() => {
    //LockWindowUpdate(hwnd)
    SetWindowPos(hwnd, HWND_BOTTOM, desktopWidth - 400, 0, 400, 600, 0)
    //UnlockWindowUpdate(hwnd)
  }, 50)

  setInterval(() => {
    fs.writeFileSync(CONFIG_DIR, JSON.stringify(configurations), { encoding: 'utf-8' })
    console.log('saved configuration')
  }, 5000)
  //SetWindowPos(hwnd, HWND_BOTTOM, desktopWidth - 400, 0, 400, 600, 0)
  //SetWindowPos(hwnd, HWND_BOTTOM, desktopWidth - 400, 0, 400, 600, 0)
  //console.log(SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 800, 600, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE))
  console.log(GetLastError())
}

app.whenReady().then(() => {
  if (fs.existsSync(CONFIG_DIR)) {
    configurations = JSON.parse(fs.readFileSync(CONFIG_DIR, { encoding: 'utf-8' }))
  }

  app.setLoginItemSettings({
    openAtLogin: configurations.startup || true,
    path: app.getPath('exe')
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})