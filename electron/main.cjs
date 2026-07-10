const { app, BrowserWindow, shell, nativeImage, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

const isDev = !app.isPackaged

// Stable profile path so replacing the portable exe keeps events on the same PC.
const userDataRoot = path.join(app.getPath('appData'), 'Timeline4Things')
try {
  fs.mkdirSync(userDataRoot, { recursive: true })
} catch {
  /* ignore */
}
app.setPath('userData', userDataRoot)

const DATA_FILE = path.join(userDataRoot, 'timeline-data.json')
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR
const PORTABLE_BACKUP = portableDir
  ? path.join(portableDir, 'Timeline4Things-data', 'timeline-data.json')
  : null

const LEGACY_USER_DATA_DIRS = [
  path.join(app.getPath('appData'), 'timeline4things'),
  path.join(app.getPath('appData'), 'timeline-studio'),
]

const appIcon = nativeImage.createFromPath(path.join(__dirname, 'icon.ico'))

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

function writeJsonFile(filePath, json) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, json, 'utf8')
    return true
  } catch (err) {
    console.warn('Failed to write', filePath, err)
    return false
  }
}

function migrateLegacyDataFiles() {
  if (fs.existsSync(DATA_FILE)) return
  for (const dir of LEGACY_USER_DATA_DIRS) {
    const candidate = path.join(dir, 'timeline-data.json')
    const raw = readJsonFile(candidate)
    if (raw) {
      writeJsonFile(DATA_FILE, raw)
      return
    }
  }
  if (PORTABLE_BACKUP) {
    const raw = readJsonFile(PORTABLE_BACKUP)
    if (raw) writeJsonFile(DATA_FILE, raw)
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    title: 'Timeline4Things',
    icon: appIcon,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })
}

ipcMain.handle('timeline:load-data', () => {
  migrateLegacyDataFiles()
  return (
    readJsonFile(DATA_FILE) ||
    (PORTABLE_BACKUP ? readJsonFile(PORTABLE_BACKUP) : null)
  )
})

ipcMain.handle('timeline:save-data', (_event, json) => {
  const ok = writeJsonFile(DATA_FILE, json)
  if (PORTABLE_BACKUP) writeJsonFile(PORTABLE_BACKUP, json)
  return ok
})

app.whenReady().then(() => {
  migrateLegacyDataFiles()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
