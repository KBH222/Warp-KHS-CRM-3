#!/usr/bin/env node

/**
 * Secure Admin User Creation Script
 * 
 * This script creates an initial admin user for the KHS CRM system.
 * Run this script ONCE during initial deployment to set up the first admin user.
 * 
 * Usage: 
 *   node scripts/create-admin.js
 *   
 * Environment variables required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - ADMIN_EMAIL: Email for the admin user
 *   - ADMIN_PASSWORD: Secure password for the admin user
 *   - ADMIN_NAME: Full name for the admin user
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Validate environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    if (!adminEmail || !adminPassword) {
      console.error('❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
      console.error('   Example: ADMIN_EMAIL=admin@khscrm.com ADMIN_PASSWORD=SecurePassword123! node scripts/create-admin.js');
      process.exit(1);
    }

    // Validate password strength
    if (adminPassword.length < 12) {
      console.error('❌ ERROR: Admin password must be at least 12 characters long');
      process.exit(1);
    }

    const hasUppercase = /[A-Z]/.test(adminPassword);
    const hasLowercase = /[a-z]/.test(adminPassword);
    const hasNumbers = /\d/.test(adminPassword);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(adminPassword);

    if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSymbols) {
      console.error('❌ ERROR: Admin password must contain uppercase, lowercase, numbers, and symbols');
      process.exit(1);
    }

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.error('❌ ERROR: User with this email already exists');
      console.error('   Use a different email or update the existing user');
      process.exit(1);
    }

    // Hash the password with a strong salt
    console.log('🔐 Hashing password with bcrypt (rounds: 12)...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'OWNER',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📋 User Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    console.log('');
    console.log('🔑 IMPORTANT SECURITY NOTES:');
    console.log('   - Store the admin credentials securely');
    console.log('   - Consider setting up additional admin users');
    console.log('   - Enable two-factor authentication when available');
    console.log('   - This script should only be run once during setup');

  } catch (error) {
    console.error('❌ ERROR: Failed to create admin user');
    console.error('   Error details:', error.message);
    
    if (error.code === 'P2002') {
      console.error('   This error usually means the email is already taken');
    } else if (error.code === 'P1001') {
      console.error('   Database connection failed. Check your DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt for production safety
function confirmExecution() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🚨 ADMIN USER CREATION');
    console.log('   This will create a new admin user with OWNER privileges.');
    console.log('   Make sure you have set the environment variables correctly.');
    console.log('');
    
    rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'yes') {
        resolve(true);
      } else {
        console.log('Operation cancelled.');
        process.exit(0);
      }
    });
  });
}

// Main execution
async function main() {
  console.log('🏗️  KHS CRM - Admin User Setup');
  console.log('================================');
  
  await confirmExecution();
  await createAdminUser();
}

main().catch(console.error);
