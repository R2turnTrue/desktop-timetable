const { app, BrowserWindow } = require('electron/main')
const koffi = require('koffi')

const user32 = koffi.load('user32.dll')
const kernel32 = koffi.load('kernel32.dll')

const SetWindowPos = user32.func('__stdcall', 'SetWindowPos', 'bool', ['void *', 'void *', 'int', 'int', 'int', 'int', 'uint'])
const HWND_BOTTOM = 1
const GetSystemMetrics = user32.func('__stdcall', 'GetSystemMetrics', 'int', ['int'])
//const LockWindowUpdate = user32.func('__stdcall', 'LockWindowUpdate', 'bool', ['void *'])
//const UnlockWindowUpdate = user32.func('__stdcall', 'UnlockWindowUpdate', 'bool', ['void *'])
const GetLastError = kernel32.func('__stdcall', 'GetLastError', 'int', [])
const GetWindowLongA = user32.func('__stdcall', 'GetWindowLongA', 'long', ['void *', 'int'])
const SetWindowLongA = user32.func('__stdcall', 'SetWindowLongA', 'long', ['void *', 'int', 'long'])
const SetLayeredWindowAttributes = user32.func('__stdcall', 'SetLayeredWindowAttributes', 'bool', ['void *', 'unsigned long', 'unsigned char', 'unsigned long'])

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    resizable: false
  })

  //win.loadFile('index.html')
  await win.loadURL('http://xn--s39aj90b0nb2xw6xh.kr/')
  
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
  SetLayeredWindowAttributes(hwnd, 0, 210, 0x00000002)
  
  setInterval(() => {
    //LockWindowUpdate(hwnd)
    SetWindowPos(hwnd, HWND_BOTTOM, desktopWidth - 400, 0, 800, 600, 0)
    //UnlockWindowUpdate(hwnd)
  }, 50)
  //SetWindowPos(hwnd, HWND_BOTTOM, desktopWidth - 400, 0, 400, 600, 0)
  //console.log(SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, 800, 600, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE))
  console.log(GetLastError())
}

app.whenReady().then(() => {
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