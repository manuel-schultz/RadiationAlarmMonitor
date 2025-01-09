const jQuery = $        = require('jquery'); 
const electron = require('electron');
const ipc      = electron.ipcRenderer;
const preferences = ipc.sendSync('getPreferencesFileOutput');
const flatpickr = require("flatpickr");

var ctx = document.getElementById('myChart');

$(function() {
    let path = localStorage.getItem('loadedPath');
    if (path) {
        $("html#page-000-index").find("div#programContainer").load(path);
    }
    flatpickr.localize(flatpickr.l10ns.de);
    startLatestRequestJob();
});

Array.prototype.average = function () {
    return this.reduce((a, b) => a + b) / this.length
}

Number.prototype.fixedLength = function(length) {
    let numberStr = this.toString();

    while (numberStr.length < length) {
        numberStr = '0' + numberStr;
    }

    return numberStr;
}

Number.prototype.cutDecimalZeros = function() {
    return parseFloat((this).toFixed(100)).toString();
}

String.prototype.capitalizeOnce = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.capitalize = function () {
    return this.split(' ').map(word => word.capitalizeOnce()).join(' ');
};

String.prototype.isInteger = function () {
    return /^-?\d+$/.test(this);
}

Date.prototype.beginningOfWeek = function () {
    let d = new Date(this.setDate(this.getDate() - this.getDay() + (this.getDay() === 0 ? -6 : 1)));
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

Date.prototype.endOfWeek = function () {
    let d = new Date(this.setDate(this.getDate() + ((this.getDay() === 0 ? 0 : 7) - this.getDay())));
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

Date.prototype.beginningOfMonth = function () {
    return new Date(this.getFullYear(), this.getMonth(), 1, 0, 0, 0, 0);
}

Date.prototype.endOfMonth = function () {
    return new Date(new Date(this.getFullYear(), this.getMonth() + 1, 1, 0, 0, 0, 0) - 1);
}

Date.prototype.dayOfYear = function () {
    return Math.floor((this - new Date(this.getFullYear(), 0, 0)) / 86400000);
}

Date.prototype.weeknumber = function() {
    // Made by AI
    // Kopiere das Datum, um die Originaldaten nicht zu ändern
    let date = new Date(this.getTime());

    // Setze die Stunden auf null, damit die Zeit nicht berücksichtigt wird
    date.setHours(0, 0, 0, 0);

    // Setze den Wochentag auf Donnerstag (vierter Tag der Woche)
    // Da ISO-Wochen Montag als ersten Tag der Woche haben
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

    // Berechne den ersten Donnerstag des Jahres
    let firstThursday = new Date(date.getFullYear(), 0, 4);
    firstThursday.setDate(firstThursday.getDate() + 3 - (firstThursday.getDay() + 6) % 7);

    // Berechne die Kalenderwoche
    let weekNumber = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + (firstThursday.getDay() + 6) % 7) / 7);

    return weekNumber;
}

