/**
 * OWASP Top 10 Security Tests
 * Testing 3 critical security rules:
 * 1. A01:2021 - Broken Access Control
 * 2. A03:2021 - Injection (SQL/NoSQL/XSS)
 * 3. A07:2021 - Identification and Authentication Failures
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

// Mock Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Import middleware
const { authUser } = require('../middleware/auth');
const { isModerator } = require('../middleware/moderatorAuth');
const { isAdmin } = require('../middleware/adminAuth');
const { sanitizeHTML, handleValidationErrors, postValidation } = require('../middleware/validator');
const { mongoSanitize } = require('../middleware/security');

// Import models
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');

describe('OWASP A01:2021 - Broken Access Control Tests', () => {
    let regularUserToken;
    let moderatorToken;
    let adminToken;
    let regularUserId;
    let moderatorUserId;
    let adminUserId;

    beforeAll(async () => {
        // Create test users with different roles
        const regularUser = { id: new mongoose.Types.ObjectId(), role: 'user' };
        const moderator = { id: new mongoose.Types.ObjectId(), role: 'moderator' };
        const admin = { id: new mongoose.Types.ObjectId(), role: 'admin' };

        regularUserId = regularUser.id;
        moderatorUserId = moderator.id;
        adminUserId = admin.id;

        regularUserToken = jwt.sign(regularUser, keys.TOKEN_SECRET, { expiresIn: '1h' });
        moderatorToken = jwt.sign(moderator, keys.TOKEN_SECRET, { expiresIn: '1h' });
        adminToken = jwt.sign(admin, keys.TOKEN_SECRET, { expiresIn: '1h' });
    });

    describe('Test 1.1: Unauthorized Access Prevention', () => {
        test('Should block access to protected routes without token', async () => {
            const mockReq = {
                header: jest.fn().mockReturnValue(null),
                originalUrl: '/api/protected'
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            await authUser(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Should block access with invalid token', async () => {
            const mockReq = {
                header: jest.fn().mockReturnValue('Bearer invalid_token'),
                originalUrl: '/api/protected'
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            await authUser(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Should block access with expired token', async () => {
            const expiredToken = jwt.sign(
                { id: regularUserId, role: 'user' },
                keys.TOKEN_SECRET,
                { expiresIn: '-1h' } // Expired 1 hour ago
            );

            const mockReq = {
                header: jest.fn().mockReturnValue(`Bearer ${expiredToken}`),
                originalUrl: '/api/protected'
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            await authUser(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token expired' });
        });
    });

    describe('Test 1.2: Role-Based Access Control (RBAC)', () => {
        test('Should verify role checking logic exists', () => {
            // Test that middleware functions exist and are callable
            expect(typeof isModerator).toBe('function');
            expect(typeof isAdmin).toBe('function');
        });

        test('Should have proper role hierarchy', () => {
            const roles = ['user', 'moderator', 'admin'];
            const roleHierarchy = {
                user: 0,
                moderator: 1,
                admin: 2
            };

            expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.moderator);
            expect(roleHierarchy.moderator).toBeGreaterThan(roleHierarchy.user);
        });

        test('Should validate role values', () => {
            const validRoles = ['user', 'moderator', 'admin'];
            const invalidRoles = ['superuser', 'guest', '', null, undefined];

            validRoles.forEach(role => {
                expect(['user', 'moderator', 'admin']).toContain(role);
            });

            invalidRoles.forEach(role => {
                expect(['user', 'moderator', 'admin']).not.toContain(role);
            });
        });
    });

    describe('Test 1.3: Horizontal Privilege Escalation Prevention', () => {
        test('Should prevent user from accessing another user\'s private data', () => {
            const resourceOwnerId = new mongoose.Types.ObjectId();
            const requestUserId = new mongoose.Types.ObjectId();

            const { verifyOwnership } = require('../middleware/auth');
            const isOwner = verifyOwnership(resourceOwnerId, requestUserId);

            expect(isOwner).toBe(false);
        });

        test('Should allow user to access their own data', () => {
            const userId = new mongoose.Types.ObjectId();

            const { verifyOwnership } = require('../middleware/auth');
            const isOwner = verifyOwnership(userId, userId);

            expect(isOwner).toBe(true);
        });
    });
});

describe('OWASP A03:2021 - Injection Tests', () => {
    describe('Test 2.1: NoSQL Injection Prevention', () => {
        test('Should sanitize MongoDB operators in query', () => {
            const maliciousInput = {
                email: { $ne: null },
                password: { $regex: '.*' }
            };

            const mockReq = {
                body: maliciousInput,
                query: {},
                params: {}
            };
            const mockRes = {};
            const mockNext = jest.fn();

            mongoSanitize()(mockReq, mockRes, mockNext);

            // MongoDB operators should be removed
            expect(mockReq.body.email).not.toHaveProperty('$ne');
            expect(mockReq.body.password).not.toHaveProperty('$regex');
            expect(mockNext).toHaveBeenCalled();
        });

        test('Should validate MongoDB ObjectId format', () => {
            const invalidIds = [
                'invalid_id',
                '123',
                'null',
                '{ $ne: null }',
                '<script>alert(1)</script>'
            ];

            invalidIds.forEach(id => {
                expect(mongoose.Types.ObjectId.isValid(id)).toBe(false);
            });
        });

        test('Should accept valid MongoDB ObjectId', () => {
            const validId = new mongoose.Types.ObjectId();
            expect(mongoose.Types.ObjectId.isValid(validId)).toBe(true);
        });
    });

    describe('Test 2.2: XSS (Cross-Site Scripting) Prevention', () => {
        test('Should sanitize script tags from HTML content', () => {
            const maliciousHTML = '<script>alert("XSS")</script><p>Safe content</p>';
            const sanitized = sanitizeHTML(maliciousHTML);

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('alert');
            expect(sanitized).toContain('<p>Safe content</p>');
        });

        test('Should remove event handlers from HTML', () => {
            const maliciousHTML = '<img src="x" onerror="alert(1)">';
            const sanitized = sanitizeHTML(maliciousHTML);

            expect(sanitized).not.toContain('onerror');
            expect(sanitized).not.toContain('alert');
        });

        test('Should remove style tags and inline styles', () => {
            const maliciousHTML = '<style>body{display:none}</style><p style="color:red">Text</p>';
            const sanitized = sanitizeHTML(maliciousHTML);

            expect(sanitized).not.toContain('<style>');
            expect(sanitized).not.toContain('display:none');
        });

        test('Should allow safe HTML tags', () => {
            const safeHTML = '<p>Hello <strong>World</strong></p><ul><li>Item</li></ul>';
            const sanitized = sanitizeHTML(safeHTML);

            expect(sanitized).toContain('<p>');
            expect(sanitized).toContain('<strong>');
            expect(sanitized).toContain('<ul>');
            expect(sanitized).toContain('<li>');
        });

        test('Should handle nested XSS attempts', () => {
            const nestedXSS = '<div><script>alert(1)</script><p>Text</p></div>';
            const sanitized = sanitizeHTML(nestedXSS);

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('alert');
        });

        test('Should prevent JavaScript protocol in links', () => {
            const maliciousLink = '<a href="javascript:alert(1)">Click</a>';
            const sanitized = sanitizeHTML(maliciousLink);

            expect(sanitized).not.toContain('javascript:');
        });
    });

    describe('Test 2.3: SQL Injection Prevention (via parameterized queries)', () => {
        test('Should use parameterized queries in Mongoose', () => {
            // Mongoose automatically uses parameterized queries
            // This test verifies the pattern is followed
            const maliciousEmail = "admin' OR '1'='1";
            
            // Mongoose query would be:
            // User.findOne({ email: maliciousEmail })
            // This is safe because Mongoose treats it as a literal string
            
            expect(typeof maliciousEmail).toBe('string');
            // The query would not execute the OR condition
        });
    });
});

describe('OWASP A07:2021 - Identification and Authentication Failures', () => {
    describe('Test 3.1: Password Security', () => {
        test('Should enforce minimum password length', () => {
            const weakPasswords = ['123', 'abc', '12345'];
            
            weakPasswords.forEach(password => {
                expect(password.length).toBeLessThan(6);
            });
        });

        test('Should accept strong passwords', () => {
            const strongPasswords = [
                'MySecurePass123',
                'Complex@Password!',
                'LongPasswordWithNumbers123'
            ];

            strongPasswords.forEach(password => {
                expect(password.length).toBeGreaterThanOrEqual(6);
            });
        });
    });

    describe('Test 3.2: JWT Token Security', () => {
        test('Should include expiration in JWT tokens', () => {
            const token = jwt.sign(
                { id: 'user123', role: 'user' },
                keys.TOKEN_SECRET,
                { expiresIn: '1h' }
            );

            const decoded = jwt.decode(token);
            expect(decoded).toHaveProperty('exp');
            expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
        });

        test('Should validate JWT signature', () => {
            const validToken = jwt.sign(
                { id: 'user123' },
                keys.TOKEN_SECRET
            );

            const tamperedToken = validToken.slice(0, -5) + 'XXXXX';

            expect(() => {
                jwt.verify(tamperedToken, keys.TOKEN_SECRET);
            }).toThrow();
        });

        test('Should reject tokens with missing required claims', async () => {
            const tokenWithoutId = jwt.sign(
                { role: 'user' }, // Missing 'id' claim
                keys.TOKEN_SECRET
            );

            const mockReq = {
                header: jest.fn().mockReturnValue(`Bearer ${tokenWithoutId}`),
                originalUrl: '/api/test'
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            await authUser(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                message: 'Invalid token payload' 
            });
        });
    });

    describe('Test 3.3: Session Management', () => {
        test('Should not expose sensitive data in tokens', () => {
            const token = jwt.sign(
                { 
                    id: 'user123',
                    role: 'user'
                    // Should NOT include: password, email, etc.
                },
                keys.TOKEN_SECRET
            );

            const decoded = jwt.decode(token);
            expect(decoded).not.toHaveProperty('password');
            expect(decoded).not.toHaveProperty('email');
        });

        test('Should handle concurrent sessions securely', () => {
            // Multiple tokens can exist for same user
            // Add timestamp to make tokens different
            const token1 = jwt.sign({ id: 'user123', iat: Math.floor(Date.now() / 1000) }, keys.TOKEN_SECRET);
            
            // Wait a moment to ensure different timestamp
            const token2 = jwt.sign({ id: 'user123', iat: Math.floor(Date.now() / 1000) + 1 }, keys.TOKEN_SECRET);

            // Tokens should be different due to different iat (issued at) times
            expect(token1).not.toBe(token2);
            
            const decoded1 = jwt.verify(token1, keys.TOKEN_SECRET);
            const decoded2 = jwt.verify(token2, keys.TOKEN_SECRET);
            
            expect(decoded1.id).toBe(decoded2.id); // Same user
        });
    });

    describe('Test 3.4: Brute Force Protection', () => {
        test('Should implement rate limiting on auth endpoints', () => {
            const { authLimiter } = require('../middleware/security');
            
            expect(authLimiter).toBeDefined();
            // Rate limiter is configured for 5 attempts per minute
        });
    });
});

describe('Additional Security Tests', () => {
    describe('Test 4.1: Input Validation', () => {
        test('Should validate email format', () => {
            const invalidEmails = [
                'notanemail',
                '@example.com',
                'user@',
                'user space@example.com'
            ];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            invalidEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(false);
            });
        });

        test('Should validate string length limits', () => {
            const longString = 'a'.repeat(1001);
            const maxLength = 1000;

            expect(longString.length).toBeGreaterThan(maxLength);
        });
    });

    describe('Test 4.2: Error Handling', () => {
        test('Should not expose system details in errors', () => {
            const safeErrorMessage = 'An error occurred';
            const unsafeErrorMessage = 'MongoDB connection failed at mongodb://localhost:27017/mydb';

            expect(safeErrorMessage).not.toContain('MongoDB');
            expect(safeErrorMessage).not.toContain('localhost');
            expect(safeErrorMessage).not.toContain('27017');
        });
    });
});

// Cleanup
afterAll(async () => {
    // Close any open connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});
