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
      console.log("");


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