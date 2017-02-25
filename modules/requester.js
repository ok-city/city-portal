let request = require('request');

module.exports.get = function (path) {
  return new Promise((resolve, reject) => {
    let url = process.env.BACKEND_URL + path;
    console.log('Sending request: ' + url);
    request(url, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve(null);
        }
      } else {
        reject(error);
      }
    });
  });
};

module.exports.post = function (path, data) {
  console.log('posting...');
  return new Promise((resolve, reject) => {
    let url = process.env.BACKEND_URL + path;
    console.log('posting to ' + url);
    request.post(url, data, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        console.log('resolving data ' + JSON.stringify(data));
        resolve();
      } else {
        console.log(error + ' rejecting data ' + JSON.stringify(data));
        reject(error);
      }
    });
  });
};

module.exports.delete = function (path, data) {
  return new Promise((resolve, reject) => {
    let url = process.env.BACKEND_URL + path;
    request.delete(url, data, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve();
      } else {
        reject(error);
      }
    })
  })
};