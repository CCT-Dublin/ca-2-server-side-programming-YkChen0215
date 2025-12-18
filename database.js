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


 //checks the database table and creates it if needed
 
async function ensureSchema() {
  const pool = await getPool();

  // create table if it does not already exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mysql_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(20) NOT NULL,
      second_name VARCHAR(20) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone_number VARCHAR(10) NOT NULL,
      eircode VARCHAR(6) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('schema checked: mysql_table is ready');
}

// saves one form record into the database
// uses a prepared query to keep things safe

async function insertFormRecord(data) {
  const pool = await getPool();

  const sql = `
    INSERT INTO mysql_table (first_name, second_name, email, phone_number, eircode)
    VALUES (?, ?, ?, ?, ?);
  `;

  // values to insert into the table
  const params = [
    data.first_name,
    data.second_name,
    data.email,
    data.phone_number,
    data.eircode
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

//export these so index.js can usse them
module.exports = { getPool, dbConfig, ensureSchema, insertFormRecord };
