const minMaxData = ipc.sendSync('get_min_max_of_all_stations');
$(function () {
    updateWeeklyData();
    $('#datePickerWeekArea').data('min', minMaxData['min']);
    $('#datePickerWeekArea').data('max', minMaxData['max']);
    setTimeout(function() {
        disableNextLastWeekButtons();
    }, 100);
    replaceSVGs();
    fillFlatpickrAltInputWithWeek();
});

ctx = document.getElementById('myChart');
const daynames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const hours = ['0000', '0100', '0200', '0300', '0400', '0500', '0600', '0700', '0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300']
var xAxis = [];
var defaultValues = [];

$(daynames).each(function() {
    let day = this;
    $(hours).each(function() {
        let hour = this;
        xAxis.push(`${day} ${hour}`)
    });
});

for (let i = 0; i < xAxis.length; i++) {
    defaultValues.push(0);
}

var chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: xAxis,
        datasets: [{
            label: 'nSv/h',
            data: defaultValues
        }]
    },
    options: {
        scales: weeklyChartCustomLimits(),
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            annotation: {
                annotations: weeklyChartAnnotations()
            }
        }
    }
});

fillStationInfo();
const datepicker = flatpickr($('#datePickerWeekInput'), {
    // https://flatpickr.js.org/options/
    altInput: true,
    altFormat: "D, j F Y",
    minDate: minMaxData['min'],
    maxDate: minMaxData['max'],
    defaultDate: (localStorage.getItem('WeeklyDate') || minMaxData['max']),
    weekNumbers: true,
    plugins: [new weekSelect({})],
    onChange: [function () {
        let chosenDate = this.selectedDates[0];
        this.selectedDates[0] = chosenDate.beginningOfWeek();
        this.selectedDates[1] = chosenDate.endOfWeek();
        
        let weekString = this.selectedDates[0].format('%a, %d %B %Y') + '  -  ' + this.selectedDates[1].format('%a, %d %B %Y');
        this.altInput.value = weekString;
        setWeeklyDateStorage();
    }]
});

async function fillStationInfo() {
    let stations = await ipc.sendSync('get_all_stations', {});
    let selectTag = $('select#weekChartSelectStation');
    let allOptGroup = selectTag.find('optgroup#weekChartSelectWeekAll');
    let favouriteOptGroup = selectTag.find('optgroup#weekChartSelectWeekFavourites');
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
        selectTag.val(activeStation).trigger('change');
    }
}

async function updateWeeklyData() {
    let id = $('select#weekChartSelectStation').val();
    let sd = new Date($('input#datePickerWeekInput').val()).beginningOfWeek();
    let ed = new Date($('input#datePickerWeekInput').val()).endOfWeek();

    let val = createFilledArray(0, 7*24);
    let barColors = createFilledArray('transparent', 7*24);
    let levels = [];
    
    let values = await ipc.sendSync('get_radiation_values_for_single_station', { station_id: id, start: sd, end: ed});
    values = sortRadiationLevelsByDate(values);
    
    $(values).each(function () {
        let d = new Date(this['measured_at'] + '+0');
        let i = (parseInt(d.format('%w')) * 24) + d.getHours();
        val[i] = this['measured_radiation_value'];
        barColors[i] = this['hex_color'];
        levels.push(this['measured_radiation_value']);
    });

    $('#myChartMin').val(Math.min(...levels))
    $('#myChartMax').val(Math.max(...levels))
    $('#myChartAvg').val(levels.average())

    chart.data.datasets[0].data = val;
    chart.data.datasets[0].backgroundColor = barColors;
    chart.options.plugins.annotation.annotations = weeklyChartAnnotations();
    chart.update();
}

function changeDate(weeks) {
    let newDate = new Date(new Date($('input#datePickerWeekInput').val()) - ((7 * 24 * 60 * 60 * 1000) * weeks));
    if (weeks > 0 && newDate < new Date(minMaxData['min'])) {
        newDate = new Date(minMaxData['min']);
    } else if (weeks < 0 && newDate > new Date(minMaxData['max'])) {
        newDate = new Date(minMaxData['max']);
    }
    
    let newDateString = `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`;
    datepicker.setDate(newDateString);
    disableNextLastWeekButtons();
    updateWeeklyData();
    fillFlatpickrAltInputWithWeek();
    setWeeklyDateStorage();
}

