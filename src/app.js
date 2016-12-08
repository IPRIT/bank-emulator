'use strict';

/**
 * Setting up a global http error for handle API errors
 */
import { HttpError } from './utils/http-error';
global.HttpError = HttpError;

import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import formData from 'express-form-data';
import requestRestrict from 'express-light-limiter';
import apiRouter from './route';
import cdnRouter from './route/cdn';
import { config } from './utils';
import path from 'path';
import { ClientError, ServerError } from './route/error/http-error';

import recorder from './route/bank/deposit/recorder';
recorder.start();

import rewarder from './route/bank/deposit/rewarder';
rewarder.start();

let app = express();
  
app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(formData.parse());
app.use(formData.stream());
app.use(formData.union());
app.use(cookieParser(config.cookieSecret));
app.enable('trust proxy');
app.set('views', path.join(__dirname, '/'));
app.set('view engine', 'pug');
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}));

/*
 * Connecting routers
 */
app.use('/cdn', cdnRouter);
app.use('/api', [ requestRestrict({ error: new HttpError('Too many requests', 429) }) ], apiRouter);

app.use(ClientError);
app.use(ServerError);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Страница не найдена');
  err.status = 404;
  res.status(err.status).render('route/error/templates/client.pug', {
    message: err.message
  });
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (process.env.NODE_ENV === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    console.error(err);
    res.end();
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.end();
});

export default app;