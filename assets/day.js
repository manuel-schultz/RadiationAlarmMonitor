const minMaxData = ipc.sendSync('get_min_max_of_all_stations')
$(function () {
    updateDailyData();
    $('#datePickerDayArea').data('min', minMaxData['min']);
    $('#datePickerDayArea').data('max', minMaxData['max']);
    setTimeout(function() {
        disableNextLastDayButtons();
    }, 100)
    replaceSVGs();
});

ctx = document.getElementById('myChart');
const hours = ['0000', '0100', '0200', '0300', '0400', '0500', '0600', '0700', '0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300']
var chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: hours,
        datasets: [{
            label: 'nSv/h',
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index',
        }
    }
});

fillStationInfo();
const datepicker = flatpickr($('#datePickerDayInput'), {
    // https://flatpickr.js.org/options/
    altInput: true,
    altFormat: "D, j F Y",
    minDate: minMaxData['min'],
    maxDate: minMaxData['max'],
    defaultDate: (localStorage.getItem('DailyDate') || minMaxData['max']),
    onChange: [function () {
        setDailyDateStorage();
    }]
});

async function fillStationInfo() {
    let stations = await ipc.sendSync('get_all_stations', {});
    let selectTag = $('select#dayChartSelectStation');
    let allOptGroup = selectTag.find('optgroup#dayChartSelectDayAll');
    let favouriteOptGroup = selectTag.find('optgroup#dayChartSelectDayFavourites');
    let preferences = ipc.sendSync('getPreferencesFileOutput', {});
    stations = sortStationListByName(stations);
    let activeStation = localStorage.getItem('ActiveStation');

    $(preferences['favouriteStations']).each(function (index, id) {
        let station = stations.find((station) => station.id == id);
        let selectOption = $('<option />');
        selectOption.val(station['id']);
        selectOption.text(station['german_name']);
        selectOption.data({
            'lat': station['geo_coordinates_latitude'],
            'lon': station['geo_coordinates_longitude'],
            'ele': station['geo_coordinates_elevation'],
            'imgx': station['img_coordinates_x'],
            'imgy': station['img_coordinates_y'],
            'code': station['station_code']
        });
        favouriteOptGroup.append(selectOption);
    });

    $(stations).each(function (index, station) {
        let selectOption = $('<option />');
        selectOption.val(station['id']);
        selectOption.text(station['german_name']);
        selectOption.data({ 
            'lat': station['geo_coordinates_latitude'], 
            'lon': station['geo_coordinates_longitude'], 
            'ele': station['geo_coordinates_elevation'],
            'imgx': station['img_coordinates_x'],
            'imgy': station['img_coordinates_y'],
            'code': station['station_code']
        });
        allOptGroup.append(selectOption);
    });

    if (activeStation !== null) {
        selectTag.val(activeStation).triggger('change');
    }
}

async function updateDailyData() {
    let id = $('select#dayChartSelectStation').val();
    let sd = new Date($('input#datePickerDayInput').val()).setUTCHours(0, 0, 0, 0);
    let ed = new Date($('input#datePickerDayInput').val()).setUTCHours(23, 59, 59, 999);
    let val = createFilledArray(0, 24);
    let barColors = createFilledArray('transparent', 24);
    let values = await ipc.sendSync('get_radiation_values_for_single_station', { station_id: id, start: sd, end: ed});
    values = sortRadiationLevelsByDate(values);
    console.log(values);
    $(values).each(function() {
        let hour = new Date(this['measured_at']).getHours();
        val[hour] = this['measured_radiation_value'];
        barColors[hour] = this['hex_color'];
    });

    chart.data.datasets[0].data = val;
    chart.data.datasets[0].backgroundColor = barColors;
    chart.update();
}

function changeDate(days) {
    let newDate = new Date(new Date($('input#datePickerDayInput').val()) - ((24 * 60 * 60 * 1000) * days));
    let newDateString = `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`;
    datepicker.setDate(newDateString);
    disableNextLastDayButtons();
    updateDailyData();
    setDailyDateStorage();
}

function disableNextLastDayButtons() {
    let minDate = new Date($('#datePickerDayArea').data('min').split(' ')[0]);
    let maxDate = new Date($('#datePickerDayArea').data('max').split(' ')[0]);
    let curDate = new Date($('input#datePickerDayInput').val());

    if (curDate <= minDate) {
        $('#chartLastButton').prop('disabled', true);
        $('#chartLastButton').find('svg').addClass('fillLightGray');
    } else {
        $('#chartLastButton').prop('disabled', false);
        $('#chartLastButton').find('svg').removeClass('fillLightGray');
    }
    
    if (curDate >= maxDate) {
        $('#chartNextButton').prop('disabled', true);
        $('#chartNextButton').find('svg').addClass('fillLightGray');
    } else {
        $('#chartNextButton').prop('disabled', false);
        $('#chartNextButton').find('svg').removeClass('fillLightGray');
    }
}

function setDailyDateStorage() {
    localStorage.setItem('DailyDate', $('#datePickerDayInput').val());
}