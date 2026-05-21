const mysql = require('mysql2/promise');
require('dotenv').config();

const conexion = mysql.createPool({ 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
});

module.exports = conexion;