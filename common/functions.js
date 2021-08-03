const config = require('../config');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const fs = require('fs');
const { errorHandler } = require('./error');
const AWS = require('aws-sdk');
const uniqid = require("uniqid")
const bucketName = config.bucketName


AWS.config.update({
  "accessKeyId": config.accessKeyId,
  "secretAccessKey": config.secretAccessKey,
  "region": config.region
});

async function generateSignedUrl(key) {
  return await new Promise(async (resolve, reject) => {
    const sts = new AWS.STS();

    var accessparams = {};
    const data = await sts.assumeRole({
      DurationSeconds: 900,
      ExternalId: '1234-1234-1234-1234-1234',
      RoleArn: "arn:aws:iam::607244949578:role/s3BucketAccess",
      RoleSessionName: 'abc',
    }).promise();
    console.log(data);
    accessparams = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      signatureVersion: 'v4',
      region: config.region
    };
    console.log(accessparams)

    //------------------------------------------------------------------------------------------------
    var s3 = new AWS.S3(accessparams);

    s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: `${key}`,
      Expires: Number(config.signedURLExpiry), // time in seconds: e.g. 60 * 5 = 5 mins
    }, (err, url) => {
      if (err) reject(err);
      console.log(url);
      resolve(url);
    });



  })
}

/**
 * Function for AWSs3Connection
 * @param {*} data (image information)
 * @param {*} return (uploaded information)
 */
const AWSs3Connection = new AWS.S3({
  "accessKeyId": config.accessKeyId,
  "secretAccessKey": config.secretAccessKey,
  "region": config.region
});

/**
 * Function for deleting file from s3 bucket
 * @param {*} data (image information)
 * @param {*} return (uploaded information)
 */
async function s3RemoveFile(key) {
  try {
    const params = {
      Bucket: bucketName,
      Delete: {
        Objects: [
          {
            Key: `${key}`,
          },
        ],
        Quiet: false,
      },
    };

    const s3BucketImageLocation = await AWSs3Connection.deleteObjects(
      params
    ).promise();
    return s3BucketImageLocation;
  } catch (error) {
    throw error;
  }
}

/**
 * Function for uploading files to s3 bucket
 * @param {*} data (image information)
 * @param {*} return (uploaded information)
 */
async function uploadS3Data(bucketPath, fileName, flag) {
  try {
    var fileType = fileName.split('.')[1]
    var contentType = 'application/octet-stream';
    if (fileType == 'pdf') contentType = 'application/pdf';
    if (
      fileType == 'png' ||
      fileType == 'jpg' ||
      fileType == 'gif' ||
      fileType == 'jpeg' ||
      fileType == 'webp' ||
      fileType == 'bmp'
    )
      contentType = `image/${fileType}`;
    if (fileType == 'svg') contentType = 'image/svg+xml';



    if (flag == "private") {
      // Use S3 ManagedUpload class as it supports multipart uploads
      var upload = new AWS.S3.ManagedUpload({
        params: {
          ACL: 'private',
          Bucket: bucketName,
          Key: bucketPath, //filename on the bucket with entire path
          Body: fs.createReadStream(fileName),
          ContentEncoding: 'base64',
          ContentType: contentType,
        }
      });

      var promise = upload.promise();
      var data = await promise
      console.log(data)
      return data
    }
    if (flag == "public") {
      // Use S3 ManagedUpload class as it supports multipart uploads
      var upload = new AWS.S3.ManagedUpload({
        params: {
          ACL: 'public-read',
          Bucket: bucketName,
          Key: bucketPath, //filename on the bucket with entire path
          Body: fs.createReadStream(fileName),
          ContentEncoding: 'base64',
          ContentType: contentType,
        }
      });

      var promise = upload.promise();
      var data = await promise
      console.log(data)
      return data
    }

  } catch (error) {
    console.log(error)
    throw error
  }
}



/**
 * Function for Encrypting the data
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
function encryptData(data) {
  if (config.bodyEncryption) {
    var dataString = JSON.stringify(data);
    var response = CryptoJS.AES.encrypt(dataString, config.cryptokey);
    return { encResponse: response.toString() };
  }
  return data;
}

/**
 * Function for decrypting the data
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypt data)
 */
function decryptData(data) {
  if (config.bodyEncryption) {
    var decrypted = CryptoJS.AES.decrypt(data, config.cryptokey);
    if (decrypted) {
      var userinfo = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      return userinfo;
    } else {
      return { userinfo: { error: 'Please send proper token' } };
    }
  }
  return data;
}

/**
 * Function for Encrypting the password
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
function encryptPassword(data) {
  var response = CryptoJS.AES.encrypt(data, config.tokenkey);
  return response.toString();
}

/**
 * Function for decrypting the password
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypt data)
 */
