import { app, BrowserWindow } from 'electron'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Ini untuk dapatkan __dirname setara di ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let backendProcess

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
    },
  })

  win.loadFile(path.join(__dirname, 'dist', 'index.html'))
}

app.whenReady().then(() => {
  const backendPath = path.join(process.resourcesPath, 'backend', 'kwala_sender-app.exe')

  backendProcess = spawn(backendPath, {
    cwd: path.dirname(backendPath),
    stdio: 'inherit',
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill()
    app.quit()
  }
})
