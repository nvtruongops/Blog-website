/**
 * Report Model
 * For handling user-submitted reports on posts, comments, or users
 */

const { model, Schema } = require("mongoose");

const reportSchema = new Schema(
    {
        // Who submitted the report
        reporter: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Type of content being reported
        targetType: {
            type: String,
            enum: ['post', 'comment', 'user'],
            required: true
        },
        // ID of the reported content
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'targetModel'
        },
        // Dynamic reference based on targetType
        targetModel: {
            type: String,
            enum: ['Post', 'User'],
            required: true
        },
        // Report reason/category
        reason: {
            type: String,
            enum: [
                'spam',
                'harassment',
                'hate_speech',
                'violence',
                'inappropriate_content',
                'misinformation',
                'copyright',
                'other'
            ],
            required: true
        },
        // Additional details from reporter
        description: {
            type: String,
            maxlength: 1000
        },
        // Report status
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
            default: 'pending'
        },
        // Who handled the report
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        },
        // Action taken
        actionTaken: {
            type: String,
            enum: ['none', 'warning', 'content_removed', 'user_banned', 'dismissed'],
            default: null
        },
        // Reviewer notes
        reviewNotes: {
            type: String,
            maxlength: 500
        }
    },
    { timestamps: true }
);

// Index for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reporter: 1 });

module.exports = model("Report", reportSchema);
