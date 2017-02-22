require('dotenv').config();
const port = process.env.PORT;
const mongoURL = process.env.MONGODB_URL;

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
  // csrf: true,
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

app.set('views', 'views/');
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

let morgan = require('morgan');
app.use(morgan('dev'));

let router = require('./router.js');
let mongodbClient = require('mongodb').MongoClient;
mongodbClient.connect(mongoURL).then((db) => {
  router(app, db);
  app.listen(port);
  console.info('Listening on port ' + port);
}).catch((err) => {
  console.error('Error connecting to db: ' + err);
});
