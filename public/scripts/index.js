let map;
let totalReports = []; // contains reports
let totalMarkers = []; // contains markers
function initMap() { // Called by async request to Google
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });

  $('#searchInput').keypress((e) => {
    if (e.keyCode === 13) {
      let query = $('#searchInput').val();
      console.log('searching for ' + query);
      applyFilterToMarkers(query);
      $('#queryText').text('Query: ' + query);
    }
  });

  $('#resolveButton').click(() => {
    let idsToResolve = totalReports.filter(report => $('#checkbox_report_' + report._id).is(':checked'))
      .map(report => report._id);
    resolveReports(idsToResolve).then(() => {
      getUserLocation();
    }).catch((err) => {
      console.error('error: ' + err);
    });
  });

  $('#resolvedFilter').click(() => {
    $('#resolvedFilter').toggleClass('enabledFilter');
    if ($('#resolvedFilter').hasClass('enabledFilter')) {
      displayResolvedReports();
    } else {
      displayUnresolvedReports();
    }
  });

  startSpinningSpinner();
  getUserLocation();
}

function startSpinningSpinner() {
  $('#loadingSpinner').addClass('is-active');
}

function stopSpinningSpinner() {
  $('#loadingSpinner').removeClass('is-active');
}

function displayCertainReports(filter) {
  return new Promise((resolve, reject) => {
    let idsOfMarkersThatShouldBeOnMap = totalReports
      .filter(report => filter(report))
      .map(report => report._id);
    removeAllReportsFromTable();
    idsOfMarkersThatShouldBeOnMap // Add the reports to the table
      .forEach(id => totalReports.filter(report => report._id === id)
        .forEach(report => addReportToTable(report)));
    totalMarkers // Remove nonmatching markers from the map
      .filter(marker => !idsOfMarkersThatShouldBeOnMap.includes(marker._id))
      .forEach(marker => marker.setMap(null));
    totalMarkers // Add matching markers to the map
      .filter(marker => idsOfMarkersThatShouldBeOnMap.includes(marker._id))
      .forEach(marker => marker.setMap(map));
    panMapToMarker(idsOfMarkersThatShouldBeOnMap[0]).then(() => {
      resolve();
    }).catch(() => {
      reject();
    });
  });
}

function displayResolvedReports() {
  startSpinningSpinner();
  displayCertainReports(report => report.resolved).then(() => {
    stopSpinningSpinner();
  });
}

function displayUnresolvedReports() {
  startSpinningSpinner();
  displayCertainReports(report => !report.resolved).then(() => {
    stopSpinningSpinner();
  });
}

function applyFilterToMarkers(term) {
  return displayCertainReports(report => report.transcript.toLowerCase().includes(term.toLowerCase()));
}

function resolveReports(ids) {
  return new Promise((resolve, reject) => {
    const resolveUrl = '/resolve/';
    let resolves = [];
    ids.forEach((id) => {
      resolves.push(httpPostAsync(resolveUrl, '_id=' + id));
    });
    Promise.all(resolves).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
}

function getUserLocation() {
  startSpinningSpinner();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      centerMap(position.coords.latitude, position.coords.longitude);
    });
  } else {
    alert('Geolocation is not supported by this browser');
  }
}

