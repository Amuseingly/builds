require("dotenv").config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const youtubeRouter = require('./routes/youtube');
const musicRouter = require('./routes/music');
const artistRouter = require('./routes/artist');
const searchRouter = require('./routes/search');
const app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_DOMAIN);
    next();
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/audio", express.static(path.join(__dirname, 'audio')));

app.use('/', indexRouter);
app.use('/songs', musicRouter);
app.use('/artists', artistRouter);
app.use('/search', searchRouter);
app.use('/yt', youtubeRouter);

//Capture All 404 errors
app.use(function (req,res,next){
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;