function disableNextLastWeekButtons() {
    let minDate = new Date($('#datePickerWeekArea').data('min').split(' ')[0]);
    let maxDate = new Date($('#datePickerWeekArea').data('max').split(' ')[0]);
    let curDate = new Date($('input#datePickerWeekInput').val());

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

function fillFlatpickrAltInputWithWeek() {
    let d = new Date($('#datePickerWeekInput').val());
    let weekString = d.beginningOfWeek().format('%a, %d %B %Y') + '  -  ' + d.endOfWeek().format('%a, %d %B %Y');
    datepicker.altInput.value = weekString;
}

function setWeeklyDateStorage() {
    localStorage.setItem('WeeklyDate', $('#datePickerWeekInput').val());
}

function weeklyChartAnnotations() {
    let dayMarkers = [];
    if (localStorage.getItem('chartViewOptionsWeekDaynames') == 'true') {
        $(daynames).each(function(index) {
            let dayMarker = {
                type: 'line',
                scaleID: 'x',
                value: (index * 24),
                backgroundColor: '#f5ff00',
                borderColor: '#f5ff00',
                label: {
                    display: true,
                    backgroundColor: '#f5ff00',
                    borderColor: '#d4db01',
                    color: '#000000',
                    borderRadius: 10,
                    borderWidth: 2,
                    content: (ctx) => daynames[index],
                    position: 'start',
                    xAdjust: 0,
                    rotation: 0
                }
            }
            dayMarkers.push(dayMarker);
        });
    }
    let markers = dayMarkers;

    if (localStorage.getItem('chartViewOptionsWeekMax') == 'true') {
        let maxMarker = {
            type: 'line',
            scaleID: 'y',
            value: (context) => parseFloat($('#myChartMax').val()),
            backgroundColor: '#f5ff00',
            borderColor: '#f5ff00',
            label: {
                display: true,
                backgroundColor: '#f5ff00',
                borderColor: '#d4db01',
                color: '#000000',
                borderRadius: 10,
                borderWidth: 2,
                content: (ctx) => `Max: ${parseFloat($('#myChartMax').val()) }`,
                position: 'center',
                xAdjust: 0,
                rotation: 0
            }
        }
        markers.push(maxMarker);
    }

    if (localStorage.getItem('chartViewOptionsWeekMin') == 'true') {
        let minMarker = {
            type: 'line',
            scaleID: 'y',
            value: (context) => parseFloat($('#myChartMin').val()),
            backgroundColor: '#f5ff00',
            borderColor: '#f5ff00',
            label: {
                display: true,
                backgroundColor: '#f5ff00',
                borderColor: '#d4db01',
                color: '#000000',
                borderRadius: 10,
                borderWidth: 2,
                content: (ctx) => `Min: ${parseFloat($('#myChartMin').val())}`,
                position: 'center',
                xAdjust: 0,
                rotation: 0
            }
        }
        markers.push(minMarker);
    }

    if (localStorage.getItem('chartViewOptionsWeekAvg') == 'true') {
        let avgMarker = {
            type: 'line',
            scaleID: 'y',
            value: (context) => parseFloat($('#myChartAvg').val()),
            backgroundColor: '#f5ff00',
            borderColor: '#f5ff00',
            label: {
                display: true,
                backgroundColor: '#f5ff00',
                borderColor: '#d4db01',
                color: '#000000',
                borderRadius: 10,
                borderWidth: 2,
                content: (ctx) => `avg: ${parseFloat(parseFloat($('#myChartAvg').val()).toFixed(2)).cutDecimalZeros() }`,
                position: 'center',
                xAdjust: 0,
                rotation: 0
            }
        }
        markers.push(avgMarker);
    }

    return markers;
}

function weeklyChartCustomLimits() {
    let scales = { y: { beginAtZero: true } };

    if (localStorage.getItem('chartViewOptionsWeekCustomMin') == 'true') {
        scales.y.min = parseInt(localStorage.getItem('chartViewOptionsWeekCustomMinNumber'));
    }
    if (localStorage.getItem('chartViewOptionsWeekCustomMax') == 'true') {
        scales.y.max = parseInt(localStorage.getItem('chartViewOptionsWeekCustomMaxNumber'));
    }

    return scales;
}