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

// serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// simple health check to make sure server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// temporary test
app.post('/submit', (req, res) => {
  // log data to check the server is receiving it
  console.log('received form data:', req.body);

  // send back a success response
  return res.status(201).json({
    message: 'server received the data successfully.',
    received: req.body
  });
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
