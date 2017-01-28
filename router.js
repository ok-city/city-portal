module.exports = (app, db) => {
  app.get('/', (req, res) => {
    res.status(200).send({message: 'Yo!'});
  });

  app.get('/getReports/*', (req, res) => {
    const latCenter = parseFloat(req.query.lat);
    const lonCenter = parseFloat(req.query.lon);
    const recentMillis = parseInt(req.query.recentMillis);
    const radius = req.query.radius;

    if (latCenter && lonCenter && radius) {
      const reportsCollection = db.collection('reports');
      const lastOkMillis = Date.now() - recentMillis;

      reportsCollection.find(
        {
          location: {
            $geoWithin: {$centerSphere: [[lonCenter, latCenter], radius / 3963.2]}
          },
          timestamp: {$gte: lastOkMillis}
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
    }
  })
};