const env = require("dotenv");
env.config({ path: process.env.NODE_ENV === "production" ? ".env.prod" : ".env.dev" });

module.exports = {
  port: process.env.PORT,
  databaseHost: process.env.DB_HOST,
  databaseUser: process.env.DB_USER,
  databasePassword: process.env.DB_PASSWORD,
  databaseName: process.env.DB_NAME,
  cryptokey: process.env.CRYPTO_KEY, //'commonAPI',
  tokenkey: process.env.TOKEN_KEY,
  emailVerificationLink: process.env.EMAIL_VERIFICATION_LINK_CUSTOMER,
  resetPasswordLink: process.env.RESET_PASSWORD_LINK_CUSTOMER,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  supportEmail: process.env.SUPPORT_EMAIL,
  fromName: process.env.SMTP_FROMNAME,

};
