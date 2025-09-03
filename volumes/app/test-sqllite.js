const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/app/data/visits.db');
db.get('SELECT COUNT(*) as count FROM sites', (err, row) => {
  if (err) console.error('Error:', err);
  else console.log('Sites in database:', row.count);
  db.close();
});
