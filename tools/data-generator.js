require('dotenv').config();

let requester = require('../modules/requester');

let timeRange = [1451620898, 1483243298]; // Jan 1 2016 to Jan 1 2017
let numberOfReports = 730;
let latCenter = 38.539974;
let lonCenter = -121.494033;
let possibleReportBase = [
  'Gutter clogged by leaves, water flooding side of road',
  'Awesome food truck at this corner!',
  'Garbage littering Bernardo avenue after garbage truck spill!',
  'Drinking fountain is leaking water near the tennis courts',
  'Dude giving out free pizzas at corner',
  'Spicy meem maker sitting on sidewalk',
  'Traffic light broken from fallen tree',
  'Traffic light finally fixed'
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