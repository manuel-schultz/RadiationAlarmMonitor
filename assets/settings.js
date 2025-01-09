function saveDatabaseConnection(connectionType) {
    let connection;
    if (connectionType === 'local') {
        let file = $('input[type="file"]')[0].files[0];
        let path = file.path;
        connection = {
            type: 'local',
            fileType: file.type.split('.').at(-1).split('/').at(-1),
            location: path
        }
    }
    ipc.sendSync('saveLocalFileStoredData', { variable: 'dbConnection', data: connection });
}

async function saveMapMarker() {
    let value = $('input[name="mapmarkers"]:checked').val();
    await ipc.sendSync('saveLocalFileStoredData', { variable: 'mapMarkers', data: ($('input[name="mapmarkers"]:checked').val() === 'true') });
}