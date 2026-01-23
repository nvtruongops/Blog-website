/**
 * Setup Moderator Script
 * Promotes a user to moderator role
 * 
 * Usage: node scripts/setup-moderator.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const keys = require('../config/keys');

// Define User schema inline to avoid dependency issues
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    }
});

const User = mongoose.model('User', userSchema);

async function setupModerator(email) {
    try {
        // Connect to MongoDB
        await mongoose.connect(keys.MONGO_URI);
        console.log('Connected to MongoDB');

        if (!email) {
            // List all users who are not moderators or admins
            const users = await User.find({ role: 'user' }).select('email name').limit(20);
            console.log('\nAvailable users to promote:');
            users.forEach(u => console.log(`  - ${u.email} (${u.name || 'No name'})`));
            console.log('\nUsage: node scripts/setup-moderator.js <email>');
            process.exit(0);
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        if (user.role === 'moderator') {
            console.log(`ℹ️ User ${email} is already a moderator`);
            process.exit(0);
        }

        if (user.role === 'admin') {
            console.log(`ℹ️ User ${email} is already an admin (higher role)`);
            process.exit(0);
        }

        // Update user role to moderator
        user.role = 'moderator';
        await user.save();

        console.log(`✅ Successfully promoted ${email} to moderator!`);
        console.log(`\nModerator can now access:`);
        console.log(`  - /moderator - Moderator dashboard`);
        console.log(`  - View and handle reports`);
        console.log(`  - Delete posts and comments`);
        console.log(`  - Ban users (but not delete)`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];
setupModerator(email);
