const { app, BrowserWindow, Tray, Menu } = require("electron")
const path = require("path")

const isDev = !app.isPackaged
let mainWindow = null
let tray = null

app.commandLine.appendSwitch("disable-renderer-backgrounding")
app.commandLine.appendSwitch("disable-background-timer-throttling")
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows")

function createTray() {
  tray = new Tray(path.join(__dirname, "../public/favicon.png"))
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => mainWindow?.show() },
    { label: "Exit", click: () => app.quit() },
  ])
  tray.setContextMenu(contextMenu)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL("http://localhost:4000")
    mainWindow.webContents.openDevTools()

    try {
      require("electron-reload")(__dirname, {
        electron: path.join(__dirname, "..", "node_modules", ".bin", "electron"),
        hardResetMethod: "exit",
      })
    } catch (e) {
      console.log(`electron-reload load error ${e.message}`)
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"))
  }

  createTray()

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on("before-quit", () => {
  app.isQuitting = true
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})
