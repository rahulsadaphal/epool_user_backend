const functions = require('../../../../common/functions');
const config = require('../../../../config');
const validator = require('validator');
const statusCode = require('../../../../common/statusCode');
const message = require('../../../../common/message');
const fs = require('fs');
const db = require(`./database/mysql/mysql`);
const con = require('../../../../common/database/mysql');
const util = require('util');
const query = util.promisify(con.query).bind(con);
var randomize = require('randomatic');
var otpGenerator = require('otp-generator')



class UserService {
  /**
   * API for user registration
   * @param {*} req (user detials)
   * @param {*} res (json with success/failure)
   */
  async registration(info) {

    try {
      // if (
      //   !validator.isEmail(info.email)


      // ) {
      //   throw {
      //     statusCode: statusCode.bad_request,
      //     message: message.badRequest,
      //     data: null,
      //   };
      // }

      const checkIfuserExists = await db.userDatabase().checkIfuserExists(info);

      if (checkIfuserExists.length > 0) {
        if (
          checkIfuserExists[0].user_role_id == 1 ||
          checkIfuserExists[0].user_role_id == 2 ||
          checkIfuserExists[0].user_role_id == 3) {
          throw {
            statusCode: statusCode.bad_request,
            message: message.duplicateDetails,
            data: null,
          };
        }

      }



      if (info.roleId == 4) {

        var checkIfuserExists1 = await db.userDatabase().checkIfuserExists(info);
        if (info.signUpType == "Social" && info.roleId == 4) {

          if (checkIfuserExists1.length > 0) {
            //update user
            var refCode = randomize('A', 5);
            var updateUser = await db.userDatabase().updateUser1(info, 'update', refCode);
            delete updateUser[0].password;
            var finalData = {
              userDetails: updateUser[0],
            }

            const token = await functions.tokenEncrypt(updateUser[0]);

            finalData.token = token;

            return {
              statusCode: statusCode.success,
              message: message.success,
              data: finalData,
            };


          } else {
            //insert user
            var refCode = randomize('A', 5);
            var insertUser = await db.userDatabase().updateUser1(info, 'insert', refCode);
            delete insertUser[0].password;
            var finalData = {
              userDetails: insertUser[0],
            }

            const token = await functions.tokenEncrypt(insertUser[0]);

            finalData.token = token;

            return {
              statusCode: statusCode.success,
              message: message.success,
              data: finalData,
            };
          }

        } else {

          if (checkIfuserExists1.length > 0 && (checkIfuserExists1[0].email_verified != 1 || checkIfuserExists1[0].email_verified == null)) {
            var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false, digits: true });

            let emailMessage = fs
              .readFileSync('./common/emailtemplate/welcome_app_user.html', 'utf8')
              .toString();
            emailMessage = emailMessage
              .replace('$fullname', info.name)
              .replace('$OTP', otp);

            const mysql = require("../../../../common/database/database");
            const connection = await mysql.connection();
            var updateQ = await connection.query(`update user set otp = ? where email_address = ? and user_role_id = ?`, [
              otp, info.email, info.roleId
            ])
            await connection.release()

            functions.sendEmail(
              info.email,
              message.registrationEmailSubject,
              emailMessage
            );
            throw {
              statusCode: statusCode.bad_request,
              message: message.otpSent,
              data: null,
            };
          }
          if (checkIfuserExists1.length > 0) {
            throw {
              statusCode: statusCode.bad_request,
              message: message.duplicateDetails,
              data: null,
            };
          }

        }


        if (info.password) {
          info.password = functions.encryptPassword(info.password);
        }

        var refCode = randomize('A', 5);


        const userRegistration1 = await db.userDatabase().userRegistration(info, refCode);
        if (info.signUpType == "Regular" && info.roleId == 4) {
          var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false, digits: true });

          let emailMessage = fs
            .readFileSync('./common/emailtemplate/welcome_app_user.html', 'utf8')
            .toString();
          emailMessage = emailMessage
            .replace('$fullname', info.name)
            .replace('$OTP', otp);

          const mysql = require("../../../../common/database/database");
          const connection = await mysql.connection();
          var updateQ = await connection.query(`update user set otp = ? where email_address = ? and user_role_id = ?`, [
            otp, info.email, info.roleId
          ])
          await connection.release()

