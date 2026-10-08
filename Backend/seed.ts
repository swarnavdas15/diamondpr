import { db } from './src/prisma/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');
  
  // Seed Super Admin
  const adminEmail = 'admin@diamondflanges.com';
  const hashedPassword = await bcrypt.hash('Manish@admin123', 10);
  
  // Check if admin already exists
  const existingAdmin = await db.orm.public.User.where({ email: adminEmail, isDeleted: 0 }).first();
  let adminId;

  if (!existingAdmin) {
    const admin = await db.orm.public.User.create({
      name: 'Super Admin',
      username: adminEmail,
      email: adminEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isDeleted: 0,
    });
    adminId = admin.id;
    console.log('✅ Created Super Admin User (admin@diamondflanges.com)');
  } else {
    adminId = existingAdmin.id;
    await db.orm.public.User.where({ id: adminId }).update({
      password: hashedPassword,
      username: adminEmail,
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    console.log('✅ Updated Super Admin password & credentials (admin@diamondflanges.com)');
  }

  // Seed Initial Client
  const existingClient = await db.orm.public.Client.where({ clientcode: 'CL-1001' }).first();
  if (!existingClient) {
    await db.orm.public.Client.create({
      clientcode: 'CL-1001',
      companyName: 'Apex Heavy Engineering Pvt Ltd',
      contactNo: '+91 98765 43210',
      email: 'contact@apexheavy.com',
      address: 'Plot 42, Industrial Area Phase II, Pune',
      gstNumber: '27AAACA12341Z5',
      createdById: adminId,
    });
    console.log('✅ Created Initial Client');
  } else {
    console.log('⚠️ Initial Client already exists');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
