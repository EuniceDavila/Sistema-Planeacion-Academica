const mysql = require('mysql2/promise');
require('dotenv').config();

const conexion = mysql.createPool({ 
    
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    
    password: process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    
    port: process.env.MYSQLPORT || 3306, 
    multipleStatements: true
});

module.exports = conexion;