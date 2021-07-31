const mysql = require("mysql");
const config = require("../../config");
let dbConfig = {
    host: config.databaseHost,
    user: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    connectionLimit: 300,
    multipleStatements: true
};

// let dbConfig = {
//   host: "localhost",
//   user: "root",
//   password: "QIAu#JUD1I^g",
//   database: "supra",
//   port: "3306",
//   connectionLimit: 300,
//   multipleStatements: true
// };




const pool = mysql.createPool(dbConfig);
const connection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            console.log("MySQL pool connected: threadId " + connection.threadId);
            const query = (sql, binding) => {
                return new Promise((resolve, reject) => {
                    connection.query(sql, binding, (err, result) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        resolve(result);
                    });
                });
            };
            const release = () => {
                return new Promise((resolve, reject) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    console.log("MySQL pool released: threadId " + connection.threadId);
                    resolve(connection.release());
                });
            };
            resolve({ query, release });
        });
    });
};
// const query = (sql, binding) => {
//   return new Promise((resolve, reject) => {
//     pool.query(sql, binding, (err, result, fields) => {
//       if (err) reject(err);
//       resolve(result);
//     });
//   });
// };
// module.exports = { pool, connection, query };

module.exports = { connection };