function decryptPassword(data) {
  var decrypted = CryptoJS.AES.decrypt(data, config.tokenkey);
  if (decrypted) {
    var userinfo = decrypted.toString(CryptoJS.enc.Utf8);
    return userinfo;
  } else {
    return { userinfo: { error: 'Please send proper token' } };
  }
}

/**
 * Function for encryting the userId with session
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
async function tokenEncrypt(data) {
  var token = await jwt.sign({ data: data }, config.tokenkey, {
    expiresIn: 24 * 60 * 60,
  }); // Expires in 1 day
  return token;
}

/**
 * Function for encryting the userId with session
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
async function tokenEncryptWithoutExpiry(data) {
  var token = await jwt.sign({ data: data }, config.tokenkey); // Expires in 1 day
  return token;
}




/**
 * Function for decryting the userId with session
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypted data)
 */
async function tokenDecrypt(data) {
  try {
    const decode = await jwt.verify(data, config.tokenkey);
    return decode;
  } catch (error) {
    return error;
  }
}

/**
 * Function for creating response
 * @param {*} data (status, data, token)
 * @param {*} return (encrypted data)
 */
function responseGenerator(statusCode, message, data = '') {
  var details = {
    statusCode: statusCode,
    message: message,
    result: data,
  };

  if (config.bodyEncryption) {
    return encryptData(details);
  } else {
    return details;
  }
}

/**
 * Function for sending email
 * @param {*} data (to, sub)
 * @param {*} return (decrypted data)
 */
async function sendEmail(to, subject, message) {

  console.log("------INSIDE SEND EMAIL FUNCTION-------------", to, subject, message);

  var transporter = nodemailer.createTransport({
    service: 'Godaddy',
    host: "smtpout.secureserver.net",
    secure: true,
    port: 465,

    auth: {
      user: config.emailUser,
      pass: config.emailPassword
    }
  });

  var mailOptions = {
    from: `${config.fromName}<${config.emailUser}>`,
    to: to,
    subject: subject,
    html: message,
  };

  try {
    const smsDetails = await transporter.sendMail(mailOptions);
    console.log("--------smsDetails------------", smsDetails);
    return smsDetails;
  } catch (error) {
    errorHandler(error);
  }
}

/**
 * Function to randomly generate string
 * param
 * return (err, result)
 */
function generateRandomString(callback) {
  var referralCode = randomstring.generate({
    length: 9,
    charset: 'alphanumeric',
    capitalization: 'uppercase',
  });
  callback(referralCode);
}

/* 
  Generate random string of specific size, 
  which used  for generating random password in create user by admin.
*/
function randomPasswordGenerater(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Function for Uploading file
 * @param {*} data (image information)
 * @param {*} return (uploaded information)
 */
async function uploadFile(fileInfo) {
  try {
    const fileType = fileInfo.fileType;
    const fileName = `${fileInfo.fileName}.${fileType}`;
    var base64 = fileInfo.base64.split(';base64,')[1];
    var fileBuffer = new Buffer.from(base64, 'base64');
    if (!fs.existsSync('./public/' + fileInfo.pathInfo)) {
      await fs.mkdirSync('./public/' + fileInfo.pathInfo, { recursive: true });
    }
    await fs.writeFileSync(
      './public/' + fileInfo.pathInfo + fileName,
      fileBuffer,
      'utf8'
    );
    return { fileName: fileName };
  } catch (e) {
    throw e;
  }
}



/**
 * Function for Uploading file to s3 bucket
 * @param {*} data (image information)
 * @param {*} return (uploaded information)
 */
async function s3FileUpload(postDataObj) {
  try {
    const fileType = postDataObj.fileType;
    const fileName = `${postDataObj.fileName}.${fileType}`;
    var base64 = postDataObj.base64.split(';base64,')[1];
    var base64Data = new Buffer.from(base64, 'base64');
    var contentType = 'application/octet-stream';
    if (fileType == 'pdf') contentType = 'application/pdf';
    if (
      fileType == 'png' ||
      fileType == 'jpg' ||
      fileType == 'gif' ||
      fileType == 'jpeg' ||
      fileType == 'webp' ||
      fileType == 'bmp'
    )
      contentType = `image/${fileType}`;
    if (fileType == 'svg') contentType = 'image/svg+xml';
    const params = {
      Bucket: `${config.awsBucket}/user-profile`,
      Key: `${postDataObj.key}.${fileType}`,
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: contentType,
    };
    const s3BucketFileLocation = await AWSs3Connection.upload(params).promise();
    return { location: s3BucketFileLocation, fileName: imageName };
  } catch (error) {
    throw error;
  }
}



module.exports = {
  encryptData,
  decryptData,
  encryptPassword,
  decryptPassword,
  tokenEncrypt,
  tokenEncryptWithoutExpiry,
  tokenDecrypt,
  responseGenerator,
  sendEmail,
  generateRandomString,
  randomPasswordGenerater,
  uploadFile,
  s3FileUpload,
  s3RemoveFile,
  uploadS3Data,
  generateSignedUrl,
};
