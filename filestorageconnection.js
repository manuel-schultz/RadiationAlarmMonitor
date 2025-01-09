const remote = require('electron')
const app        = remote.app
const path       = require('path');
const fs         = require('fs');
const ipc        = require('electron').ipcMain;
const folderPath = path.join(app.getPath('userData'), 'data');
const filePath   = path.join(folderPath, 'settings.json');

function getPreferencesJson() {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        const initialData = {};
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
        return initialData;
    } else {
        const fileData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileData);
    }
}

async function savePreferencesJson(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

ipc.on('saveLocalFileStoredData', async function (event, arg) {
    let variableName  = (typeof arg.variable === 'undefined') ? 'nonSpecified' : arg.variable;
    let variableValue = (typeof arg.data === 'undefined') ? 'nonSpecified' : arg.data;

    savedSettings = await getPreferencesJson();

    savedSettings[variableName] = variableValue;

    await savePreferencesJson(savedSettings);
    event.returnValue = true;
});

ipc.on('getPreferencesFileOutput', async function (event, arg) {
    preferencesjson = await getPreferencesJson();
    event.returnValue = preferencesjson;
});

module.exports = {
    getPreferencesJson
};