function centerMap(latitude, longitude) {
  let position = new google.maps.LatLng(latitude, longitude);
  let myOptions = {
    zoom: 16,
    center: position,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map(document.getElementById("map"), myOptions);

  google.maps.event.addListener(map, 'dragend', function (event) {
    // Query again for more reports
  });

  google.maps.event.addListener(map, 'zoom_changed', function () {
    zoomLevel = map.getZoom();
  });

  getReportsInArea(latitude, longitude);
}

function getReportsInArea(latitude, longitude) {
  // Get all reports everywhere ¯\_(ツ)_/¯
  totalReports = [];
  totalMarkers = [];
  const getReportsURL = '/getReports/?lat=' + latitude + '&lon=' + longitude + '&radius=' + 500000;
  httpGetAsync(getReportsURL).then((data) => {
    console.log('report = ' + data);
    let jsonData = JSON.parse(data);
    jsonData.forEach((report) => {
      totalReports.push(report);
      // These must be called to create all the markers on the map, or else displayUnresolvedReports and such do not work.
      placeReportOnMap(report);
      addReportToTable(report);
    });
    displayUnresolvedReports();
  }).catch((statusCode) => {
    console.error('error code: ' + statusCode);
  });
}

/*
 {
 "_id":"588cf31775ed5d680745be4c",
 "location":{
 "coordinates":[0,0],
 "type":"Point"
 },
 "transcript":"Offshore drilling rig explosion, plz send halp",
 "timestamp":null
 },
 {
 "_id":"588ec1b44bbd3968a3b8cd69",
 "location":{
 "coordinates":[-122.06494,37.377958],
 "type":"Point"
 },
 "transcript":"\"Pool filter is clogged.\"",
 "timestamp":1485750687218000
 }


 db.reports.insert({"location":{"coordinates":[37.382592,-122.067452],"type":"Point"},"transcript":"Offshore drilling rig explosion, plz send halp","timestamp":null}
 */

// true for thumbs up, false for thumbs down
function shouldBeThumbsUp(report) {
  return report.sentiment.score >= 0.1
}

function addReportToTable(report) {
  let td = '';
  if (shouldBeThumbsUp(report)) {
    td = '<td id="sentimentIconData"><img src="/public/images/thumbup.svg" class="sentimentIcon"></td>';
  } else {
    td = '<td id="sentimentIconData"><img src="/public/images/thumbdown.svg" class="sentimentIcon"></td>';
  }
  let id = 'report_' + report._id;
  let tr = "";
  if (report.resolved) {
    tr += '<tr class="resolvedReportRow" id="' + id + '">';
  } else {
    tr += '<tr id="' + id + '">';
  }
  tr = tr +
    '<td>' +
    '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select" for="checkbox_' + id + '">' +
    '<input type="checkbox" id="checkbox_' + id + '" class="mdl-checkbox__input"/>' +
    '</label>' +
    '</td>' +
    '<td class="transcriptText">' +
    report.transcript +
    '</td>'
    + td +
    '</tr>';
  $('#tableOfReports').append(tr);
  $('#' + id).click(() => {
    panMapToMarker(report._id);
  });
  $('#checkbox_' + id).click(() => {
    if ($('#checkbox_' + id).is(':checked')) {
      // enable the resolve buttons
      $('.selectedReportButton').prop('disabled', false);
    } else {
      // check if any other checkboxes are checked
      if (totalReports.every(report => !$('#checkbox_report_' + report._id).is(':checked'))) {
        $('.selectedReportButton').prop('disabled', true);
      }
    }
  });
  componentHandler.upgradeDom('MaterialCheckbox');
}

function removeAllReportsFromTable() {
  $('#tableOfReports').find('tr').has('td').remove();
}

function closeMarkerInfoWindows() {
  totalMarkers.forEach(marker => marker.infoWindow.close());
}

function panMapToMarker(reportID) {
  return new Promise((resolve, reject) => {
    let markerToPanTo = totalMarkers.filter(marker => marker._id === reportID)[0];
    closeMarkerInfoWindows();
    map.panTo(markerToPanTo.position);
    markerToPanTo.infoWindow.open(map, markerToPanTo);
    resolve();
  });
}

/*
 function placeSentimentOnMap(sentiment, report) {

 let theActualReport = JSON.parse(report)[0];
 let opacity = Math.min(Math.min(sentiment.magnitude, 0), 1);
 // let redComponent =

 console.log('theActualReport = ' + theActualReport);
 console.log('coordinates = ' + theActualReport.location.coordinates);

 let sentimentCircle = new google.maps.Circle({
 strokeColor: '#FF0000',
 strokeOpacity: 0.8,
 strokeWeight: 2,
 fillColor: '#ff7663',
 fillOpacity: 0.35,
 map: map,
 center: {lat: theActualReport.location.coordinates[1],
 lng: theActualReport.location.coordinates[0]},
 radius: 10
 });
 }
 */

function placeReportOnMap(report) {
  let reportLocation = new google.maps.LatLng(
    report.location.coordinates[1], report.location.coordinates[0]);

  let t = new Date(report.timestamp / 1000);
  let dateTime = t.toUTCString();

  let contentString = '<div id="content">' +
    '</div>' +
    '<div id="bodyContent">' +
    '<p>' + report.transcript + '</p>' +
    '<p>' + dateTime + '</p>' +
    '</div>';

  let infowindow = new google.maps.InfoWindow({
    content: contentString
  });

  let markerImage = {
    size: new google.maps.Size(20, 32),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(10, 32)
  };

  if (shouldBeThumbsUp(report)) {
    markerImage.url = '/public/images/markerGreen.svg';
  } else {
    markerImage.url = '/public/images/markerRed.svg';
  }

  let marker = new google.maps.Marker({
    position: reportLocation,
    icon: markerImage,
    map: map,
    title: report.transcript,
    infoWindow: infowindow,
    _id: report._id
  });

  totalMarkers.push(marker);

  marker.addListener('click', function () {
    infowindow.open(map, marker);
  });
}

function httpGetAsync(url) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", url, true); // true for asynchronous
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200 || request.status === 304) {
          resolve(request.responseText);
        } else {
          reject(request.status);
        }
      }
    };
    request.send(null);
  });
}

function httpPostAsync(url, params) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("POST", url, true); // true for asynchronous
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200 || request.status === 304) {
          resolve(request.responseText);
        } else {
          reject(request.status);
        }
      }
    };
    console.log('params = ' + params);
    request.send(params);
  });
}
