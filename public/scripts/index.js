let map;
let totalReports = []; // contains reports
let totalMarkers = []; // contains markers
let reportsOnMap = []; // {report: report, sentiment: {score: score, magnitude: magnitude}}
function initMap() { // Called by async request to Google
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });

  $('#searchInput').keypress((e) => {
    if (e.keyCode === 13) {
      let query = $('#searchInput').val();
      console.log('searching for ' + query);
      filterMarkers(query);
      $('#queryText').text('Query: ' + query);
    }
  });

  getUserLocation();
}

function filterMarkers(term) {
  let idsOfMarkersThatShouldBeOnMap = totalReports
    .filter(report => report.transcript.toLowerCase().includes(term.toLowerCase()))
    .map(report => report._id);
  removeAllReportsFromTable();
  idsOfMarkersThatShouldBeOnMap
    .forEach(id => totalReports.filter(report => report._id === id)
      .forEach(report => addReportToTable(report)));
  totalMarkers
    .filter(marker => !idsOfMarkersThatShouldBeOnMap.includes(marker._id))
    .forEach(marker => marker.setMap(null));
  totalMarkers
    .filter(marker => idsOfMarkersThatShouldBeOnMap.includes(marker._id))
    .forEach(marker => marker.setMap(map));
  panMapToMarker(idsOfMarkersThatShouldBeOnMap[0]);
}

function getUserLocation() {
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

  let getReportsURL = '/getReports/?lat=' + latitude + '&lon=' + longitude + '&radius=' + 500000;
  httpGetAsync(getReportsURL).then((data) => {
    console.log('report = ' + data);
    let jsonData = JSON.parse(data);
    jsonData.forEach((report) => {
      totalReports.push(report);
      placeReportOnMap(report);
      addReportToTable(report);
    });
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
  let tr = '<tr id="' + id + '"><td class="transcriptText">' + report.transcript + '</td>' + td + '</tr>';
  $('#tableOfReports').append(tr);
  $('#' + id).click(() => {
    panMapToMarker(report._id);
  });
}

function removeAllReportsFromTable() {
  $('#tableOfReports').find('tr').has('td').remove();
}

function closeMarkerInfoWindows() {
  totalMarkers.forEach(marker => marker.infoWindow.close());
}
function panMapToMarker(reportID) {
  let markerToPanTo = totalMarkers.filter(marker => marker._id === reportID)[0];
  closeMarkerInfoWindows();
  map.panTo(markerToPanTo.position);
  markerToPanTo.infoWindow.open(map, markerToPanTo);
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

function httpGetAsync(theUrl) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", theUrl, true); // true for asynchronous
    request.send(null);
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200 || request.status === 304) {
          // console.log('resolving with data: ' + request.responseText);
          resolve(request.responseText);
        } else {
          console.log('rejecting!');
          reject(request.status);
        }
      }
    };
  });
}
