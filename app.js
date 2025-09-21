const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRoute = require('./routes/tourRoutes');
const userRoute = require('./routes/userRoutes');
const reviewRoute = require('./routes/reviewRoutes');
const viewRoute = require('./routes/viewRoutes');
const bookingRoute = require('./routes/bookingRoutes');

const app = express();

//tell express our view engine
app.set('view engine', 'pug');

//tell express where to find our view engine
//./view
app.set('views', path.join(__dirname, 'views'));

//1. Global middleware

//Serving startic file
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Set security http headers
// app.use(helmet());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
          'https://unpkg.com',
          'https://cdn.jsdelivr.net',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://api.maptiler.com',
          'https://*.tile.openstreetmap.org',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://*.tile.openstreetmap.org',
          'https://*.tiles.mapbox.com',
          'https://api.maptiler.com',
        ],
      },
    },
  })
);

//developmemt login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// For rate limiting
const limiter = rateLimit({
  //100 request in 1hr(windowMS)
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP address',
});
app.use('/api', limiter);

//Body parser, reading data frrom body into req.body(limit to 10kb)
app.use(express.json({ limit: '10kb' }));
//Parse data from url encoded form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//Cookie parser parse data from cookie
app.use(cookieParser());

//Data sanitization against nosql query injection
app.use(mongoSanitize());

//Data sanitization against XXS
app.use(xss());

//Prevent parameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price',
      'maxGroupSize',
    ],
  })
);

//Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers.authorization)
  // console.log(req.cookies);
  next();
});

//Routes
app.use('/', viewRoute);
app.use('/api/v1/tours', tourRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/bookings', bookingRoute);

//Handling unhandled route
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

//Global error handling middleware function
app.use(globalErrorHandler);

module.exports = app;
