google.charts.load('current', {'packages': ['corechart']});
google.charts.setOnLoadCallback(startDrawingCharts);

function startLoadingBar() {
  $('.loadingBarDiv').append('<div class="mdl-progress  mdl-js-progress mdl-progress__indeterminate header-progress" id="loadingBar"></div>');
  componentHandler.upgradeDom(); // v. important
}

function stopLoadingBar() {
  $('.loadingBarDiv').empty();
}

function startDrawingCharts() {
  startLoadingBar();
  let promises = [drawSentimentPieChart()];
  Promise.all(promises).then(() => {
    stopLoadingBar();
  });
}

// Sentiment Pie Chart --------------------------------------------------------
function drawSentimentPieChart() {
  return new Promise((resolve, reject) => {
    getUserLocation().then((data) => {
      return getSentiments(data.lat, data.lon, 5000);
    }).then((sentiments) => {
      let data = google.visualization.arrayToDataTable([
        ['Sentiment', 'Count'],
        ['Positive', sentiments.positive],
        ['Negative', sentiments.negative]
      ]);
      let options = {
        title: 'Overall City Sentiment',
      };
      new google.visualization.PieChart($('#piechart')[0]).draw(data, options);
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });
}

function getSentiments(lat, lon, radius) {
  return new Promise((resolve, reject) => {
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

//

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
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