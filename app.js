const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
// const db = require('./common/database/mongoDB');
const rateLimit = require('express-rate-limit');
const winston = require('./common/winston');
const {
  errorHandlerMiddleware,
  errorHandler
} = require('./common/error');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cron = require('./api/v1.0/modules/cron/cron');


app.set('views', path.join(__dirname, 'views'));

app.use(morgan('combined', {
  stream: winston.stream
}));


app.use(bodyParser.json({ limit: '50mb' }));

app.use(cookieParser());

app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

/**
 * apply to all requests
 * Note - Rate Limiter can be applied to any individual API also. For more information
 * Please visit https://www.npmjs.com/package/express-rate-limit
 */
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//   })
// );


const indexRouter = require("./routes/index");
app.use("/", indexRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', require('./api'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

process.on('uncaughtException', function (err) {
  errorHandler(err);
});

// error handler
app.use(function (err, req, res, next) {
  errorHandlerMiddleware(err, req, res);
});

module.exports = app;