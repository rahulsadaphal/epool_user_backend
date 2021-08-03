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
        let emailMessage = fs
          .readFileSync('./common/emailtemplate/welcome.html', 'utf8')
          .toString();
        emailMessage = emailMessage
          .replace('$fullname', info.name.charAt(0).toUpperCase() + info.name.slice(1));

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


  async login(info) {
    const connection = await mysql.connection();
    try {


    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error
      };
    }
    finally {
      await connection.release()
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