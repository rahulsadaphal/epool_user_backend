const functions = require('../../../../common/functions');
const config = require('../../../../config');
const validator = require('validator');
const statusCode = require('../../../../common/statusCode');
const message = require('../../../../common/message');
const fs = require('fs');
const mysql = require("../../../../common/database/database");
var randomize = require('randomatic');
var otpGenerator = require('otp-generator')



class UserService {

  async registration(info) {
    const connection = await mysql.connection();
    try {
      const payload = {
        "name": "Cody William",
        "email": "xyz@yopmail.com",
        "phone": "0987654321",
        "roleId": ""
      };
      console.log("----------INSIDE REGISTRATION ROUTE-------------", info);
      await connection.query("START TRANSACTION");

      const password = functions.encryptPassword(info.password);

      let resp = await connection.query(`
      set @flag = '0';
      call sp_register(?,?,?,?,?,@flag);
      select @flag;
      `, [info.name, info.email, info.phone, info.roleId, password]);
      await connection.query("COMMIT");
      if (resp[2][0]['@flag'] == 'successfully added new user') {
        console.log("-------INSIDE SUCCESS BLOCK---------");
        let token = await functions.tokenEncrypt(info.email, 300);
        token = Buffer.from(token, 'ascii').toString('hex');
        let emailMessage = fs
          .readFileSync('./common/emailtemplate/welcome.html', 'utf8')
          .toString();
        emailMessage = emailMessage
          .replace('$fullname', info.name.charAt(0).toUpperCase() + info.name.slice(1))
          .replace('$link', info.roleId == 1 ? config.emailVerificationLinkCustomer + '?code=' + token + "&email=" + info.email + "&roleId=" + info.roleId +
            "&flag=verifyEmail" : config.emailVerificationLinkOwner + '?code=' + token + "&email=" + info.email + "&roleId=" + info.roleId +
            "&flag=verifyEmail");


        functions.sendEmail(
          info.email,
          message.registrationEmailSubject,
          emailMessage
        );
        return {
          statusCode: statusCode.success,
          // message: message.success,
          message: resp[2][0]['@flag'],
          data: []
        };
      } else {
        return {
          statusCode: statusCode.fail,
          // message: message.success,
          message: resp[2][0]['@flag'],
          data: []
        };
      }



    } catch (error) {
      await connection.query("ROLLBACK");
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }


  async verifyEmail(info) {
    const connection = await mysql.connection();
    const payload = {
      "code": "",
      "roleId": ""
    };
    try {
      console.log("----------INSIDE USER SERVICE - VERIFY EMAIL ROUTE----------", info);
      // config.emailVerificationLinkOwner + '?token=' + token + "&email=" + info.email + "&roleId=" + info.roleId +
      //   "&flag=verifyEmail"

      const token = Buffer.from(info.payload, 'hex').toString('ascii');
      const tokenDecrypt = await functions.tokenDecrypt(token);
      if (tokenDecrypt.message === 'jwt expired') {
        throw {
          statusCode: statusCode.unauthorized,
          message: message.emailLinkExpired,
          data: null,
        };
      }

      await connection.query("START TRANSACTION");

      let resp = await connection.query(`
      call sp_verifyEmail(?,?);
      `, [tokenDecrypt.data.email, info.roleId]);
      await connection.query("COMMIT");

      return {
        statusCode: statusCode.success,
        message: message.emailVerificationSuccess,
        data: verifyEmailDetails,
      };

    } catch (error) {
      await connection.query("ROLLBACK");
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }


  async login(info) {
    const connection = await mysql.connection();
    const payload = {
      "email": "",
      "password": ""
    };
    try {
      console.log("-----------INSIDE USER SERVICE LOGIN API-------------", info)

      // await connection.query("START TRANSACTION");

      let checkUser = await connection.query(`select Id, name, email, phone, isDeleted, isVerified, createdOn, updatedOn,
      roleId, isFirstTimeLogin, password from data_user where email = ? and roleId = ?`, [info.email, info.roleId]);
      if (checkUser.length <= 0) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.emailNotExists,
          data: null,
        };
      }
      if (checkUser[0].isVerified !== 1) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.emailVerify,
          data: null,
        };
      }

      if (checkUser[0].isDeleted === 1) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.accountDisable,
          data: null,
        };
      }

      const password = functions.decryptPassword(checkUser[0].password);
      if (password !== info.password) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidLoginDetails,
          data: null,
        };
      }

      delete checkUser[0].password;

      let token = await functions.tokenEncrypt(checkUser[0]);

      let finalData = {
        userDetails: checkUser[0],
        token
      };

      // await connection.query("COMMIT");

      return {
        statusCode: statusCode.success,
        message: message.success,
        data: finalData,
      };


    } catch (error) {
      // await connection.query("ROLLBACK");
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error
      };
    }
    finally {
      await connection.release();
    }
  }


  async changePassword(emailAddress, roleId, info) {
    const connection = await mysql.connection();
    try {

    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }


  async forgotPassword(info) {
    const connection = await mysql.connection();

    try {




    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    } finally {
      await connection.release();
    }
  }




  async resetPassword(info) {
    const connection = await mysql.connection();
    try {

    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }


  async getProfile(emailAdress) {
    const connection = await mysql.connection();
    try {

    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }


  async updateProfile(userId, info) {
    const connection = await mysql.connection();
    try {

    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }


  async addProfilePic(info) {
    const connection = await mysql.connection();
    try {

    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    } finally {
      await connection.release()
    }
  }

  async uploadProfilePic(filename, userid) {
    const connection = await mysql.connection();
    try {


    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error,
      };
    }
    finally {
      await connection.release()
    }
  }




}

module.exports = {
  userService: function () {
    return new UserService();
  },
};