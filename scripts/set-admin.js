const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const bcrypt = require('bcryptjs');

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
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
