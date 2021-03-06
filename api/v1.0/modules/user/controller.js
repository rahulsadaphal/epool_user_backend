const object = require('./user');
const functions = require('../../../../common/functions');
const multer = require("multer");
const statusCode = require('../../../../common/statusCode');
const message = require('../../../../common/message');

var maxSize = 3000000;
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(config.CWD, "/public/profile/"));
  },

  filename: function (req, file, cb) {
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    // let ext = '.csv'
    if (!ext) {
      cb(null, uniqid());
    } else {
      cb(null, uniqid() + ext);
    }
  }
});

var upload = multer({
  storage: storage,
  limits: {
    fileSize: maxSize
  }
}).any();

const controller = {
  //User Registration API
  registration: async (req, res, next) => {
    try {
      const registrationDetails = await object
        .userService()
        .registration(res.locals.requestedData);
      res.send(
        functions.responseGenerator(
          registrationDetails.statusCode,
          registrationDetails.message,
          registrationDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },





  //Verify Email API
  verifyEmail: async (req, res, next) => {
    try {
      const verificationDetails = await object
        .userService()
        .verifyEmail(res.locals.requestedData);
      res.send(
        functions.responseGenerator(
          verificationDetails.statusCode,
          verificationDetails.message,
          verificationDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  //Login API
  login: async (req, res, next) => {
    try {
      const loginDetails = await object
        .userService()
        .login(res.locals.requestedData);
      res.send(
        functions.responseGenerator(
          loginDetails.statusCode,
          loginDetails.message,
          loginDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  resendVerificationLink: async (req, res, next) => {
    try {
      const resendLinkDetails = await object
        .userService()
        .resendVerificationLink(res.locals.requestedData);
      res.send(
        functions.responseGenerator(
          resendLinkDetails.statusCode,
          resendLinkDetails.message,
          resendLinkDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  // Change Password API
  changePassword: async (req, res, next) => {
    try {
      const changePasswordDetails = await object
        .userService()
        .changePassword(
          res.locals.tokenInfo.email_address,
          res.locals.tokenInfo.user_role_id,
          res.locals.requestedData
        );
      res.send(
        functions.responseGenerator(
          changePasswordDetails.statusCode,
          changePasswordDetails.message,
          changePasswordDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  // Forgot Password API
  forgotPassword: async (req, res, next) => {
    try {
      const forgotPasswordDetails = await object
        .userService()
        .forgotPassword(res.locals.requestedData);
      res.send(
        functions.responseGenerator(
          forgotPasswordDetails.statusCode,
          forgotPasswordDetails.message,
          forgotPasswordDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },



  // Reset Password API
  resetPassword: async (req, res, next) => {
    try {
      const resetPasswordDetails = await object
        .userService()
        .resetPassword(res.locals.requestedData);
      res.send(
        functions.responseGenerator(
          resetPasswordDetails.statusCode,
          resetPasswordDetails.message,
          resetPasswordDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  // Get Profile API
  getProfile: async (req, res, next) => {
    try {
      const userInformationDetails = await object
        .userService()
        .getProfile(res.locals.tokenInfo.emailAddress);
      res.send(
        functions.responseGenerator(
          userInformationDetails.statusCode,
          userInformationDetails.message,
          userInformationDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  // Update Profile API
  updateProfile: async (req, res, next) => {
    try {
      const updateProfileDetails = await object
        .userService()
        .updateProfile(
          res.locals.tokenInfo.emailAddress,
          res.locals.requestedData
        );
      res.send(
        functions.responseGenerator(
          updateProfileDetails.statusCode,
          updateProfileDetails.message,
          updateProfileDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },

  // Add profile picture
  profilePic: async (req, res, next) => {
    try {
      const profilePicDetails = await object
        .userService()
        .addProfilePic(

          res.locals.requestedData
        );
      res.send(
        functions.responseGenerator(
          profilePicDetails.statusCode,
          profilePicDetails.message,
          profilePicDetails.data
        )
      );
    } catch (error) {
      return next(error);
    }
  },





};

module.exports = controller;