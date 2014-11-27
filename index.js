"use strict";

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var csvParser = require('csv-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

router.use(function(req, res, next) {
	console.log('Something is happening!');
	next();
});

router.get('/', function (req, res) {
  res.json({message: 'Hello, api!'});
});

router.post('/import', function (req, res) {
  console.log('Import called...');
  res.json({message: 'Hello, api!'});
});

app.use('/api', router);
app.listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');