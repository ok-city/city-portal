let request = require('./requester');

module.exports = (app, db) => {
  app.get('/', (req, res) => {
    res.status(200).render('index');
  });

  app.get('/statistics/', (req, res) => {
    res.status(200).render('statistics');
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

  app.post('/resolve/', (req, res) => {
    const url = '/resolve/';
    request.post(url, {form: {_id: req.body._id}}).then(() => {
      res.status(200).send();
    }).catch((err) => {
      if (err) {
        console.log('errored with ' + err);
        res.status(500).send(err);
      } else {
        res.status(400).send();
      }
    });
  });
};