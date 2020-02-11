// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');
const remote = require('electron').remote;
const { ipcMain } = require('electron');
const path = require('path');

// Electron reload
// require('electron-reload')(__dirname);

const server = require('./server');

// For ip address
const ip = require('ip');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    allowRendererProcessReuse: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`http://${ip.address()}:3000/`);

});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// ipcMain
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(event, arg); // prints "ping"

  const externalWindow = new BrowserWindow({
    width: 700,
    height: 400,
    allowRendererProcessReuse: true,
    frame: false,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  externalWindow.loadURL(`file://${__dirname}/index.html`)

  // event.reply('asynchronous-reply', 'pong')
});
