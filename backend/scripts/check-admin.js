/**
 * Script to check admin user status
 * Usage: node scripts/check-admin.js [email]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function checkAdmin() {
    const email = process.argv[2];

    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected to MongoDB\n');

        let query = { role: 'admin' };
        if (email) {
            query.email = email.toLowerCase();
        }

        const admins = await User.find(query).select('-password -tempPassword');

        if (admins.length === 0) {
            console.log('❌ No admin users found');
            if (email) {
                console.log(`\nUser with email "${email}" is not an admin or doesn't exist`);
            }
        } else {
            console.log(`📋 Found ${admins.length} admin user(s):\n`);
            admins.forEach((admin, index) => {
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`Admin #${index + 1}`);
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`  ID:           ${admin._id}`);
                console.log(`  Email:        ${admin.email}`);
                console.log(`  Name:         ${admin.name || 'Not set'}`);
                console.log(`  Role:         ${admin.role}`);
                console.log(`  Verified:     ${admin.verify ? '✅ Yes' : '❌ No'}`);
                console.log(`  Google Auth:  ${admin.googleId ? '✅ Yes' : '❌ No'}`);
                console.log(`  Has Password: ${admin.hasSetPassword ? '✅ Yes' : '❌ No'}`);
                console.log(`  Created:      ${admin.createdAt?.toLocaleString('vi-VN') || 'Unknown'}`);
                console.log(`  Posts:        ${admin.posts?.length || 0}`);
                console.log(`  Followers:    ${admin.followerscount || 0}`);
                console.log(`  Following:    ${admin.followingcount || 0}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkAdmin();
