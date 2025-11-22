// basic express server setup with helmet for security and static files

const express = require('express');
const helmet = require('helmet');
const path = require('path');
const { getPool } = require('./database'); 

const PORT = process.env.PORT || 3000;
const app = express();

// use helmet for basic security headers
app.use(helmet());

// let the server read json and normal form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve css and javascript files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// temporary check the server is running
app.get('/', (req, res) => {
  res.send('<h1>ca2 server is running</h1><p>form will be added here later.</p>');
});

// simple health check to make sure server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// start the server normally
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});

// if the port is already taken, show clear error and exit
app.on('error', (err) => {
  console.error(`cannot start server on port ${PORT}: ${err.message}`);
  process.exit(1);
});
