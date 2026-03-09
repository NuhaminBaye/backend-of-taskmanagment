/**
 * Script to manually insert a user into the database
 * 
 * Usage:
 * 1. Make sure your DATABASE_URL is set in .env
 * 2. Run: npx ts-node server/scripts/insert-user.ts
 * 
 * Or use this as a reference and run the Prisma queries in your code
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertUser() {
  try {
    // Example user data
    const userData = {
      id: 'user_natamnatamt_001',        // Unique ID - use any format
      name: 'Natam Natamt',               // Full name
      email: 'natamnatamt@gmail.com',     // Email (must be unique)
      image: 'https://example.com/avatar.jpg', // Profile image URL
      // createdAt and updatedAt are auto-generated, but you can set them if needed
    };

    // Insert the user
    const user = await prisma.user.create({
      data: userData,
    });

    console.log('✅ User created successfully:');
    console.log(user);

    // Example with multiple users
    const multipleUsers = [
      {
        id: 'user_test_001',
        name: 'Test User One',
        email: 'test1@example.com',
        image: '',
      },
      {
        id: 'user_test_002',
        name: 'Test User Two',
        email: 'test2@example.com',
        image: 'https://img.clerk.com/preview.png',
      },
    ];

    // Uncomment to insert multiple users
    // const users = await prisma.user.createMany({
    //   data: multipleUsers,
    //   skipDuplicates: true, // Skip if email already exists
    // });
    // console.log('✅ Multiple users created:', users);

  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // If email already exists
    if (error.code === 'P2002') {
      console.error('⚠️  Email already exists in database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
insertUser();



