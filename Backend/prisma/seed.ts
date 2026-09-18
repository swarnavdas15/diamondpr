import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Clean Database Seeding (Super Admin Only)...');

  // 1. Clean existing records safely
  await prisma.stageLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.drawing.deleteMany();
  await prisma.task.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash password for Super Admin
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // 3. Create Initial Super Admin Account
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Swarnav Das',
      email: 'admin@flangeerp.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('✅ Super Admin Account Successfully Created!');
  console.log(`   Email: ${superAdmin.email}`);
  console.log('   Password: Admin@123');
  console.log('🚀 Ready to accept dynamic users and orders via Admin Portal.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });