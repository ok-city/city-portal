require('dotenv').config();

let requester = require('../modules/requester');

let timeRange = [1451620898, 1483243298]; // Jan 1 2016 to Jan 1 2017
let numberOfReports = 50;
let latCenter = 38.539974;
let lonCenter = -121.494033;
let possibleReportBase = [
  'Gutter clogged by leaves, water flooding side of road',        // negative
  'Awesome food truck at this corner!',                           // positive
  'Garbage littering Bernardo avenue after garbage truck spill!', // negative
  'Drinking fountain is leaking water near the tennis courts',    // negative
  'Salesperson giving out free pizzas at corner',                 // positive
  'Traffic light broken from fallen tree',                        // negative
  'Traffic light finally fixed',                                  // positive
  'Congestion on onramp slowly clearing up',                      // positive
  'Highway expanded to six lanes now!',                           // positive
];

// radius for latitude and longitude
const radius = 1;

let reportsAdd = [];

for (let i = 0; i < numberOfReports; i++) {
  let reportHere = {
    transcript: getRandomReport(),
    lat: getPointFromCenter(latCenter, radius),
    lon: getPointFromCenter(lonCenter, radius),
    timestamp: getRandomTimestamp()
  };
  console.log('i = ' + i + ' | report = ' + reportHere);

  let url = '/addReport/';
  reportsAdd.push(requester.post(url, {form: reportHere}));
}

Promise.all(reportsAdd).then(() => {
  console.log('finished!');
}).catch((err) => {
  console.error('err = ' + err);
});

function getRandomTimestamp() {
  return timeRange[0] + ((timeRange[1] - timeRange[0]) * Math.random());
}

function getPointFromCenter(center, radius) {
  if (Math.random() > 0.5) {
    return center + (Math.random() * radius);
  } else {
    return center - (Math.random() * radius);
  }
}

function getRandomReport() {
  return possibleReportBase[Math.floor(Math.random() * possibleReportBase.length)];
}