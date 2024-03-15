const mysql = require('mysql');
const dotenv = require('dotenv').config();

// const pool = mysql.createPool({
//     // connectionLimit: 10,
//     // connectTimeout: 60 * 60 * 10,
//     // acquireTimeout: 60 * 60 * 10,
//     // timeout: 60 * 60 * 10,
//     port: 3306,
//     host: process.env.HOST,
//     user: process.env.USER,
//     password: process.env.PASSWORD,
//     database: process.env.DATABASE,
//     createDatabaseTable: false,
// });

const options = {
    connectionLimit: 10,
    password: process.env.PASSWORD,
    user: process.env.USER,
    database: process.env.DATABASE,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    createDatabaseTable: false
};

const pool = mysql.createPool(options);


pool.getConnection((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('db connected');
});



module.exports = {
    options,
    pool
}