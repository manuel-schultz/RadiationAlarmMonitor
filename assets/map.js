const waypoints = preferences['mapMarkers'];

$(document).ready(function() {
    init();
})

async function init() {
    await getStationsOnMap();
    await replaceSVGs();
    await recalculateMapMarkerPositions();
    setTimeout(function() {
        getColorsOnMap();
        
    }, 100)
}

$("#timeSlider").slider({
    min: -1,
    max: 24,
    value: 16,
    slide: function (event, ui) {
        console.log(ui.value);
        $('#hourIndicator').text(ui.value);
        $('#timeSliderHiddenStorage').val(ui.value);
        updateMapData();
    },
    stop: function(event, ui) {
        if (ui.value == -1) {
            $("#timeSlider").slider('value', 23)
            ui.value = 23;
            changeDate(1);
        } else if (ui.value == 24) {
            $("#timeSlider").slider('value', 0)
            ui.value = 0;
            changeDate(-1);
        }
    }
});

const minMaxData = ipc.sendSync('get_min_max_of_all_stations')
$('#datePickerDayArea').data('min', minMaxData['min']);
$('#datePickerDayArea').data('max', minMaxData['max']);

setTimeout(function () {
    disableNextLastDateButtons();
}, 100)

const datepicker = flatpickr($('#datePickerDayInput'), {
    // https://flatpickr.js.org/options/
    altInput: true,
    altFormat: "D, j F Y",
    minDate: minMaxData['min'],
    maxDate: minMaxData['max'],
    defaultDate: minMaxData['max']
});

async function getStationsOnMap() {
    let stations = await ipc.sendSync('get_all_stations', {});
    let tag;
    let x = 0;
    let y = 0;
    if (waypoints) {
        tag = `<object class="calculateMyRelativePosition stationWaypoint positionInParent height22 stroke10" data-src="assets/img/icons/Waypoint.svg"`;
    } else {
        tag = `<div class="calculateMyRelativePosition stationpoint positionInParent"`;
    }
    $(stations).each(function(index, station) {
        if (waypoints) {
            x = station['img_coordinates_x'] - 6;
            y = station['img_coordinates_y'] - 18;
        } else {
            x = station['img_coordinates_x'] - 5;
            y = station['img_coordinates_y'] - 5;
        }
        
        let htmlElement = `
            <div style="height: 0px; width: 0px; position: relative; left: ${x}px; top: ${y}px;">
                ${tag}
                data-x="${x}" 
                data-y="${y}" 
                data-stationId="${station['id']}"
                data-stationName="${station['german_name']}"
                data-lat="${station['geo_coordinates_latitude']}" 
                data-lon="${station['geo_coordinates_longitude']}" 
                data-ele="${station['geo_coordinates_elevation']}" 
                data-imgx="${station['img_coordinates_x']}" 
                data-imgy="${station['img_coordinates_y']}" 
                data-code="${station['station_code']}"
                onclick="displayStationInformationFromMap(this)">
                ${(false) ? '</div>' : ''}
                </div>
            `
        $('#mapStationsContainer').append(htmlElement);
    })
}

async function getColorsOnMap() {
    let latestRecords = await ipc.sendSync('get_latest_radiation_values_for_all_station', {});
    if (waypoints) {
        $('svg.stationWaypoint').each(function(index) {
            record = latestRecords.find((x) => x.station_id == $(this).data('stationid'));
            $(this).css({
                fill: record.hex_color
            });
            let dateParts = record['measured_at'].split(' ')[0].split('-');
            let timeParts = record['measured_at'].split(' ')[1].split(':');
            tippy(this, {
                content: `
                    <span class="fontBold">${$(this).data('stationname')}</span><br />
                    <span class="fontMedium" style="color: aqua;">${record['measured_radiation_value']} nSv/h</span><br/>
                    <span class="fontMedium" style="font-size: 10px;">Am: ${dateParts[2]}.${dateParts[1]}.${dateParts[0]}</span><br />
                    <span class="fontMedium" style="font-size: 10px;">Um: ${timeParts[0]}:${timeParts[1]}</span>`,
                allowHTML: true,
            });
        });
    } else {
        $('div.stationpoint').each(function (index) {
            record = latestRecords.find((x) => x.station_id == $(this).data('stationid'));
            $(this).css({
                backgroundColor: record.hex_color
            })
            let dateParts = record['measured_at'].split(' ')[0].split('-');
            let timeParts = record['measured_at'].split(' ')[1].split(':');
            tippy(this, {
                content: `
                    <span class="fontBold">${$(this).data('stationname')}</span><br />
                    <span class="fontMedium" style="color: aqua;">${record['measured_radiation_value']} nSv/h</span><br/>
                    <span class="fontMedium" style="font-size: 10px;">Am: ${dateParts[2]}.${dateParts[1]}.${dateParts[0]}</span><br />
                    <span class="fontMedium" style="font-size: 10px;">Um: ${timeParts[0]}:${timeParts[1]}</span>`,
                allowHTML: true,
            });
        });
    }
}

