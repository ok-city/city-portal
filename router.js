const gcloud = require('google-cloud');
const language = gcloud.language;

const languageClient = language({
  projectId: 'naturallanguage-157004',
  keyFilename: './keyfile.json'
});

module.exports = (app, db) => {
  app.get('/', (req, res) => {
    res.status(200).render('index');
  });

  app.get('/getReports/*', (req, res) => {
    const latCenter = parseFloat(req.query.lat);
    const lonCenter = parseFloat(req.query.lon);
    const radius = req.query.radius; // in miles

    const reportsCollection = db.collection('reports');

    reportsCollection.find(
      {
        location: {
          $geoWithin: {$centerSphere: [[lonCenter, latCenter], radius / 3963.2]}
        },
      }, (err, data) => {
        if (!err) {
          data.toArray((err, array) => {
            if (!err) {
              res.status(200).send(array);
            } else {
              res.status(500).send();
              console.error('error getting cursor to array: ' + err);
            }
          });
        } else {
          console.error('error getting finding reports: ' + err);
        }
      });
  });

  app.get('/getSentiment/*', (req, res) => {
    let text = req.query.text;
    getSentiment(text).then((sentiment) => {
      res.status(200).send(sentiment);
    });
  });

  function getSentiment(text) {
    return new Promise((resolve, reject) => {
      languageClient.detectSentiment(text, (err, nuthin, dataz) => {
        if (!err) {
          resolve({
            score: dataz.documentSentiment.score,
            magnitude: dataz.documentSentiment.magnitude
          });
        } else {
          reject(undefined);
        }
      });
    });
  }
};