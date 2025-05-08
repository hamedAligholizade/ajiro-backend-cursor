const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@ajiro.com',
      },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('ajiro2024', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@ajiro.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        phone: '09123456789',
        role: 'admin',
        is_active: true,
        email_verified: true,
        phone_verified: true,
      },
    });

    console.log('Admin user created successfully:', adminUser.email);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAdminUser(); 