// basic express server setup with helmet for security and static files
const fs = require('fs');
const { parse } = require('csv-parse');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const { ensureSchema, insertFormRecord, insertManyRecords } = require('./database');

const PORT = process.env.PORT || 3000;
const app = express();

// use helmet for basic security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],        // allow content only from my server
        scriptSrc: ["'self'"],         // allow javascript only from my server
        styleSrc: ["'self'"],          // allow css only from my server
        imgSrc: ["'self'", "data:"],   // allow local images and data urls
        connectSrc: ["'self'"],        // only allow send data requests to itself
        objectSrc: ["'none'"],         // block plugins from old browser to run on the site
        baseUri: ["'self'"],           // prevent attacker change the base url
        frameAncestors: ["'none'"]     // not allowed the website to be shown inside any iframe on any other site
      }
    }
  })
);


// let the server read json and normal form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve css and javascript files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// clean user input and remove unwanted characters
function cleanText(value) {
  return String(value || '')
    .trim()
    .replace(/[<>]/g, '')   // remove <  >
    .replace(/\s+/g, ' ');  // remove extra spaces
}

// server-side validation rules 
const namePattern = /^[A-Za-z0-9]{1,20}$/;        // letters and numbers only max 20
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // basic email format
const phonePattern = /^\d{10}$/;                  // exactly 10 digits
const eircodePattern = /^[0-9][A-Za-z0-9]{5}$/;   // starts with number and 6 chars only

// clean and validate incoming form data
function validatePayload(body) {
  const cleaned = {
    first_name: cleanText(body.first_name),              // clean text input
    second_name: cleanText(body.second_name),
    email: cleanText(body.email),
    phone_number: cleanText(body.phone_number),
    eircode: cleanText(body.eircode)                     // clean eircode
      .replace(/\s+/g, '')                               // remove spaces
      .toUpperCase()                                     // make the eircode to uppercase
  };

  const errors = {};

  // check each field and collect errors
  if (!namePattern.test(cleaned.first_name)) errors.first_name = 'first_name invalid';
  if (!namePattern.test(cleaned.second_name)) errors.second_name = 'second_name invalid';
  if (!emailPattern.test(cleaned.email)) errors.email = 'email invalid';
  if (!phonePattern.test(cleaned.phone_number)) errors.phone_number = 'phone_number invalid';
  if (!eircodePattern.test(cleaned.eircode)) errors.eircode = 'eircode invalid';

  // show cleaned data, errors, and the final result
  return {
    cleaned,
    errors,
    valid: Object.keys(errors).length === 0
  };
}


// serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// simple health check to make sure server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// check the form submitted and save valid data to the database
app.post('/submit', async (req, res) => {
  try {
    await ensureSchema(); // make sure the table exists

    const { cleaned, errors, valid } = validatePayload(req.body); // clean and validate input

    if (!valid) { // stop if validation fails
      return res.status(400).json({
        error: 'validation failed',
        errors
      });
    }

    const newId = await insertFormRecord(cleaned); // save data to database

    return res.status(201).json({
      message: `saved successfully (id: ${newId})`
    });

  } catch (err) {
    console.error('db insert error:', err);   // log the error on the server
    return res.status(500).json({
      error: 'server/database error. please try again later.' // send a simple error message to the user
    });
  }
});


// import csv file then save valid rows to the database
app.get('/import-csv', async (req, res) => {
  try {
    //to make sure the table exists
    await ensureSchema();

    const csvPath = path.join(__dirname, 'csv', 'person_info.csv');

    // stop if the csv file is not there
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        error: 'csv file not found. put it in /csv/person_info.csv'
      });
    }

    //use same validation rules with form validation
    const namePattern = /^[A-Za-z0-9]{1,20}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d{10}$/;
    const eircodePattern = /^[0-9][A-Za-z0-9]{5}$/;

    const validRecords = [];
    const invalidRows = [];

    // treat csv header as row 1 in the excel style
    let excelRow = 1;

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(parse({
          columns: true,        // use header row as keys
          trim: true,
          skip_empty_lines: true,
          bom: true
        }))
        .on('data', (row) => {
          excelRow += 1;

          // support different column name styles
          const first_name = (row.first_name || row.firstName || row.firstname || '').trim();
          const second_name = (row.second_name || row.secondName || row.secondname || '').trim();
          const email = (row.email || '').trim();
          const phone_number = (row.phone_number || row.phone || row.phonenumber || '').trim();
          const eircode = (row.eircode || '').trim();

          const rowErrors = [];

          // validate every field
          if (!namePattern.test(first_name)) rowErrors.push('first_name invalid');
          if (!namePattern.test(second_name)) rowErrors.push('second_name invalid');
          if (!emailPattern.test(email)) rowErrors.push('email invalid');
          if (!phonePattern.test(phone_number)) rowErrors.push('phone_number invalid (must be 10 digits)');
          if (!eircodePattern.test(eircode)) rowErrors.push('eircode invalid (must start with number, 6 chars)');

          // record the row number and errors if it is invalid
          if (rowErrors.length > 0) {
            invalidRows.push({ row: excelRow, errors: rowErrors });
            console.error(`csv row ${excelRow} failed: ${rowErrors.join(', ')}`);
            return;
          }

          // add it to the insert list if it is valid
          validRecords.push({ first_name, second_name, email, phone_number, eircode });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // insert only the valid records
    const inserted = await insertManyRecords(validRecords);

    return res.status(200).json({
      message: 'csv import completed',
      inserted_rows: inserted,
      invalid_count: invalidRows.length,
      invalid_rows: invalidRows
    });

  } catch (err) {
    // handle the unexpected errors
    console.error('csv import error:', err);
    return res.status(500).json({
      error: 'server error while importing csv'
    });
  }
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