Date.prototype.format = function (format) {
    // formats found on: https://entrision.com/blog/formatting-dates-in-ruby/
    daysShort = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    daysLong = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    monthsShort = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    monthsLong = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    format = format.replaceAll('%b', monthsShort[this.getMonth()]);                 // 'Jan'        Shortened month name
    format = format.replaceAll('%B', monthsLong[this.getMonth()]);                  // 'Januar'     Full month name
    format = format.replaceAll('%m', (this.getMonth() + 1).fixedLength(2));         // '01'         Numbered month of the year (01..12)
    format = format.replaceAll('%d', (this.getDate()).fixedLength(2));              // '01'         Day of the month (01..31)
    format = format.replaceAll('%j', (this.dayOfYear()).fixedLength(3));            // '001'        Day of the year (001..366)
    format = format.replaceAll('%a', daysShort[this.getDay()]);                     // 'Mo'         Shortened weekday name
    format = format.replaceAll('%A', daysLong[this.getDay()]);                      // 'Montag'     Full weekday name
    format = format.replaceAll('%w', ((this.getDay() + 6) % 7).fixedLength(2));     // '01'       	The numeric day of the week (00..06)
    format = format.replaceAll('%W', (this.weeknumber()).fixedLength(2));           // '09'         Numeric week number in the year (00..53)
    format = format.replaceAll('%y', (this.getFullYear() % 100).fixedLength(2));    // '07'         Two-digit year (00..99)
    format = format.replaceAll('%Y', (this.getFullYear()).fixedLength(4));          // '2022'       Four-digit year
    format = format.replaceAll('%H', (this.getHours()).fixedLength(2));             // '18'         Hour of the day (24-Hour-Format) (00..23)
    format = format.replaceAll('%I', (this.getHours() % 12).fixedLength(2));        // '06'         Hour of the day (12-Hour-Format) (01..12)
    format = format.replaceAll('%M', (this.getMinutes()).fixedLength(2));           // '15'         Minute of the hour (00..59)
    format = format.replaceAll('%S', (this.getSeconds()).fixedLength(2));           // '17'         Second of the minute (00..59)
    format = format.replaceAll('%p', (this.getHours() <= 12 ? 'AM' : 'PM'));        // 'AM'         AM or PM

    return format;
}

Date.prototype.addMonths = function (months) {
    // send 'months' as negative to reduce month.
    return new Date(this.getFullYear(), this.getMonth() + months, this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds())
}

function goToPath(path) {
    localStorage.setItem('loadedPath', path);
    window.location.reload();
}

function processMenuBarCloseButtonClick() {
    ipc.send('closeApp');
}

function processMenuBarMinimizeButtonClick() {
    ipc.send('minimizeApp');
}

function processMenuBarMaximizeButtonClick() {
    ipc.send('maximizeApp');
}

function sortStationListByName(stations) {
    return stations.sort(sortStationListByNameAlgorithm);
}

