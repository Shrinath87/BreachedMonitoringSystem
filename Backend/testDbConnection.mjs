import mysql from 'mysql2/promise';

const passwords = [
  'root', 'password', 'mysql', '123456', 'admin', 'Admin@123',
  'P@ssword', 'P@ss123', 'Welcome1', 'Mysql@123',
  'Prajwal', 'prajwal', 'Prajwal@1', 'Prajwal@123',
  'cyber', 'Cyber123', 'breach', 'Breach123',
  'Shrinath', 'shrinath', 'Shrinath@1', 'shrinath123',
  'Sonavale', 'sonavale', 'test', 'Test@123',
  '12345678', 'pass', 'Pass@123', 'Root@123',
  'MySQL@123', 'mysql123', 'root123', 'Root123',
  'Shrinath@123', 'shrinath@123', 'dsu', 'DSU@123',
];

for (const pwd of passwords) {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', port: 3306, user: 'root', password: pwd,
    });
    console.log(`✅ Password found: "${pwd}"`);
    const [dbs] = await conn.query("SHOW DATABASES LIKE 'breach_monitor'");
    console.log('breach_monitor exists:', dbs.length > 0);
    await conn.end();
    process.exit(0);
  } catch (e) {
    // try next
  }
}
console.log('❌ None of the passwords worked');