          functions.sendEmail(
            info.email,
            message.registrationEmailSubject,
            emailMessage
          );

        }


        return {
          statusCode: statusCode.success,
          message: message.registration,
          data: userRegistration1,
        };

      }

      if (info.roleId == 2 || info.roleId == 3) {

        // var testObj = {
        //   email: "",
        //   phone: "",
        //   roleId: 2/3
        // }

        const userRegistration = await db.userDatabase().adminRegistration(info);

        let token = await functions.tokenEncrypt(info.email);
        token = Buffer.from(token, 'ascii').toString('hex');
        let emailMessage = fs
          .readFileSync('./common/emailtemplate/welcome_admin.html', 'utf8')
          .toString();
        emailMessage = emailMessage
          .replace('$fullname', info.name)
          .replace('$link', config.emailVerificationLink + '?token=' + token + "&email=" + info.email + "&roleId=" + info.roleId +
            "&flag=verifyEmail");

        functions.sendEmail(
          info.email,
          message.registrationEmailSubject,
          emailMessage
        );

        return {
          statusCode: statusCode.success,
          message: message.registration,
          data: userRegistration,
        };

      }


    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }







  /**
   * API for email verification
   * @param {*} req (email)
   * @param {*} res (json with success/failure)
   */
  async verifyEmail(info) {
    try {
      if (!info.email) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.badRequest,
          data: null,
        };
      }
      const token = Buffer.from(info.token, 'hex').toString('ascii');
      const tokenDecrypt = await functions.tokenDecrypt(token);
      if (tokenDecrypt.message === 'jwt expired') {
        throw {
          statusCode: statusCode.unauthorized,
          message: message.emailLinkExpired,
          data: null,
        };
      }
      var pass = null;
      if (info.password) {
        pass = functions.encryptPassword(info.password);
      }
      const verifyEmailDetails = await db
        .userDatabase()
        .verifyEmail(info.email, pass, info.roleId);
      return {
        statusCode: statusCode.success,
        message: message.emailVerificationSuccess,
        data: verifyEmailDetails,
      };
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }

  /**
   * API for user login
   * @param {*} req (email address & password)
   * @param {*} res (json with success/failure)
   */
  async login(info) {
    try {
      if (!validator.isEmail(info.email)) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidLoginDetails,
          data: null,
        };
      }

      var loginDetails;
      if (info.roleId) {
        loginDetails = await db.userDatabase().getUser(info.email, info.roleId);
      } else {

        loginDetails = await db.userDatabase().getUser(info.email, null);
      }



      if (loginDetails.length <= 0) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidLoginDetails,
          data: null,
        };
      }

      if (loginDetails[0].user_role_id == 2 || loginDetails[0].user_role_id == 3) {
        if (loginDetails[0].password == null) {
          throw {
            statusCode: statusCode.bad_request,
            message: message.setPassword,
            data: null,
          };
        }
      }

      if (loginDetails[0].user_role_id == 4 && (loginDetails[0].email_verified != 1 || loginDetails[0].email_verified == null)) {
        var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false, digits: true });

        let emailMessage = fs
          .readFileSync('./common/emailtemplate/welcome_app_user.html', 'utf8')
          .toString();
        emailMessage = emailMessage
          .replace('$fullname', info.name)
          .replace('$OTP', otp);

        const mysql = require("../../../../common/database/database");
        const connection = await mysql.connection();
        var updateQ = await connection.query(`update user set otp = ? where email_address = ? and user_role_id = ?`, [
          otp, info.email, info.roleId
        ])
        await connection.release()

        functions.sendEmail(
          info.email,
          message.registrationEmailSubject,
          emailMessage
        );
        throw {
          statusCode: statusCode.bad_request,
          message: message.otpSent,
          data: {
            userId: loginDetails[0].id
          },
        };
      }

      const password = functions.decryptPassword(loginDetails[0].password);
      if (password !== info.password) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidLoginDetails,
          data: null,
        };
      }

      if (loginDetails[0].email_verified !== 1) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.verifyEmail,
          data: null,
        };
      }

      if (loginDetails[0].is_deleted === 1) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.accountDisable,
          data: null,
        };
      }

      if (loginDetails[0].isBlocked === 1) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.accountBlocked,
          data: null,
        };
      }

      if (loginDetails[0].user_role_id == 4) {
        var token = await functions.tokenEncryptWithoutExpiry(loginDetails[0]);
      } else {
        var token = await functions.tokenEncrypt(loginDetails[0]);
      }

      delete loginDetails[0].password;
      var finalData = {
        userDetails: loginDetails[0],
      }



      finalData.token = token;

      return {
        statusCode: statusCode.success,
        message: message.success,
        data: finalData,
      };




    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: error
      };
    }
  }

  /**
   * API to Change password
   * @param {*} req (old password, token, new password )
   * @param {*} res (json with success/failure)
   */
  async changePassword(emailAddress, roleId, info) {
    try {
      if (
        validator.isEmpty(info.oldPassword) &&
        validator.isEmpty(info.newPassword)
      ) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.badRequest,
          data: null,
        };
      }

      const getPassword = await db.userDatabase().getPassword(emailAddress, roleId);

      if (getPassword.length <= 0) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidDetails,
          data: null,
        };
      }

      let password = functions.decryptPassword(getPassword[0].password);
      if (password !== info.oldPassword) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidPassword,
          data: null,
        };
      }

      // Encrypt password for the user
      password = functions.encryptPassword(info.newPassword);

      const updatePasswordDetails = await db
        .userDatabase()
        .updateUserPassword(emailAddress, password, roleId);

      return {
        statusCode: statusCode.success,
        message: message.passwordChanged,
        data: updatePasswordDetails,
      };
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }

  /**
   * API for Forgot Password
   * @param {*} req (email address )
   * @param {*} res (json with success/failure)
   */
  async forgotPassword(info) {
    const mysql = require("../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      if (!validator.isEmail(info.email)) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.invalidEmail,
          data: null,
        };
      }
      if (info.roleId) {
        var userDetail = await db.userDatabase().getUser(info.email, info.roleId);
      } else {
        var userDetail = await db.userDatabase().getUser(info.email, null, 1);
      }


      if (userDetail.length <= 0) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.emailNotExists,
          data: null,
        };
      }
      if (userDetail[0].user_role_id == 1 || userDetail[0].user_role_id == 2 || userDetail[0].user_role_id == 3) {
        const to = userDetail[0].email_address;
        let token = await functions.tokenEncrypt(to);
        token = Buffer.from(token, 'ascii').toString('hex');
        const subject = message.forgotPasswordSubject;
        const link = config.resetPasswordLink + "?token=" + token + "&email=" + info.email + "&roleId=" + userDetail[0].user_role_id
          + "&flag=passwordReset";
        let emailMessage = fs
          .readFileSync('./common/emailtemplate/reset.html', 'utf8')
          .toString();
        emailMessage = emailMessage
          .replace('$fullname', userDetail[0].full_name)
          .replace('$link', link)
          .replace('$emailId', config.supportEmail);

        functions.sendEmail(to, subject, emailMessage);
        return {
          statusCode: statusCode.success,
          message: message.resetLink,
          data: null,
        };
      }
      if (info.roleId == 4) {





        const to = userDetail[0].email_address;
        const subject = message.forgotPasswordOTP;
        var otpGenerator = require('otp-generator');
        var otp = otpGenerator.generate(6, {
          upperCase: false,
          specialChars: false,
          digits: true,
          alphabets: false
        });

        await connection.query('update user set otp = ?  where email_address = ? and user_role_id = ?', [otp, info.email, info.roleId]);
        let emailMessage = fs
          .readFileSync('./common/emailtemplate/reset_otp.html', 'utf8')
          .toString();
        emailMessage = emailMessage
          .replace('$fullname', userDetail[0].full_name)
          .replace('$OTP', otp)
          .replace('$emailId', config.supportEmail);

        functions.sendEmail(to, subject, emailMessage);
        return {
          statusCode: statusCode.success,
          message: message.resetOTP,
          data: null,
        };
      }
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release();
    }
  }




  /**
   * API for Reset Password
   * @param {*} req (emailAddress )
   * @param {*} res (json with success/failure)
   */
  async resetPassword(info) {
    try {
      if (info.roleId == 1 || info.roleId == 2 || info.roleId == 3) {
        if (
          validator.isEmpty(info.email) ||
          validator.isEmpty(info.newPassword)
        ) {
          throw {
            statusCode: statusCode.bad_request,
            message: message.invalidDetails,
            data: null,
          };
        }
        const emailAddress = Buffer.from(info.token, 'hex').toString(
          'ascii'
        );
        const emailAddressDetails = await functions.tokenDecrypt(emailAddress);
        if (!emailAddressDetails.data) {
          throw {
            statusCode: statusCode.unauthorized,
            message: message.emailLinkExpired,
            data: null,
          };
        }
        const password = functions.encryptPassword(info.newPassword);

        const passwordDetails = await db
          .userDatabase()
          .updateUserPassword(info.email, password, info.roleId);

        return {
          statusCode: statusCode.success,
          message: message.passwordReset,
          data: passwordDetails,
        };
      }
      if (info.roleId == 4) {






        let password = functions.encryptPassword(info.newPassword);

        const passwordDetails = await db
          .userDatabase()
          .updatAppUserPassword(info.userId, password, info.roleId);

        return {
          statusCode: statusCode.success,
          message: message.passwordReset,
          data: passwordDetails,
        };
      }
      // if (info.roleId == 4) {
      //   if (
      //     validator.isEmpty(info.userId) ||
      //     validator.isEmpty(info.newPassword) ||
      //     validator.isEmpty(info.oldPassword)
      //   ) {
      //     throw {
      //       statusCode: statusCode.bad_request,
      //       message: message.invalidDetails,
      //       data: null,
      //     };
      //   }

      //   const getPassword = await db.userDatabase().getPassword(info.email, info.roleId);

      //   if (getPassword.length <= 0) {
      //     throw {
      //       statusCode: statusCode.bad_request,
      //       message: message.invalidDetails,
      //       data: null,
      //     };
      //   }

      //   let password = functions.decryptPassword(getPassword[0].password);
      //   if (password !== info.oldPassword) {
      //     throw {
      //       statusCode: statusCode.bad_request,
      //       message: message.invalidPassword,
      //       data: null,
      //     };
      //   }


      //   password = functions.encryptPassword(info.newPassword);

      //   const passwordDetails = await db
      //     .userDatabase()
      //     .updateUserPassword(info.email, password, info.roleId);

      //   return {
      //     statusCode: statusCode.success,
      //     message: message.passwordReset,
      //     data: passwordDetails,
      //   };
      // }
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }

  /**
   * API for user history
   * @param {*} req (userId)
   * @param {*} res (json with success/failure)
   */
  async getProfile(emailAdress) {
    try {
      const getProfileDetails = await db.userDatabase().getUser(emailAdress);
      if (getProfileDetails.length > 0) {
        const userDetails = {
          fullName: getProfileDetails[0].fullName,
          emailAddress: getProfileDetails[0].emailAddress,
          mobileNumber: getProfileDetails[0].mobileNumber,
        };
        return {
          statusCode: statusCode.success,
          message: message.success,
          data: userDetails,
        };
      } else {
        return {
          statusCode: statusCode.bad_request,
          message: message.noData,
          data: null,
        };
      }
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }

  /**
   * API to update profile
   * @param {*} req (token, user information )
   * @param {*} res (json with success/failure)
   */
  async updateProfile(userId, info) {
    try {
      if (validator.isEmpty(info.fullName)) {
        throw {
          statusCode: statusCode.bad_request,
          message: message.allFieldReq,
          data: null,
        };
      }

      const userDetail = await db.userDatabase().updateUser(userId, info);

      return {
        statusCode: statusCode.success,
        message: message.profileUpdate,
        data: userDetail,
      };
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }

  /**
   * API for uploading user profile pic
   * @param {*} req (userId, base64 data)
   * @param {*} res (json with success/failure)
   */
  async addProfilePic(info) {
    const mysql = require("../../../../common/database/database");
    const connection = await mysql.connection();
    try {
      var imageType = info.imageInfo.name ?
        info.imageInfo.name.split('.')[1] :
        '';
      if (!imageType) {
        throw {
          statusCode: statusCode.unsupported_media_type,
          message: message.invalidImage,
          data: [],
        };
      }

      const imageName = `profile-${Date.now()}`;
      const path = 'profile/';
      const imageInformation = {
        fileName: imageName,
        base64: info.imageInfo.base64,
        fileType: imageType,
        pathInfo: path,
      };
      const imageURLInfo = await functions.uploadFile(imageInformation);

      const imageURL = path + imageURLInfo.fileName;

      var getProfileKey = await connection.query(`select profilePicBucketKey from user where id = ?`, [info.user_id])
      var deleteOldProfilePic = await functions.s3RemoveFile(getProfileKey[0].profilePicBucketKey)

      //--------------UPLOAD DATA TO S3 BUCKET----------------------------------------
      // var uId = uniqid()
      var bucketPath = "profile/" + imageURLInfo.fileName;
      var s3fileName = "public/" + path + imageURLInfo.fileName;
      var s3Resp = await functions.uploadS3Data(bucketPath, s3fileName, "public")

      fs.unlinkSync(s3fileName)


      //------------------------------------------------------------------------------

      const addProfilePic = await db
        .userDatabase()
        .addProfilePic(info.user_id, s3Resp.Location, s3Resp.key);
      var userData = await connection.query(`SELECT * FROM user where id = ?`, [info.user_id])
      delete userData[0].password
      return {
        statusCode: statusCode.success,
        message: message.success,
        data: userData,
      };
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    } finally {
      await connection.release()
    }
  }

  async uploadProfilePic(filename, userid) {
    try {


      console.log("-------------INSIDE UPDATE PROFILE PIC API---------");


      const addProfilePic = await db
        .userDatabase()
        .addProfilePic(filename, userid);
      return {
        statusCode: statusCode.success,
        message: message.success,
        data: addProfilePic,
      };
    } catch (error) {
      throw {
        statusCode: error.statusCode,
        message: error.message,
        data: JSON.stringify(error),
      };
    }
  }








}

module.exports = {
  userService: function () {
    return new UserService();
  },
};