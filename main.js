const { app, BrowserWindow } = require('electron')
const path = require('path');
// const remoteMain = require('@electron/remote/main');
const fs = require('fs');
const ipc = require('electron').ipcMain;
const filestoragecon = require("./filestorageconnection.js");
const knex = require("./knexconnection.js");

const createWindow = () => {
    let isAppClosing = false;
    const win = new BrowserWindow({
        width: 600,
        height: 600,
        icon: path.join(__dirname, 'img', 'icon.png'),
        titleBarStyle: 'hidden',
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    //Development only.
    win.webContents.openDevTools();

    win.loadFile('index.html');

    win.on("close", async function (event) {
        if (!isAppClosing) {
            event.preventDefault();
            console.log('Start closing App!');
            // await updateWindowDimensions(win.getBounds());
            isAppClosing = true;
        }
        app.quit();
    });

    win.on("closed", function () {
        console.log('Finished closing App!');
    });

    ipc.on('closeApp', function (event, path) {
        closeApp();
    });

    ipc.on('minimizeApp', function (event, path) {
        minimizeApp();
    });

    ipc.on('maximizeApp', function (event, path) {
        toggleMaximizeApp();
    });
}

app.on('ready', () => {
    createWindow()
})

function closeApp() {
    if (app && !app.isQuiting) {
        app.quit();
    }
}

function minimizeApp() {
    var windows = BrowserWindow.getAllWindows();

    if (windows.length > 0) {
        var mainWindow = windows[0];
        mainWindow.minimize();
    }
}

function toggleMaximizeApp() {
    var windows = BrowserWindow.getAllWindows();

    if (windows.length > 0) {
        var mainWindow = windows[0];
    }

    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    }
}