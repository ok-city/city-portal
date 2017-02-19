let map;
function initMap() { // Called by async request to Google
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });

  getUserLocation();
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

  let reports = [];

  let getReportsURL = '/getReports/?lat=' + latitude + '&lon=' + longitude + '&radius=' + 500000;
  httpGetAsync(getReportsURL).then((data) => {
    let reportSentiments = [];
    let jsonData = JSON.parse(data);
    jsonData.forEach((report) => {
      reports.push(report);
      placeReportOnMap(report); // whoosh
      let url = '/getSentiment/?text=' + report.transcript;
      let sentimentHere = httpGetAsync(url);
      reportSentiments.push(sentimentHere); // collect the promises
    });
    return Promise.all(reportSentiments);
  }).then((sentiments) => {
    sentiments.forEach((sentiment, i) => {
      $('#tableOfReports').append(generateHtmlForTableRow(reports[i], sentiment));
      // TODO Add to list of sentiments to retrieve later
    });
  }).catch((statusCode) => {
    console.error('error code: ' + statusCode);
  });
}

function generateHtmlForTableRow(report, sentiment) {
  let td = '';
  let sentimentJSON = JSON.parse(sentiment);
  console.log('sentiment = ' + sentiment);
  if (sentimentJSON.score >= 0.0) {
    td = '<td><img src="/public/images/caret-up.svg" class="sentimentArrow"></td>';
  } else if (sentimentJSON.score <= -0.0) {
    td = '<td><img src="/public/images/caret-down.svg" class="sentimentArrow"></td>';
  } else {
    td = '<td></td>'
  }
  let tr = '<tr><td>' + report.transcript + '</td>' + td + '</tr>';
  console.log('generated tr ' + tr);
  return tr;
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

  let marker = new google.maps.Marker({
    position: reportLocation,
    map: map,
    title: report.transcript
  });

  marker.addListener('click', function () {
    infowindow.open(map, marker);
  });

}

function httpGetAsync(theUrl) {
  console.log('getting async! ');
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
