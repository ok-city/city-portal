let lat = undefined;
let lon = undefined;

google.charts.load('current', {'packages': ['corechart']});
google.charts.load('current', {'packages': ['annotatedtimeline']});
google.charts.setOnLoadCallback(startDrawingCharts);

function startLoadingBar() {
  console.log('started loading bar');
  $('.loadingBarDiv').append('<div class="mdl-progress  mdl-js-progress mdl-progress__indeterminate header-progress" id="loadingBar"></div>');
  componentHandler.upgradeDom(); // v. important
}

function stopLoadingBar() {
  $('.loadingBarDiv').empty();
}

function startDrawingCharts() {
  startLoadingBar();
  getUserLocation().then((location) => {
    lat = location.lat;
    lon = location.lon;
  }).then(() => {
    let promises = [drawSentimentPieChart(), drawSentimentLineChart()];
    return Promise.all(promises);
  }).then(() => {
    stopLoadingBar();
  }).catch((err) => {
    console.error('error drawing charts: ' + err);
  });
}

// Sentiment Pie Chart --------------------------------------------------------
function drawSentimentPieChart() {
  return new Promise((resolve, reject) => {
    getSentiments(lat, lon, 5000).then((sentiments) => {
      console.log('got sentiments');
      let data = google.visualization.arrayToDataTable([
        ['Sentiment', 'Count'],
        ['Positive', sentiments.positive],
        ['Negative', sentiments.negative]
      ]);
      let options = {
        title: 'Current Overall City Sentiment',
      };
      new google.visualization.PieChart($('#sentiment-pie')[0]).draw(data, options);
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
}

function getSentiments(radius) {
  return new Promise((resolve, reject) => {
    console.log('get sentiments');
    httpGetAsync('/getReports/?lat=' + lat + '&lon=' + lon + '&radius=' + radius).then((results) => {
      let jsonReports = JSON.parse(results);
      let positiveSentiments = jsonReports.reduce((acc, report) => acc + ((report.sentiment.score >= 0) ? 1 : 0), 0);
      let negativeSentiments = jsonReports.reduce((acc, report) => acc + ((report.sentiment.score < 0) ? 1 : 0), 0);
      resolve({positive: positiveSentiments, negative: negativeSentiments});
    }).catch((err) => {
      reject(err);
    });
  });
}

// Sentiment Line Chart -------------------------------------------------------
function getReports() {
  return httpGetAsync('/getReports/?lat=' + lat + '&lon=' + lon + '&radius=' + 5000);
}

function drawSentimentLineChart() {
  return new Promise((resolve, reject) => {
    console.log('drawing sentiment line chart');
    getReports().then((results) => {
      const jsonReports = JSON.parse(results);
      jsonReports.sort((a, b) => { // sort by timestamp, hopefully ascending
        return a.timestamp - b.timestamp;
      });

      const data = new google.visualization.DataTable();
      data.addColumn('date', 'Date');
      data.addColumn('number', 'Positive');
      data.addColumn('number', 'Negative');
      jsonReports.forEach((report, i, reports) => {
        // let date = new Date(report.timestamp / 1000).toUTCString();
        const date = new Date(report.timestamp * 1000);
        const positiveSentiments = reports.slice(0, i).reduce((acc, report) => acc + ((report.sentiment.score >= 0) ? 1 : 0), 0);
        const negativeSentiments = reports.slice(0, i).reduce((acc, report) => acc + ((report.sentiment.score < 0) ? 1 : 0), 0);
        const percentPositive = positiveSentiments / (jsonReports.length) * 100;
        const percentNegative = negativeSentiments / (jsonReports.length) * 100;
        data.addRow([date, percentPositive, percentNegative]);
      });
      const materialChart = new google.visualization.AnnotatedTimeLine($('#sentiment-timeline')[0]);
      materialChart.draw(data, {displayAnnoations: true});
      resolve();
    });
  });
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        console.log('got geolocation');
        resolve({lat: position.coords.latitude, lon: position.coords.longitude});
      });
    } else {
      alert('Geolocation is not supported by this browser');
      reject(undefined);
    }
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