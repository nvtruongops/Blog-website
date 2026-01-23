/**
 * Script to set up an admin user
 * Run this script to promote a user to admin role
 * 
 * Usage: node scripts/setup-admin.js <email>
 * Example: node scripts/setup-admin.js admin@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function setupAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.log('❌ Please provide an email address');
        console.log('Usage: node scripts/setup-admin.js <email>');
        process.exit(1);
    }

    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            console.log('\nAvailable users:');
            const users = await User.find().select('email name role').limit(10);
            users.forEach(u => {
                console.log(`  - ${u.email} (${u.name || 'No name'}) - Role: ${u.role || 'user'}`);
            });
            process.exit(1);
        }

        // Check if already admin
        if (user.role === 'admin') {
            console.log(`ℹ️ User "${user.name || email}" is already an admin`);
            process.exit(0);
        }

        // Update user role to admin
        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully promoted "${user.name || email}" to admin!`);
        console.log('\n📋 User Details:');
        console.log(`  - ID: ${user._id}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Name: ${user.name || 'Not set'}`);
        console.log(`  - Role: ${user.role}`);
        console.log('\n🎉 This user can now access the admin dashboard at /admin');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

setupAdmin();