function sortStationListByNameAlgorithm(a, b) {
    var aName = a['german_name'].toLowerCase();
    var bName = b['german_name'].toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function sortRadiationLevelsByDate(radiations, direction = 'ASC') {
    if (direction === 'DESC') {
        return radiations.sort(sortRadiationLevelsByDateDescAlgorithm);
    } else {
        return radiations.sort(sortRadiationLevelsByDateAscAlgorithm);
    }
}

function sortRadiationLevelsByDateAscAlgorithm(a, b) {
    var aDate = new Date(a['measured_at']);
    var bDate = new Date(b['measured_at']);
    return ((aDate < bDate) ? -1 : ((aDate > bDate) ? 1 : 0));
}

function sortRadiationLevelsByDateDescAlgorithm(a, b) {
    var aDate = new Date(a['measured_at']);
    var bDate = new Date(b['measured_at']);
    return ((aDate < bDate) ? 1 : ((aDate > bDate) ? -1 : 0));
}

function displayStationInformationFromSelecttag() {
    let option = $('select#dayChartSelectStation, select#weekChartSelectStation, select#monthChartSelectStation, select#yearChartSelectStation').find('option:selected').eq(0);
    info = {
        id: option.val(),
        station_code: option.data('code'),
        german_name: option[0].label,
        img_coordinates_x: option.data('imgx'),
        img_coordinates_y: option.data('imgy'),
        geo_coordinates_latitude: option.data('lat'),
        geo_coordinates_longitude: option.data('lon'),
        geo_coordinates_elevation: option.data('ele')
    }
    Swal.fire({
        html: createStationInformationHTML(info),
        didOpen: function () {
            recalculateMapMarkerPositions();
        }
    });
}

function displayStationInformationFromMap(marker) {
    marker = $(marker);
    console.log(marker);
    info = {
        id: marker.val(),
        station_code: marker.data('code'),
        german_name: marker.data('stationname'),
        img_coordinates_x: marker.data('imgx'),
        img_coordinates_y: marker.data('imgy'),
        geo_coordinates_latitude: marker.data('lat'),
        geo_coordinates_longitude: marker.data('lon'),
        geo_coordinates_elevation: marker.data('ele')
    }
    Swal.fire({
        html: createStationInformationHTML(info),
        didOpen: function () {
            recalculateMapMarkerPositions();
        }
    });
}

function createStationInformationHTML(info) {
    html = `
        <div>
            <h1 class="zeroMargin">${info.german_name}</h1>
            <div style="text-align: left;">
                <img class="calculateMyRelativePosition" src="assets/img/icons/Waypoint.svg" style="height: 25px; position: relative; left: ${info['img_coordinates_x']}px; top: ${info['img_coordinates_y']}px;" data-x="${info['img_coordinates_x']}" data-y="${info['img_coordinates_y']}">
                <img class="mapForRecalculatingMarkerPositions" src="assets/img/map-AT.png" style="max-width: 100%;">
            </div>
            <div>
                <table style="width: 100%;"><tbody>
                    <tr><td class="leftAligned fontBold">Station</td><td class="rightAligned fontMedium">${info['station_code']}</td></tr>
                    <tr><td class="leftAligned fontBold">Längengrad</td><td class="rightAligned fontMedium">${info['geo_coordinates_longitude']}</td></tr>
                    <tr><td class="leftAligned fontBold">Breitengrad</td><td class="rightAligned fontMedium">${info['geo_coordinates_latitude']}</td></tr>
                    <tr><td class="leftAligned fontBold">Höhe</td><td class="rightAligned fontMedium">${info['geo_coordinates_elevation']}m</td></tr>
                </tbody></table>
            </div>
        </div>
        `
    return html
}

function recalculateMapMarkerPositions() {
    let map = $('img.mapForRecalculatingMarkerPositions');
    let mapWidth = map.width();
    let mapHeight = map.height();
    let mapOriginalWidth = 690;
    let mapOriginalHeight = 352;
    let markers = $('.calculateMyRelativePosition');

    markers.each( function(index, marker) {
        let newX = (parseFloat(marker.dataset.x) / mapOriginalWidth) * mapWidth;
        let newY = (parseFloat(marker.dataset.y) / mapOriginalHeight) * mapHeight;

        if ($(marker).hasClass('positionInParent')) {
            $(marker).parent().css({
                top: `${newY}px`,
                left: `${newX}px`
            })
        } else {
            $(marker).css({
                top: `${newY}px`,
                left: `${newX}px`
            })
        }
    })
}

function replaceSVGs() {
    /*
    * Replace all SVG object-tags with inline SVG!
    * We need this to fill our svg images without
    * having to have ugly inline-svg-code.
    * Code modified from: http://cmsaddons.net/how-to-change-color-of-svg-image-using-css/
    */
   $('object[data$=".svg"], object[data-source$=".svg"], object[data-src$=".svg"]').each(function () {
       let obj = $(this);
        let imgURL = "";
        if (obj.attr('data')) {
            imgURL = obj.attr("data");
        } else if (obj.data('src') != undefined) {
            imgURL = obj.data("src");
        } else {
            imgURL = obj.data("source");
        }
        
        let attributes = obj.prop("attributes");
        let viewbox = obj.data("viewbox");

        $.get(imgURL, function (data) {
            /* Get the SVG tag, ignore the rest */
            var svg = $(data).find("svg");

            /* Remove any invalid XML tags */
            svg = svg.removeAttr("xmlns:a");

            /* Loop through OBJ attributes and apply on SVG */
            $.each(attributes, function () {
                svg.attr(this.name, this.value);
            });
            
            /* Replace IMG with SVG */
            svg.attr("viewBox", viewbox);
            obj.replaceWith(svg);
        }, "xml");
    });
}

function dateToSfwsDateInteger(date) {
    console.log(date);
    let utc = date.setUTCHours(date.getHours());
    console.log(utc);
    let shortUtc = parseInt(utc / 1000);
    console.log(shortUtc);
    return shortUtc;
}

function createFilledArray(value, length) {
    let arry = [];
    for (let i = 0; i < length; i++) {
        arry.push(value);
    }
    return arry;
}

function setActiveStation(id) {
    localStorage.setItem('ActiveStation', id);
}

function openChartViewSettings(period) {
    let html = '<span class="fontbold" style="font-size: 32px; margin-bottom: 32px;">Ansichtseinstellungen</span>'
    let storage = {
        week: {
            daynames: localStorage.getItem('chartViewOptionsWeekDaynames'),
            max: localStorage.getItem('chartViewOptionsWeekMax'),
            min: localStorage.getItem('chartViewOptionsWeekMin'),
            avg: localStorage.getItem('chartViewOptionsWeekAvg'),
            customMin: localStorage.getItem('chartViewOptionsWeekCustomMin'),
            customMax: localStorage.getItem('chartViewOptionsWeekCustomMax'),
            customMinNumber: localStorage.getItem('chartViewOptionsWeekCustomMinNumber'),
            customMaxNumber: localStorage.getItem('chartViewOptionsWeekCustomMaxNumber')
        },
        month: {
            daynumbers: localStorage.getItem('chartViewOptionsMonthDayNumbers'),
            weeknumbers: localStorage.getItem('chartViewOptionsMonthWeekNumbers'),
            max: localStorage.getItem('chartViewOptionsMonthMax'),
            min: localStorage.getItem('chartViewOptionsMonthMin'),
            avg: localStorage.getItem('chartViewOptionsMonthAvg'),
            customMin: localStorage.getItem('chartViewOptionsMonthCustomMin'),
            customMax: localStorage.getItem('chartViewOptionsMonthCustomMax'),
            customMinNumber: localStorage.getItem('chartViewOptionsMonthCustomMinNumber'),
            customMaxNumber: localStorage.getItem('chartViewOptionsMonthCustomMaxNumber')
        }
    }

    if (period == 'week') {
        html += `<div class="flexbox flexcolumn flexgap10 fontmedium">
            <div class="spaceBetweenFlex">
                <span>Tagesindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.week.daynames == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsWeekDaynames', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Maximumindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.week.max == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsWeekMax', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>

            <div class="spaceBetweenFlex">
                <span>Minimumindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.week.min == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsWeekMin', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Durchschnittsindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.week.avg == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsWeekAvg', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Angezeigter Mindestwert</span>
                <div style="display: flex;">
                    <input id="settingCustomMinNumberField" value="${storage.week.customMinNumber}" ${storage.week.customMin == 'true' ? '' : 'disabled="disabled"'} onkeyup="saveChartViewSettingAndReload('chartViewOptionsWeekCustomMinNumber', this.value)" style="width: 100px;" />
                    <label class="switch">
                        <input type="checkbox"${storage.week.customMin == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsWeekCustomMin', this.checked)">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <div class="spaceBetweenFlex">
                <span>Angezeigter Maximalwert</span>
                <div style="display: flex;">
                    <input id="settingCustomMaxNumberField" value="${storage.week.customMaxNumber}" ${storage.week.customMax == 'true' ? '' : 'disabled="disabled"'} onkeyup="saveChartViewSettingAndReload('chartViewOptionsWeekCustomMaxNumber', this.value)" style="width: 100px;" />
                    <label class="switch">
                        <input type="checkbox"${storage.week.customMax == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsWeekCustomMax', this.checked)">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        </div>`;
    } else if (period == 'month') {
        html += `<div class="flexbox flexcolumn flexgap10 fontmedium">
            <div class="spaceBetweenFlex">
                <span>Tagesindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.month.daynumbers == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthDayNumbers', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Wochenindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.month.weeknumbers == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthWeekNumbers', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Maximumindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.month.max == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthMax', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>

            <div class="spaceBetweenFlex">
                <span>Minimumindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.month.min == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthMin', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Durchschnittsindikatoren</span>
                <label class="switch">
                    <input type="checkbox"${storage.month.avg == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthAvg', this.checked)">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="spaceBetweenFlex">
                <span>Angezeigter Mindestwert</span>
                <div style="display: flex;">
                    <input id="settingCustomMinNumberField" value="${storage.month.customMinNumber}" ${storage.month.customMin == 'true' ? '' : 'disabled="disabled"'} onkeyup="saveChartViewSettingAndReload('chartViewOptionsMonthCustomMinNumber', this.value)" style="width: 100px;" />
                    <label class="switch">
                        <input type="checkbox"${storage.month.customMin == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthCustomMin', this.checked)">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            <div class="spaceBetweenFlex">
                <span>Angezeigter Maximalwert</span>
                <div style="display: flex;">
                    <input id="settingCustomMaxNumberField" value="${storage.month.customMaxNumber}" ${storage.month.customMax == 'true' ? '' : 'disabled="disabled"'} onkeyup="saveChartViewSettingAndReload('chartViewOptionsMonthCustomMaxNumber', this.value)" style="width: 100px;" />
                    <label class="switch">
                        <input type="checkbox"${storage.month.customMax == 'true' ? ' checked' : ''} onchange="saveChartViewSettingAndReload('chartViewOptionsMonthCustomMax', this.checked)">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        </div>`;
    }

    Swal.fire({
        html: html,
        didOpen: function () {
            recalculateMapMarkerPositions();
        }
    });
}

function saveChartViewSettingAndReload(setting, val) {
    // TODO: if statements with regex where we just have something like: /^chartViewOptions((Week)|(Month)|(Year))CustomMin$/
    if (setting == 'chartViewOptionsMonthCustomMin' || setting == 'chartViewOptionsWeekCustomMin') {
        if (val) {
            $('input#settingCustomMinNumberField').prop('disabled', '');
        } else {
            $('input#settingCustomMinNumberField').val('auto');
            $('input#settingCustomMinNumberField').trigger('keyup');
            $('input#settingCustomMinNumberField').prop('disabled', 'disabled');
        }
    } else if (setting == 'chartViewOptionsMonthCustomMax' || setting == 'chartViewOptionsWeekCustomMax') {
        if (val) {
            $('input#settingCustomMaxNumberField').prop('disabled', '');
        } else {
            $('input#settingCustomMaxNumberField').val('auto');
            $('input#settingCustomMaxNumberField').trigger('keyup');
            $('input#settingCustomMaxNumberField').prop('disabled', 'disabled');
        }
    } else if (setting == 'chartViewOptionsMonthCustomMinNumber' || setting == 'chartViewOptionsWeekCustomMinNumber') {
        if (val.isInteger()) {
            chart.options.scales.y.min = parseInt(val);
        } else {
            chart.options.scales.y.min = null;
        }
    } else if (setting == 'chartViewOptionsMonthCustomMaxNumber' || setting == 'chartViewOptionsWeekCustomMaxNumber') {
        if (val.isInteger()) {
            chart.options.scales.y.max = parseInt(val);
        } else {
            chart.options.scales.y.max = null;
        }
    }

    localStorage.setItem(setting, val);
    if ($('#page-003-day').length == 1) {

    } else if ($('#page-004-week').length == 1) {
        chart.options.plugins.annotation.annotations = weeklyChartAnnotations();
    } else if ($('#page-005-month').length == 1) {
        chart.options.plugins.annotation.annotations = monthlyChartAnnotations();
    } else if ($('#page-006-year').length == 1) {

    }
    chart.update();
}
startLatestRequestJob
async function setLatestUpdateIndicator() {
    let latestRecord = await ipc.sendSync('get_latest_api_call');
    let latestDate = new Date(latestRecord[0].started_at);

    $("span#programStatusBarUpdatedAtValue").text(latestDate.format('%a, %d. %B %H:%M:%S'));
}

function startLatestRequestJob(timer = 5000) {
    setLatestUpdateIndicator();
    let latestRequestIntervall = setInterval(setLatestUpdateIndicator, timer);
}