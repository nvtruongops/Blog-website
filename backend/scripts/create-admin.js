/**
 * Script to create a new admin user
 * Run this script to create a new user with admin role
 * 
 * Usage: node scripts/create-admin.js <email> <password> [name]
 * Example: node scripts/create-admin.js admin@example.com Admin123! "Admin User"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin';

    if (!email || !password) {
        console.log('❌ Please provide email and password');
        console.log('Usage: node scripts/create-admin.js <email> <password> [name]');
        console.log('Example: node scripts/create-admin.js admin@example.com Admin123! "Admin User"');
        process.exit(1);
    }

    // Validate password strength
    if (password.length < 8) {
        console.log('❌ Password must be at least 8 characters long');
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected to MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            console.log(`⚠️ User with email "${email}" already exists`);
            console.log('Would you like to update this user to admin? Run:');
            console.log(`  node scripts/setup-admin.js ${email}`);
            process.exit(1);
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin user
        console.log('👤 Creating admin user...');
        const newUser = new User({
            name: name,
            email: email.toLowerCase(),
            password: hashedPassword,
            verify: true, // Admin is pre-verified
            role: 'admin',
            hasSetPassword: true,
        });

        await newUser.save();

        console.log('\n✅ Admin user created successfully!');
        console.log('\n📋 User Details:');
        console.log(`  - ID: ${newUser._id}`);
        console.log(`  - Email: ${newUser.email}`);
        console.log(`  - Name: ${newUser.name}`);
        console.log(`  - Role: ${newUser.role}`);
        console.log(`  - Verified: ${newUser.verify}`);
        console.log('\n🎉 You can now login at /auth and access the admin dashboard at /admin');
        console.log(`\n🔑 Login credentials:`);
        console.log(`  - Email: ${email}`);
        console.log(`  - Password: ${password}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

createAdmin();
