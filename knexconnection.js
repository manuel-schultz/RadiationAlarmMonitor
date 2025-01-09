const ipcMain = require('electron').ipcMain;
const preferences = require('./filestorageconnection.js').getPreferencesJson();
var knexPath = 'a';


if (preferences['dbConnection'] && preferences['dbConnection']['type'] === 'local') {
    knexPath = preferences['dbConnection']['location'];
}


const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: knexPath
    },
    useNullAsDefault: true
});

async function getDataStructurized(arg) {
    let columns = (typeof arg.columns === 'undefined') ? '*' : arg.columns;
    let filter = (typeof arg.filter === 'undefined') ? {} : arg.filter;
    let table = arg.table;
    return await knex.select(columns).from(table).where(filter);
};

ipcMain.on('get_all_stations', async function (event, arg) {
    let stations = await getDataStructurized({ table: 'stations' });
    event.returnValue = stations;
});

ipcMain.on('get_radiation_values_for_single_station', async function (event, arg) {
    let start = (typeof arg.start === 'undefined') ? new Date().setUTCHours(0, 0, 0) : arg.start;
    let end = (typeof arg.end === 'undefined') ? new Date().setUTCHours(23, 59, 59) : arg.end;

    start = parseInt(start / 1000)
    end = parseInt(end / 1000)

    let radiationLevels = await knex.select('*').from('radiation_levels').where({ station_id: parseInt(arg.station_id) }).where('measured_timestamp', '>=', start).where('measured_timestamp', '<=', end);
    event.returnValue = radiationLevels
});

ipcMain.on('get_min_max_of_all_stations', async function (event, arg) {

    let begin = await knex('radiation_levels').min('measured_at');
    let end = await knex('radiation_levels').max('measured_at');

    event.returnValue = {
        min: begin[0]['min(`measured_at`)'], 
        max: end[0]['max(`measured_at`)']}
});

ipcMain.on('get_latest_radiation_values_for_all_station', async function (event, arg) {
    let timestamp = await knex('radiation_levels').max('measured_timestamp');
    timestamp = timestamp[0]['max(`measured_timestamp`)'];
    let results = await knex.select('*').from('radiation_levels').where({ measured_timestamp: timestamp });

    event.returnValue = results;
});

ipcMain.on('get_radiation_values_for_all_station_of_hour', async function (event, arg) {
    // let timestamp = await knex('radiation_levels').max('measured_timestamp');
    // timestamp = timestamp[0]['max(`measured_timestamp`)'];
    let results = await knex.select('*').from('radiation_levels').where({ measured_timestamp: arg.timestamp });

    event.returnValue = results;
});

ipcMain.on('get_latest_api_call', async function (event, arg) {
    let results = await knex.select('*').from('api_calls').limit(1).orderBy('started_at', 'desc');

    event.returnValue = results;
});

module.exports = {
    getDataStructurized
};