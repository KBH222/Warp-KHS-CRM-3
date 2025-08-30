const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function createUser() {
  try {
    const email = await question('Email: ');
    const name = await question('Name: ');
    const password = await question('Password: ');
    const role = await question('Role (OWNER/WORKER): ');
    
    const hashedPassword = await bcrypt.hash(password, 10);  // This line must exist
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,  // Uses the hashed version
        role: role.toUpperCase()
      }
    });
    
    console.log('User created successfully:', user.email);
  } catch (error) {
    console.error('Error creating user:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createUser();