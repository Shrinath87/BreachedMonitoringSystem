require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@gmail.com' },
    update: {},
    create: { name: 'Test User', email: 'test@gmail.com', password: hash, role: 'user' }
  });
  console.log('Seeded user:', user.email, '| id:', user.id);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
