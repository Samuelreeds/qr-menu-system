import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const plainPassword = 'Admin@123456';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      role: 'SUPERADMIN',
    },
    create: {
      email,
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  console.log('Default SuperAdmin ready:', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });