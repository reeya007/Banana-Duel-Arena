// Opens the SQLite file and creates the tables on start-up.
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', '..', 'data.sqlite'));
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
module.exports = db;