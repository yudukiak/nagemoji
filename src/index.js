const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    icon: `${__dirname}/images/icon.png`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
  win.setMenuBarVisibility(false)
  //win.webContents.openDevTools()
  win.webContents.on('new-window', (ev, url) => {
    ev.preventDefault()
    shell.openExternal(url)
  })
}
app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})