async function updateMapData() {
    let dateParts = $('input#datePickerDayInput').val().split('-');
    let date = new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2], $('#timeSliderHiddenStorage').val())
    let measuredTime = dateToSfwsDateInteger(date);

    let allRecordsOfHour = await ipc.sendSync('get_radiation_values_for_all_station_of_hour', {timestamp: measuredTime});

    if (waypoints) {
        $('svg.stationWaypoint').each(function (index) {
            record = allRecordsOfHour.find((x) => x.station_id == $(this).data('stationid'));
            $(this).css({
                fill: record.hex_color
            });
            let dateParts = record['measured_at'].split(' ')[0].split('-');
            let timeParts = record['measured_at'].split(' ')[1].split(':');
            tippy(this, {
                content: `
                    <span class="fontBold">${$(this).data('stationname')}</span><br />
                    <span class="fontMedium" style="color: aqua;">${record['measured_radiation_value']} nSv/h</span><br/>
                    <span class="fontMedium" style="font-size: 10px;">Am: ${dateParts[2]}.${dateParts[1]}.${dateParts[0]}</span><br />
                    <span class="fontMedium" style="font-size: 10px;">Um: ${timeParts[0]}:${timeParts[1]}</span>`,
                allowHTML: true,
            });
        });
    } else {
        $('div.stationpoint').each(function (index) {
            record = allRecordsOfHour.find((x) => x.station_id == $(this).data('stationid'));
            $(this).css({
                backgroundColor: record.hex_color
            })
            let dateParts = record['measured_at'].split(' ')[0].split('-');
            let timeParts = record['measured_at'].split(' ')[1].split(':');
            tippy(this, {
                content: `
                    <span class="fontBold">${$(this).data('stationname')}</span><br />
                    <span class="fontMedium" style="color: aqua;">${record['measured_radiation_value']} nSv/h</span><br/>
                    <span class="fontMedium" style="font-size: 10px;">Am: ${dateParts[2]}.${dateParts[1]}.${dateParts[0]}</span><br />
                    <span class="fontMedium" style="font-size: 10px;">Um: ${timeParts[0]}:${timeParts[1]}</span>`,
                allowHTML: true,
            });
        });
    }
}

function changeDate(days) {
    let newDate = new Date(new Date($('input#datePickerDayInput').val()) - ((24 * 60 * 60 * 1000) * days));
    let newDateString = `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`;
    datepicker.setDate(newDateString);
    disableNextLastDateButtons();
    updateMapData();
}

function changeHour(hours) {
    let wantedValue = $("#timeSlider").slider('value') + hours;
    if (wantedValue == -1) {
        wantedValue = 23;
        changeDate(1);
    } else if (wantedValue == 24) {
        wantedValue = 0;
        changeDate(-1);
    }
    $("#timeSlider").slider('value', wantedValue);
    $('#hourIndicator').text(wantedValue);
    $('#timeSliderHiddenStorage').val(wantedValue)
    updateMapData();
}

function disableNextLastDateButtons() {
    let minDate = new Date($('#datePickerDayArea').data('min').split(' ')[0]);
    let maxDate = new Date($('#datePickerDayArea').data('max').split(' ')[0]);
    let curDate = new Date($('input#datePickerDayInput').val());

    if (curDate <= minDate) {
        $('#dateLastButton').prop('disabled', true);
        $('#dateLastButton').find('svg').addClass('fillLightGray');
    } else {
        $('#dateLastButton').prop('disabled', false);
        $('#dateLastButton').find('svg').removeClass('fillLightGray');
    }

    if (curDate >= maxDate) {
        $('#dateNextButton').prop('disabled', true);
        $('#dateNextButton').find('svg').addClass('fillLightGray');
    } else {
        $('#dateNextButton').prop('disabled', false);
        $('#dateNextButton').find('svg').removeClass('fillLightGray');
    }
}