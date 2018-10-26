var express = require('express');
var bodyParser = require('body-parser')
var cors = require('cors')
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var worldqlRouter = require('./routes/worldql-rest');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())
app.use(bodyParser.text())

app.use('/worldql', worldqlRouter);

module.exports = app;
