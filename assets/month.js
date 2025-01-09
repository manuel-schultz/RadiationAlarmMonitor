const minMaxData = ipc.sendSync('get_min_max_of_all_stations');
const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
$(function () {
    updateMonthlyData();
    $('#datePickerMonthArea').data('min', minMaxData['min']);
    $('#datePickerMonthArea').data('max', minMaxData['max']);
    setTimeout(function() {
        disableNextLastMonthButtons();
    }, 100);
    replaceSVGs();
    // fillFlatpickrAltInputWithMonth();
});

ctx = document.getElementById('myChart');
let defaultValues = [];
let xAxis = setMonthlyXAxis();
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
        scales: monthlyChartCustomLimits(),
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            annotation: {
                annotations: monthlyChartAnnotations()
            }
        }
    }
});

fillStationInfo();
const datepicker = flatpickr($('#datePickerMonthInput'), {
    // https://flatpickr.js.org/options/
    altInput: true,
    altFormat: "D, j F Y",
    minDate: new Date(minMaxData['min']).beginningOfMonth(),
    maxDate: new Date(minMaxData['max']).endOfMonth(),
    defaultDate: (localStorage.getItem('MonthlyDate') || minMaxData['max']),
    monthNumbers: true,
    plugins: [new monthSelectPlugin({})],
    onChange: [function () {
        // chart.data.labels = setMonthlyXAxis();
        // chart.update();
        // let chosenDate = this.selectedDates[0];
        // this.selectedDates[0] = chosenDate.beginningOfMonth();
        // this.selectedDates[1] = chosenDate.endOfMonth();
        
        // let monthString = this.selectedDates[0].format('%a, %d %B %Y') + '  -  ' + this.selectedDates[1].format('%a, %d %B %Y');
        // this.altInput.value = monthString;
        setMonthlyDateStorage();
    }]
});

