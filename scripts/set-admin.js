const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString.includes('.neon.tech')
  ? new PrismaNeon({ connectionString })
  : new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('admin1234', 10);
  const user = await prisma.user.upsert({
    where: { email: '1@gmail.com' },
    update: { isAdmin: true },
    create: { name: 'Admin', email: '1@gmail.com', password: hash, isAdmin: true },
  });
  console.log('Admin set:', user.email, 'isAdmin:', user.isAdmin);
}

main().catch(console.error).finally(() => prisma.$disconnect());
