/**
 * Test script to create sample reports
 * Run: node scripts/test-create-report.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const keys = require('../config/keys');

async function createTestReports() {
    try {
        // Connect to MongoDB
        await mongoose.connect(keys.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a user and a post
        const user = await User.findOne();
        const post = await Post.findOne();

        if (!user || !post) {
            console.log('No users or posts found. Please create some first.');
            process.exit(1);
        }

        console.log(`Found user: ${user.name}`);
        console.log(`Found post: ${post.title}`);

        // Create sample reports
        const sampleReports = [
            {
                reporter: user._id,
                targetType: 'post',
                targetId: post._id,
                targetModel: 'Post',
                reason: 'spam',
                description: 'This post contains spam content',
                status: 'pending'
            },
            {
                reporter: user._id,
                targetType: 'post',
                targetId: post._id,
                targetModel: 'Post',
                reason: 'inappropriate_content',
                description: 'Inappropriate content detected',
                status: 'pending'
            },
            {
                reporter: user._id,
                targetType: 'post',
                targetId: post._id,
                targetModel: 'Post',
                reason: 'harassment',
                description: 'Contains harassment',
                status: 'reviewing'
            }
        ];

        // Delete existing test reports
        await Report.deleteMany({ reporter: user._id });
        console.log('Cleared existing test reports');

        // Create new reports
        const createdReports = await Report.insertMany(sampleReports);
        console.log(`Created ${createdReports.length} test reports`);

        // Display created reports
        createdReports.forEach((report, index) => {
            console.log(`\nReport ${index + 1}:`);
            console.log(`  - Reason: ${report.reason}`);
            console.log(`  - Status: ${report.status}`);
            console.log(`  - Description: ${report.description}`);
        });

        console.log('\n✅ Test reports created successfully!');
        console.log('You can now view them at /moderator/reports');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test reports:', error);
        process.exit(1);
    }
}

createTestReports();
