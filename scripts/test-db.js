const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Fallback manual parser for .env.local if not loaded via --env-file
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

  console.log('--------------------------------------------------');
  console.log('Testing Remote MySQL Database Connection...');
  console.log(`Host:     ${host}`);
  console.log(`Port:     ${port}`);
  console.log(`User:     ${user}`);
  console.log(`Database: ${database}`);
  console.log('--------------------------------------------------');

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 10000,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log(' [SUCCESS] Connected successfully to the remote MySQL database!');

    const [rows] = await connection.execute('SHOW TABLES;');
    console.log(` Database contains ${rows.length} table(s):`);
    if (rows.length > 0) {
      rows.forEach((r, idx) => {
        console.log(`   ${idx + 1}. ${Object.values(r)[0]}`);
      });
    } else {
      console.log('   (No tables found yet. The database is empty.)');
    }

    await connection.end();
    console.log(' Connection closed cleanly.');
  } catch (err) {
    console.error('\n [CONNECTION FAILED]');
    console.error(`Error Code: ${err.code}`);
    console.error(`Error Message: ${err.message}`);

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n Cause:');
      console.error('Hostinger blocks remote connections by default unless the client IP is whitelisted.');
      console.error(' How to fix in Hostinger hPanel:');
      console.error('1. Go to Hostinger hPanel -> Databases -> Remote MySQL');
      console.error('2. In "IP (IPv4 or IPv6)", enter "%" (to allow any IP) or your specific IP.');
      console.error(`3. Select database "${database}".`);
      console.error('4. Click "Create" and retry.');
    }
  }
}

run();
