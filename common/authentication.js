const functions = require('./functions');
const statusCode = require('./statusCode');
const message = require('./message');

const authenticationController = {
  validateToken: async (req, res, next) => {
    const mysql = require("./database/database");
    const connection = await mysql.connection();
    try {
      if (req.headers.auth) {
        const tokenDecryptInfo = await functions.tokenDecrypt(req.headers.auth);

        if (tokenDecryptInfo.data) {
          res.locals.tokenInfo = tokenDecryptInfo.data;
          if (tokenDecryptInfo.data.user_role_id == 4 && tokenDecryptInfo.data.login_type == null) {
            var getPass = await connection.query(`select password from user where id = ?`, [tokenDecryptInfo.data.id])
            if (getPass[0].password != tokenDecryptInfo.data.password) {
              throw {
                statusCode: statusCode.unauthorized,
                message: message.sessionExpire,
                data: null,
              };
            }
          }
          const token = await functions.tokenEncrypt(tokenDecryptInfo.data);
          res.header('auth', token);
          next();
        } else {
          throw {
            statusCode: statusCode.unauthorized,
            message: message.sessionExpire,
            data: null,
          };
        }
      } else {
        throw {
          statusCode: statusCode.bad_request,
          message: message.tokenMissing,
          data: null,
        };
      }
    } catch (error) {
      return next(error);
    } finally {
      await connection.release()
    }
  },

  validateSuperAdmin: (req, res, next) => {
    try {
      if (res.locals.tokenInfo.user_role_id === 1) {
        next();
      } else {
        throw {
          statusCode: statusCode.unauthorized,
          message: message.unAuthorized,
          data: null,
        };
      }
    } catch (error) {
      return next(error);
    }
  },

  validatePublisher: (req, res, next) => {
    try {
      if (res.locals.tokenInfo.user_role_id === 3) {
        next();
      } else {
        throw {
          statusCode: statusCode.unauthorized,
          message: message.unAuthorized,
          data: null,
        };
      }
    } catch (error) {
      return next(error);
    }
  },

  validateAdmin: (req, res, next) => {
    try {
      if (res.locals.tokenInfo.user_role_id === 1 || res.locals.tokenInfo.user_role_id === 2) {
        next();
      }
      // if (res.locals.tokenInfo.user_role_id) {
      //   next();
      // }
      else {
        throw {
          statusCode: statusCode.unauthorized,
          message: message.unAuthorized,
          data: null,
        };
      }
    } catch (error) {
      return next(error);
    }
  },

  decryptRequest: (req, res, next) => {
    try {
      if (req.body) {
        const userinfo = functions.decryptData(req.body);
        res.locals.requestedData = userinfo;
        next();
      } else {
        throw {
          statusCode: statusCode.bad_request,
          message: message.badRequest,
          data: null,
        };
      }
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = authenticationController;
