const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        let val = trimmed.slice(eqIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));

async function run() {
  const host = process.env.DB_HOST || 'srv1740.hstgr.io';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'u546576758_chatbot_his';
  const password = process.env.DB_PASSWORD || 'HisOmega@2026';
  const database = process.env.DB_NAME || 'u546576758_chatbot_his';

  console.log('Connecting to Hostinger MySQL to execute schema...');
  
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
    connectTimeout: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'lib', 'db', 'schema.mysql.sql'), 'utf-8');
    console.log('Applying schema statements...');
    await connection.query(schemaSql);
    console.log('Schema applied successfully!');

    const [rows] = await connection.query('SHOW TABLES;');
    console.log(`Database now contains ${rows.length} table(s):`);
    rows.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${Object.values(r)[0]}`);
    });
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

run();
