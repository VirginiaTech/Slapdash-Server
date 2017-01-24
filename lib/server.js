const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const debug = require('debug')('server:main');
const app = express();

const serverAPI = require('./server-route.js');

// exported modules
module.exports = app;
var cookieOptions = {
    name: 'sessionId',
    keys: ['SlapDash', 'OmNomTime'],
    httpOnly: true,
    maxAge: 60 * 60 * 2 * 1000,
    /* 2 hour */
    cookie: {
        secure: false,
        httpOnly: true,
    }
};

app.set('trust proxy', true);
app.set('trust proxy', 'loopback');

// Middle-ware
app.use(cookieSession(cookieOptions));
debug('Added Cookie-Session');

app.use(helmet());
debug('Added Helmet');

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
debug('Added body-parser');

app.use(cookieParser());
debug('Added cookie-parser');

app.use(express.static(path.join(__dirname, '..', 'public')));
debug('Serving static files from public/');

app.use(morgan(process.env.LOG || 'dev'));
debug('Logger is morgan: %s', process.env.LOG || 'dev');

// Custom defined router for version one of API
app.use('/', serverAPI);
