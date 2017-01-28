require('dotenv').config();
const port = process.env.PORT;
const mongoURL = process.env.MONGODB_URL;

let morgan = require('morgan'); //Logs HTTP requests

let express = require('express');
let app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

let mongodbClient = require('mongodb').MongoClient;

app.use(morgan('dev')); // log every request to the console
mongodbClient.connect(mongoURL).then((db) => {
  require('./router.js')(app, db);
app.listen(port);
console.info('Listening on port ' + port);
}).catch((err) => {
  console.error('Error connecting to db: ' + err);
});