async function fillStationInfo() {
    let stations = await ipc.sendSync('get_all_stations', {});
    let selectTag = $('select#monthChartSelectStation');
    let allOptGroup = selectTag.find('optgroup#monthChartSelectMonthAll');
    let favouriteOptGroup = selectTag.find('optgroup#monthChartSelectMonthFavourites');
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

function setMonthlyXAxis() {
    let xAxis = [];
    let d = convertMonthYearToDate($('#datePickerMonthInput').val());

    if ($('#datePickerMonthInput').val() == '' && localStorage.getItem('MonthlyDate') != null) {
        d = convertMonthYearToDate(localStorage.getItem('MonthlyDate'));
    }

    let days = d.endOfMonth().getDate();

    for (let date = 1; date <= days; date++) {
        for (let hour = 0; hour < 24; hour++) {
            let currentDate = new Date(new Date(d.setDate(date)).setHours(hour));
            xAxis.push(`${currentDate.format('%a, %d. %B %H00')}`);
        }
    }
    return xAxis;
}

async function updateMonthlyData() {
    chart.data.labels = setMonthlyXAxis();
    chart.update();

    let id = $('select#monthChartSelectStation').val();
    let sd = convertMonthYearToDate($('input#datePickerMonthInput').val()).beginningOfMonth();
    let ed = convertMonthYearToDate($('input#datePickerMonthInput').val()).endOfMonth();

    let val = createFilledArray(0, setMonthlyXAxis.length);
    let barColors = createFilledArray('transparent', setMonthlyXAxis.length);
    let levels = [];

    let values = await ipc.sendSync('get_radiation_values_for_single_station', { station_id: id, start: sd, end: ed});
    values = sortRadiationLevelsByDate(values);

    $(values).each(function () {
        let d = new Date(this['measured_at'] + '+0');
        let i = (parseInt((d.format('%d')) - 1) * 24) + d.getHours();
        val[i] = this['measured_radiation_value'];
        barColors[i] = this['hex_color'];
        levels.push(this['measured_radiation_value']);
    });

    $('#myChartMin').val(Math.min(...levels))
    $('#myChartMax').val(Math.max(...levels))
    $('#myChartAvg').val(levels.average())

    chart.data.datasets[0].data = val;
    chart.data.datasets[0].backgroundColor = barColors;
    chart.options.plugins.annotation.annotations = monthlyChartAnnotations();
    chart.update();
}

function changeDate(months) {
    let newDate = convertMonthYearToDate($('input#datePickerMonthInput').val()).addMonths(months).beginningOfMonth();
    if (months < 0 && newDate < new Date(minMaxData['min'])) {
        newDate = new Date(minMaxData['min']).beginningOfMonth();
    } else if (months > 0 && newDate > new Date(minMaxData['max'])) {
        newDate = new Date(minMaxData['max']).beginningOfMonth();
    }
    
    let newDateString = `${monthNames[newDate.getMonth()]} ${newDate.getFullYear()}`;
    datepicker.setDate(newDateString);
    disableNextLastMonthButtons();
    updateMonthlyData();
    setMonthlyDateStorage();
}

function disableNextLastMonthButtons() {
    let minDate = new Date($('#datePickerMonthArea').data('min').split(' ')[0]);
    let maxDate = new Date($('#datePickerMonthArea').data('max').split(' ')[0]);
    let curDate = new Date(convertMonthYearToDate($('input#datePickerMonthInput').val()));

    console.log(minDate, maxDate, curDate);

    if (curDate.beginningOfMonth() <= minDate) {
        $('#chartLastButton').prop('disabled', true);
        $('#chartLastButton').find('svg').addClass('fillLightGray');
    } else {
        $('#chartLastButton').prop('disabled', false);
        $('#chartLastButton').find('svg').removeClass('fillLightGray');
    }
    
    if (curDate.endOfMonth() >= maxDate) {
        $('#chartNextButton').prop('disabled', true);
        $('#chartNextButton').find('svg').addClass('fillLightGray');
    } else {
        $('#chartNextButton').prop('disabled', false);
        $('#chartNextButton').find('svg').removeClass('fillLightGray');
    }
}

function setMonthlyDateStorage() {
    localStorage.setItem('MonthlyDate', $('#datePickerMonthInput').val());
}

function convertMonthYearToDate(monthYear) {
    let stringVal = monthYear.split(' ');

    return new Date(stringVal[1], monthNames.indexOf(stringVal[0]));
}

function monthlyChartAnnotations() {
    let dayMarkers = [];
    let d = convertMonthYearToDate($('input#datePickerMonthInput').val());

    if (localStorage.getItem('chartViewOptionsMonthDayNumbers') == 'true') {
        for (let i = 1; i <= d.endOfMonth().getDate(); i++) {
            let dayMarker = {
                type: 'line',
                scaleID: 'x',
                value: ((i - 1) * 24),
                backgroundColor: '#f5ff00',
                borderColor: '#f5ff00',
                label: {
                    display: true,
                    backgroundColor: '#f5ff00',
                    borderColor: '#d4db01',
                    color: '#000000',
                    borderRadius: 10,
                    borderWidth: 2,
                    content: (ctx) => `${i}.`,
                    position: 'start',
                    xAdjust: 0,
                    rotation: 0
                }
            }
            dayMarkers.push(dayMarker);
        };
    }
    let markers = dayMarkers;

    if (localStorage.getItem('chartViewOptionsMonthWeekNumbers') == 'true') {
        for (let i = 1; i <= d.endOfMonth().getDate(); i++) {
            if (new Date(d.setDate(i)).getDay() == 1) {
                let weekMarker = {
                    type: 'line',
                    scaleID: 'x',
                    value: ((i - 1) * 24),
                    backgroundColor: '#f5ff00',
                    borderColor: '#f5ff00',
                    label: {
                        display: true,
                        backgroundColor: '#f5ff00',
                        borderColor: '#d4db01',
                        color: '#000000',
                        borderRadius: 10,
                        borderWidth: 2,
                        content: (ctx) => new Date(d.setDate(i)).format('KW %W'),
                        position: 'start',
                        xAdjust: 0,
                        rotation: 0
                    }
                }
                markers.push(weekMarker);
            }
        };
    }

    if (localStorage.getItem('chartViewOptionsMonthMax') == 'true') {
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
                content: (ctx) => `Max: ${parseFloat($('#myChartMax').val())}`,
                position: 'center',
                xAdjust: 0,
                rotation: 0
            }
        }
        markers.push(maxMarker);
    }

    if (localStorage.getItem('chartViewOptionsMonthMin') == 'true') {
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

    if (localStorage.getItem('chartViewOptionsMonthAvg') == 'true') {
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
                content: (ctx) => `avg: ${parseFloat(parseFloat($('#myChartAvg').val()).toFixed(2)).cutDecimalZeros()}`,
                position: 'center',
                xAdjust: 0,
                rotation: 0
            }
        }
        markers.push(avgMarker);
    }

    return markers;
}

function monthlyChartCustomLimits() {
    let scales = {y: {beginAtZero: true}};

    if (localStorage.getItem('chartViewOptionsMonthCustomMin') == 'true') {
        scales.y.min = parseInt(localStorage.getItem('chartViewOptionsMonthCustomMinNumber'));
    }
    if (localStorage.getItem('chartViewOptionsMonthCustomMax') == 'true') {
        scales.y.max = parseInt(localStorage.getItem('chartViewOptionsMonthCustomMaxNumber'));
    }

    return scales;
}