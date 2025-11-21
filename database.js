//database.js
//basic SQL config+ helper to get a connection pool

const mysql = require('mysql2/promise');

//MYSQL configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',                // MYSQL login user
  password: 'Pik@chu92',      // password for MYSQL 
  database: 'ca2_secure_app', // DB name
  port: 3306                   // default MYSQL port
};

let pool;


//get or create the MySQL connection pool.
//other files (index.js, CSV logic, form handler) will call this.
 
async function getPool() {
  if (!pool) {
    //only create the pool once
    pool = await mysql.createPool(dbConfig);
    console.log('MySQL pool created');
  }
  return pool;
}

//export these so index.js can usse them
module.exports = { getPool, dbConfig };