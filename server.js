require('dotenv').config();
const port = process.env.PORT;
const mongoURL = process.env.MONGODB_URL;

let morgan = require('morgan'); //Logs HTTP requests

let express = require('express');
let app = express();

let session = require('express-session');
let lusca = require('lusca');
app.use(session({
  secret: 'supercauliflowerexplosions123$567*9*',
  resave: true,
  saveUninitialized: true
}));

app.use(lusca({
  csrf: true,
  // csp: {policy: {
  //   'default-src': '\'self\''
  // }},
  xframe: 'SAMEORIGIN',
  p3p: 'ABCDEF',
  hsts: {maxAge: 31436000, includeSubDomains: true, preload: true},
  xssProtection: true,
  nosniff: true
}));


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
