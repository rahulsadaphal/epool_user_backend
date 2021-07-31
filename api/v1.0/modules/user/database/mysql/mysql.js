const con = require('../../../../../../common/database/mysql');
const util = require('util');
const query = util.promisify(con.query).bind(con);
const { databaseInitial } = require('../../../../../../config');
const { connection_failed } = require('../../../../../../common/statusCode');

class UserDatabase {
  /**
   * Database call to check if user exists
   * @param {*} req (email address & mobileNumber)
   * @param {*} res (json with success/failure)
   */
  async checkIfuserExists(info) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      if (info.signUpType == "Social" && info.roleId == 4) {
        //loginType = social and regular
        var chkQ = await connection.query(`select * from user where login_type = 'social' and social_login_id = ? and user_role_id = 4`, [
          info.userId
        ]);
        return chkQ;
      }
      if (info.signUpType == "Regular" && info.roleId == 4) {
        //loginType = social and regular
        var sqlSelectQuery = `SELECT * FROM user where user_role_id = ? and email_address = ?`;
        // const sqlSelectQuery = `SELECT * FROM user where email_address = ?`;
        var details = await query(sqlSelectQuery, [
          info.roleId, info.email
        ]);
        return details;
      }
      // var sqlSelectQuery = `SELECT * FROM user where user_role_id = ? and email_address = ?`;
      var sqlSelectQuery = `SELECT * FROM user where email_address = ?`;
      var details = await query(sqlSelectQuery, [
        info.email
      ]);
      return details;

    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }



  /**
   * Database call for inserting user information
   * @param {*} req (user details)
   * @param {*} res (json with success/failure)
   */
  async userRegistration(info, refCode) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      if (info.signUpType == "Social" && info.roleId == 4) {
        var arr = []
        arr.push(info.deviceToken)
        var insertQ = await connection.query(`insert into user (full_name, email_address, user_role_id, profile_picture_url, email_verified,
        login_type, social_login_id, deviceToken, referral_code) values (?,?,?,?,?,?,?,?,?)`, [
            info.name, info.email, 4, info.profilePicUrl, 1, 'social', info.userId, JSON.stringify(arr), refCode
          ]);
        var refInsertQuery = await connection.query(`insert into user_referral_code (user_id, referral_code) values (?,?)`, [insertQ.insertId, refCode]);
        return insertQ;
      }
      if (info.signUpType == "Regular" && info.roleId == 4) {
        var arr = []
        arr.push(info.deviceToken)
        var sqlInsertQuery = `insert into user (full_name, email_address, password, user_role_id, referral_code,deviceToken) values (?,?,?,?,?,?)`;
        var details = await connection.query(sqlInsertQuery, [
          info.name, info.email, info.password, info.roleId, refCode, JSON.stringify(arr)
        ]);
        var refInsertQuery = await connection.query(`insert into user_referral_code (user_id, referral_code) values (?,?)`, [details.insertId, refCode]);
        var getRewardPointValue = await connection.query(`select value from reward_points_value where name = 'signup'`)
        await connection.query('update user set available_reward_points = available_reward_points + ? where id = ?', [getRewardPointValue[0].value, details.insertId]);
        await connection.query(`insert into user_reward_points (reward_type, user_id, reward_points)  values (?,?,?)`, ['signUp', details.insertId, getRewardPointValue[0].value]);

        return details;
      }


    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  async updateDeviceToken(info, userId) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {


      var chkQ = await connection.query(`select deviceToken from user where id = ?`, [
        userId
      ]);
      if (chkQ[0].deviceToken == null) {
        var tArray = []
        tArray.push(info.deviceToken);
        var updateQ = await connection.query(`update user set deviceToken = ? where id = ?`, [
          JSON.stringify(tArray), userId
        ])
        return updateQ;
      } else {
        var tArray = JSON.parse(chkQ[0].deviceToken);
        var index1 = tArray.findIndex(itm => {
          return itm == info.deviceToken
        })
        if (index1 == -1) {
          tArray.push(info.deviceToken);
        }
        if (tArray.length == 3) {
          tArray.splice(0, 1);
        }


        var updateQ = await connection.query(`update user set deviceToken = ? where id = ?`, [
          JSON.stringify(tArray), userId
        ])
        return updateQ;
      }



    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  async updateUser1(info, flag, refCode) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      if (flag == 'update') {
        var chkQ = await connection.query(`select deviceToken from user where social_login_id = ?`, [
          info.userId
        ]);


        var tArray = JSON.parse(chkQ[0].deviceToken);
        var index1 = tArray.findIndex(itm => {
          return itm == info.deviceToken;
        })
        if (index1 == -1) {
          tArray.push(info.deviceToken);
        }
        if (tArray.length == 3) {
          tArray.splice(0, 1);
        }



        var updateQ = await connection.query(`update user set full_name = ?, email_address = ?, user_role_id = ?, profile_picture_url = ?, email_verified = ?,
        login_type = ?, social_login_id = ?, deviceToken = ? where social_login_id = ?`, [
            info.name, info.email, 4, info.profilePicUrl, 1, 'social', info.userId, JSON.stringify(tArray), info.userId
          ])

        // var refUpdateQuery = await connection.query(`update user_referral_code set user_id = ?, referral_code = ? where user_id = ?`, [info.userId, refCode, info.userId]);

        var chkQ = await connection.query(`select * from user where login_type = 'social' and social_login_id = ? and user_role_id = 4`, [
          info.userId
        ]);
        return chkQ;

      }
      if (flag == 'insert') {
        var tArray = []
        tArray.push(info.deviceToken);
        var inserteQ = await connection.query(`insert into user (full_name, email_address, user_role_id, profile_picture_url, email_verified,
          login_type, social_login_id, deviceToken, referral_code) values (?,?,?,?,?,?,?,?,?)`, [
            info.name, info.email, 4, info.profilePicUrl, 1, 'social', info.userId, JSON.stringify(tArray), refCode
          ]);
        var refInsertQuery = await connection.query(`insert into user_referral_code (user_id, referral_code) values (?,?)`, [inserteQ.insertId, refCode]);
        var getRewardPointValue = await connection.query(`select value from reward_points_value where name = 'signup'`)
        await connection.query('update user set available_reward_points = available_reward_points + ? where id = ?', [getRewardPointValue[0].value, inserteQ.insertId]);
        await connection.query(`insert into user_reward_points (reward_type, user_id, reward_points)  values (?,?,?)`, ['signUp', inserteQ.insertId, getRewardPointValue[0].value]);

        var chkQ = await connection.query(`select * from user where login_type = 'social' and social_login_id = ? and user_role_id = 4`, [
          info.userId
        ]);
        return chkQ;
      }
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  async adminRegistration(info) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      const sqlInsertQuery = `insert into user (email_address, mobile_number, user_role_id, full_name) values (?,?,?,?)`;
      const details = await connection.query(sqlInsertQuery, [
        info.email, info.phone, info.roleId, info.name
      ]);
      return details;
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  /**
   * Database call for updating the user email verification
   * @param {*} req (email address)
   * @param {*} res (json with success/failure)
   */
  async verifyEmail(emailAddress, password, roleId) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      const chkRole = await connection.query(`select user_role_id from user where email_address = ? and user_role_id = ?`, [emailAddress, roleId])
      // if (password != null) {
      // var sqlUpdateQuery = `UPDATE user SET email_verified = 1, password = ? WHERE email_address = ? and user_role_id = ?`;
      // var details = await query(sqlUpdateQuery, [password, emailAddress, chkRole[0].user_role_id]);
      // return details;
      // } else {
      //   var sqlUpdateQuery = `UPDATE user SET email_verified = 1 WHERE email_address = ? and user_role_id = ?`;
      //   var details = await query(sqlUpdateQuery, [emailAddress, chkRole[0].user_role_id]);
      //   return details;
      // }
      var sqlUpdateQuery = `UPDATE user SET email_verified = 1, password = ? WHERE email_address = ? and user_role_id = ?`;
      var details = await query(sqlUpdateQuery, [password, emailAddress, chkRole[0].user_role_id]);
      return details;


    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  /**
   * Database call for selecting user details for login
   * @param {*} req (emailAddress)
   * @param {*} res (json with success/failure)
   */
  async getUser(emailAddress, roleId, flag) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      if (flag == 1) {
        var sqlSelectQuery = `
        SELECT * FROM user where user_role_id in (1,2,3) and email_address = ?`;
        var details = await connection.query(sqlSelectQuery, [emailAddress]);
        return details;
      }
      if (roleId == null) {
        var sqlSelectQuery = `
        SELECT * FROM user where email_address = ?`;
        var details = await connection.query(sqlSelectQuery, [emailAddress]);
        return details;
      } else {
        var sqlSelectQuery = `
        SELECT USR.* ,
        (SELECT group_concat(language_id) FROM user_language_preference where user_id = USR.id) as languageId
        FROM user USR 
        where USR.user_role_id = ? and USR.email_address = ?`;
        var details = await connection.query(sqlSelectQuery, [roleId, emailAddress]);
        return details;
      }

    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  /**
   * Database call for selecting userpassword for changing password
   * @param {*} req (emailAddress)
   * @param {*} res (json with success/failure)
   */
  async getPassword(emailAddress, roleId) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      const sqlSelectQuery = `SELECT password FROM user WHERE email_address = ? and user_role_id = ?`;
      const details = await connection.query(sqlSelectQuery, [emailAddress, roleId]);
      return details;
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  /**
   * Database call for updating userpassword by email address
   * @param {*} req (emailAddress)
   * @param {*} res (json with success/failure)
   */
  async updateUserPassword(emailAddress, password, roleId) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      const sqlUpdateQuery = `UPDATE user SET password = ? WHERE email_address = ? and user_role_id = ?`;
      const details = await connection.query(sqlUpdateQuery, [password, emailAddress, roleId]);
      return details;
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  async updatAppUserPassword(userId, password, roleId) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      const sqlUpdateQuery = `UPDATE user SET password = ? WHERE id = ? and user_role_id = ?`;
      const details = await connection.query(sqlUpdateQuery, [password, userId, roleId]);
      return details;
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }

  /**
   * Database call for updating userdetails
   * @param {*} req (emailAddress)
   * @param {*} res (json with success/failure)
   */
  async updateUser(emailAddress, info) {
    try {
      const sqlUpdateQuery = `UPDATE user SET fullName = ? WHERE emailAddress = ?`;
      const details = await query(sqlUpdateQuery, [
        info.fullName,
        emailAddress,
      ]);
      return details;
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }

  /**
   * Database call for updating userdetails
   * @param {*} req (emailAddress)
   * @param {*} res (json with success/failure)
   */
  async addProfilePic(userId, imageURL, bucketKey) {
    const mysql = require("../../../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      const sqlUpdateQuery = `UPDATE user SET profile_picture_url = ?, profilePicBucketKey = ? WHERE id = ?`;
      const details = await query(sqlUpdateQuery, [imageURL, bucketKey, userId]);
      return details;
    } catch (error) {
      throw {
        statusCode: connection_failed,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release()
    }
  }
}

module.exports = {
  userDatabase: function () {
    return new UserDatabase();
  },
};
