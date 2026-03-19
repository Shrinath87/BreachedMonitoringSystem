import mysql from 'mysql2/promise';

// Try multiple passwords to find the correct one
const passwords = ['P@ssword', 'password', 'root', 'mysql', '123456', 'admin', 'Admin@123', 'P@ss123', 'Welcome1', 'Mysql@123', 'Prajwal', 'prajwal', 'Prajwal@1', 'cyber', 'Cyber123', 'breach', 'Breach123'];

async function tryConnect(password) {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password });
    await conn.end();
    return true;
  } catch (e) {
    return false;
  }
}

async function run() {
  for (const pwd of passwords) {
    const ok = await tryConnect(pwd);
    if (ok) {
      console.log(`Found working password: ${pwd}`);
      const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: pwd });
      await conn.query('CREATE DATABASE IF NOT EXISTS breach_monitor');
      console.log('Database breach_monitor created/verified');
      const [dbs] = await conn.query('SHOW DATABASES');
      console.log('Databases:', dbs.map(r => r.Database).join(', '));
      await conn.end();
      return;
    }
  }
  console.log('None of the passwords worked');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
