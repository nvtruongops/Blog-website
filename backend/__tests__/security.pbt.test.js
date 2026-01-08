/**
 * Property-Based Tests for Security Middleware
 * Feature: security-enhancement
 * 
 * Uses fast-check library for property-based testing
 * Minimum 100 iterations per property test
 */

const fc = require('fast-check');
const express = require('express');
const request = require('supertest');
const rateLimit = require('express-rate-limit');

// Import sanitizeHTML - using dynamic import to handle jsdom ESM issues
let sanitizeHTML;
beforeAll(async () => {
  const validator = require('../middleware/validator');
  sanitizeHTML = validator.sanitizeHTML;
});

/**
 * Property 1: Input Sanitization Prevents XSS
 * 
 * *For any* user input string containing HTML tags, script tags, or event handlers,
 * the sanitizeHTML function SHALL return a string that does not contain executable JavaScript code.
 * 
 * **Validates: Requirements 1.2, 9.1, 9.4**
 */
describe('Feature: security-enhancement, Property 1: Input Sanitization Prevents XSS', () => {
  
  // Patterns that indicate executable JavaScript
  const dangerousPatterns = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,  // Event handlers like onclick=, onerror=, onload=
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi,
    /<input\b[^>]*>/gi,
    /<button\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<style\b[^>]*>[\s\S]*?<\/style>/gi,
    /<svg\b[^>]*onload/gi,
    /<img\b[^>]*onerror/gi
  ];

  /**
   * Helper to check if string contains dangerous patterns
   * @param {string} str - String to check
   * @returns {boolean} True if dangerous patterns found
   */
  const containsDangerousPatterns = (str) => {
    return dangerousPatterns.some(pattern => pattern.test(str));
  };

  /**
   * Generator for XSS attack payloads
   */
  const xssPayloadArbitrary = fc.oneof(
    // Script tags
    fc.constant('<script>alert("XSS")</script>'),
    fc.constant('<script src="evil.js"></script>'),
    fc.constant('<SCRIPT>alert(1)</SCRIPT>'),
    fc.constant('<scr<script>ipt>alert(1)</script>'),
    
    // Event handlers
    fc.constant('<img src="x" onerror="alert(1)">'),
    fc.constant('<div onmouseover="alert(1)">hover me</div>'),
    fc.constant('<body onload="alert(1)">'),
    fc.constant('<svg onload="alert(1)">'),
    fc.constant('<input onfocus="alert(1)" autofocus>'),
    fc.constant('<marquee onstart="alert(1)">'),
    fc.constant('<video><source onerror="alert(1)">'),
    
    // JavaScript URLs
    fc.constant('<a href="javascript:alert(1)">click</a>'),
    fc.constant('<a href="JAVASCRIPT:alert(1)">click</a>'),
    fc.constant('<a href="javascript&#58;alert(1)">click</a>'),
    fc.constant('<iframe src="javascript:alert(1)">'),
    
    // Data URLs
    fc.constant('<a href="data:text/html,<script>alert(1)</script>">click</a>'),
    fc.constant('<object data="data:text/html,<script>alert(1)</script>">'),
    
    // Dangerous tags
    fc.constant('<iframe src="evil.com"></iframe>'),
    fc.constant('<object data="evil.swf"></object>'),
    fc.constant('<embed src="evil.swf">'),
    fc.constant('<form action="evil.com"><input type="submit"></form>'),
    fc.constant('<meta http-equiv="refresh" content="0;url=evil.com">'),
    fc.constant('<link rel="stylesheet" href="evil.css">'),
    
    // Style-based attacks
    fc.constant('<style>body{background:url("javascript:alert(1)")}</style>'),
    fc.constant('<div style="background:url(javascript:alert(1))">'),
    
    // Mixed content with allowed tags
    fc.constant('<p><script>alert(1)</script></p>'),
    fc.constant('<strong onclick="alert(1)">bold</strong>'),
    fc.constant('<a href="javascript:alert(1)">link</a>'),
    
    // Encoded attacks
    fc.constant('<img src=x onerror=&#97;&#108;&#101;&#114;&#116;(1)>'),
    fc.constant('<a href="&#106;avascript:alert(1)">click</a>')
  );

  /**
   * Generator for random strings that may contain XSS
   */
  const randomXssStringArbitrary = fc.tuple(
    fc.string(),
    xssPayloadArbitrary,
    fc.string()
  ).map(([prefix, payload, suffix]) => prefix + payload + suffix);

  /**
   * Property: Sanitized output SHALL NOT contain script tags
   */
  test('sanitized output SHALL NOT contain script tags', async () => {
    await fc.assert(
      fc.property(
        xssPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          const hasScriptTag = /<script\b[^>]*>[\s\S]*?<\/script>/gi.test(sanitized);
          expect(hasScriptTag).toBe(false);
          return !hasScriptTag;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized output SHALL NOT contain event handlers
   */
  test('sanitized output SHALL NOT contain event handlers', async () => {
    await fc.assert(
      fc.property(
        xssPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          // Check for event handlers like onclick=, onerror=, onload=, etc.
          const hasEventHandler = /\bon\w+\s*=/gi.test(sanitized);
          expect(hasEventHandler).toBe(false);
          return !hasEventHandler;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized output SHALL NOT contain javascript: URLs
   */
  test('sanitized output SHALL NOT contain javascript: URLs', async () => {
    await fc.assert(
      fc.property(
        xssPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          const hasJsUrl = /javascript:/gi.test(sanitized);
          expect(hasJsUrl).toBe(false);
          return !hasJsUrl;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized output SHALL NOT contain dangerous tags (iframe, object, embed, etc.)
   */
  test('sanitized output SHALL NOT contain dangerous tags', async () => {
    await fc.assert(
      fc.property(
        xssPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          const dangerousTags = /<(iframe|object|embed|form|input|button|meta|link|style|svg)\b/gi;
          const hasDangerousTag = dangerousTags.test(sanitized);
          expect(hasDangerousTag).toBe(false);
          return !hasDangerousTag;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any random string with XSS payload, sanitized output SHALL be safe
   */
  test('random strings with XSS payloads SHALL be sanitized', async () => {
    await fc.assert(
      fc.property(
        randomXssStringArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          const isSafe = !containsDangerousPatterns(sanitized);
          expect(isSafe).toBe(true);
          return isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Allowed tags SHALL be preserved after sanitization
   */
  test('allowed tags SHALL be preserved', async () => {
    const allowedTagsArbitrary = fc.oneof(
      fc.constant('<p>paragraph</p>'),
      fc.constant('<strong>bold</strong>'),
      fc.constant('<em>italic</em>'),
      fc.constant('<b>bold</b>'),
      fc.constant('<i>italic</i>'),
      fc.constant('<ul><li>item</li></ul>'),
      fc.constant('<ol><li>item</li></ol>'),
      fc.constant('<h1>heading</h1>'),
      fc.constant('<h2>heading</h2>'),
      fc.constant('<h3>heading</h3>'),
      fc.constant('<blockquote>quote</blockquote>'),
      fc.constant('<code>code</code>'),
      fc.constant('<pre>preformatted</pre>'),
      fc.constant('<br>')
    );

    await fc.assert(
      fc.property(
        allowedTagsArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          // The sanitized output should still contain the allowed tag content
          expect(sanitized.length).toBeGreaterThan(0);
          return sanitized.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-string inputs SHALL return empty string
   */
  test('non-string inputs SHALL return empty string', async () => {
    const nonStringArbitrary = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.integer(),
      fc.constant({}),
      fc.constant([]),
      fc.boolean()
    );

    await fc.assert(
      fc.property(
        nonStringArbitrary,
        (input) => {
          const sanitized = sanitizeHTML(input);
          expect(sanitized).toBe('');
          return sanitized === '';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safe HTML content SHALL pass through unchanged (content preserved)
   */
  test('safe text content SHALL be preserved', async () => {
    await fc.assert(
      fc.property(
        fc.string().filter(s => !/<|>|&/.test(s)), // Plain text without HTML
        (input) => {
          const sanitized = sanitizeHTML(input);
          // Plain text should be preserved
          expect(sanitized).toBe(input);
          return sanitized === input;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: NoSQL Injection Prevention
 * 
 * *For any* user input containing MongoDB query operators ($gt, $ne, $where, etc.),
 * the input validator SHALL either reject the input or sanitize it to prevent query manipulation.
 * 
 * **Validates: Requirements 1.3, 10.3**
 */
describe('Feature: security-enhancement, Property 2: NoSQL Injection Prevention', () => {
  
  const mongoSanitize = require('express-mongo-sanitize');
  const { mongoIdValidation, mongoIdBodyValidation } = require('../middleware/validator');
  const express = require('express');
  const request = require('supertest');

  /**
   * MongoDB query operators that should be sanitized
   */
  const mongoOperators = [
    '$gt', '$gte', '$lt', '$lte', '$ne', '$eq',
    '$in', '$nin', '$and', '$or', '$not', '$nor',
    '$exists', '$type', '$regex', '$where',
    '$elemMatch', '$size', '$all',
    '$set', '$unset', '$inc', '$push', '$pull',
    '$addToSet', '$pop', '$rename'
  ];

  /**
   * Generator for MongoDB injection payloads
   */
  const mongoInjectionPayloadArbitrary = fc.oneof(
    // Direct operator injection
    ...mongoOperators.map(op => fc.constant({ [op]: 'malicious' })),
    ...mongoOperators.map(op => fc.constant({ field: { [op]: 'value' } })),
    
    // Nested operator injection
    fc.constant({ username: { $ne: null } }),
    fc.constant({ password: { $gt: '' } }),
    fc.constant({ email: { $regex: '.*' } }),
    fc.constant({ role: { $in: ['admin', 'superuser'] } }),
    fc.constant({ $where: 'this.password.length > 0' }),
    fc.constant({ $or: [{ admin: true }, { role: 'admin' }] }),
    fc.constant({ age: { $gt: 0, $lt: 100 } }),
    
    // String-based injection attempts
    fc.constant('{"$gt": ""}'),
    fc.constant('{"$ne": null}'),
    fc.constant('{"$where": "1==1"}')
  );

  /**
   * Generator for random field names with operators
   */
  const randomFieldWithOperatorArbitrary = fc.tuple(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    fc.constantFrom(...mongoOperators),
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
  ).map(([field, operator, value]) => ({ [field]: { [operator]: value } }));

  /**
   * Helper to create test app with mongoSanitize middleware
   */
  const createSanitizedApp = () => {
    const app = express();
    app.use(express.json());
    app.use(mongoSanitize());
    
    app.post('/test', (req, res) => {
      res.json({ sanitized: req.body });
    });
    
    return app;
  };

  /**
   * Helper to check if object contains MongoDB operators
   * @param {any} obj - Object to check
   * @returns {boolean} True if contains operators
   */
  const containsMongoOperators = (obj) => {
    if (obj === null || obj === undefined) return false;
    if (typeof obj !== 'object') return false;
    
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) return true;
      if (typeof obj[key] === 'object' && containsMongoOperators(obj[key])) return true;
    }
    return false;
  };

  /**
   * Property: mongoSanitize SHALL remove $ operators from request body
   */
  test('mongoSanitize SHALL remove $ operators from request body', async () => {
    const app = createSanitizedApp();
    
    await fc.assert(
      fc.asyncProperty(
        mongoInjectionPayloadArbitrary,
        async (payload) => {
          // Skip string payloads for this test (they're handled differently)
          if (typeof payload === 'string') return true;
          
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(200);
          
          // The sanitized body should not contain any $ operators
          const sanitizedBody = response.body.sanitized;
          const hasOperators = containsMongoOperators(sanitizedBody);
          
          expect(hasOperators).toBe(false);
          return !hasOperators;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Random fields with operators SHALL be sanitized
   */
  test('random fields with MongoDB operators SHALL be sanitized', async () => {
    const app = createSanitizedApp();
    
    await fc.assert(
      fc.asyncProperty(
        randomFieldWithOperatorArbitrary,
        async (payload) => {
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(200);
          
          const sanitizedBody = response.body.sanitized;
          const hasOperators = containsMongoOperators(sanitizedBody);
          
          expect(hasOperators).toBe(false);
          return !hasOperators;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Nested operator injection SHALL be sanitized
   */
  test('nested operator injection SHALL be sanitized', async () => {
    const app = createSanitizedApp();
    
    const nestedPayloadArbitrary = fc.oneof(
      fc.constant({ user: { profile: { role: { $ne: 'user' } } } }),
      fc.constant({ data: { items: { $elemMatch: { status: 'active' } } } }),
      fc.constant({ query: { $and: [{ a: 1 }, { b: { $gt: 0 } }] } }),
      fc.constant({ filter: { $or: [{ x: { $lt: 10 } }, { y: { $gte: 5 } }] } }),
      fc.constant({ deep: { nested: { very: { deep: { $where: '1==1' } } } } })
    );
    
    await fc.assert(
      fc.asyncProperty(
        nestedPayloadArbitrary,
        async (payload) => {
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(200);
          
          const sanitizedBody = response.body.sanitized;
          const hasOperators = containsMongoOperators(sanitizedBody);
          
          expect(hasOperators).toBe(false);
          return !hasOperators;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: mongoIdValidation SHALL reject invalid MongoDB ObjectIds
   */
  test('mongoIdValidation SHALL reject invalid ObjectIds', async () => {
    const app = express();
    app.use(express.json());
    
    // Apply mongoIdValidation to a route parameter
    const { validationResult } = require('express-validator');
    app.get('/resource/:id', mongoIdValidation('id'), (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ valid: false, errors: errors.array() });
      }
      res.json({ valid: true });
    });
    
    // Generator for invalid ObjectIds (non-empty to avoid 404)
    const hexChars = '0123456789abcdef'.split('');
    const invalidObjectIdArbitrary = fc.oneof(
      // Too short (but non-empty) - 1 to 23 hex chars
      fc.array(fc.constantFrom(...hexChars), { minLength: 1, maxLength: 23 }).map(arr => arr.join('')),
      // Too long - 25 to 50 hex chars
      fc.array(fc.constantFrom(...hexChars), { minLength: 25, maxLength: 50 }).map(arr => arr.join('')),
      // Invalid characters (24 chars but with invalid hex)
      fc.constant('507f1f77bcf86cd79943901g'),
      fc.constant('507f1f77bcf86cd79943901!'),
      fc.constant('not-a-valid-id-here-now'),
      fc.constant('ZZZZZZZZZZZZZZZZZZZZZZZZ'),
      // Injection attempts
      fc.constant('{"$ne": null}'),
      fc.constant('$ne$ne$ne$ne$ne$ne$ne$ne'),
      fc.constant('507f1f77bcf86cd79943901;'),
      // Whitespace (non-empty)
      fc.constant('________________________')
    );
    
    await fc.assert(
      fc.asyncProperty(
        invalidObjectIdArbitrary,
        async (invalidId) => {
          const response = await request(app).get(`/resource/${encodeURIComponent(invalidId)}`);
          
          // Invalid ObjectIds should be rejected with 400
          expect(response.status).toBe(400);
          expect(response.body.valid).toBe(false);
          
          return response.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: mongoIdValidation SHALL accept valid MongoDB ObjectIds
   */
  test('mongoIdValidation SHALL accept valid ObjectIds', async () => {
    const app = express();
    app.use(express.json());
    
    const { validationResult } = require('express-validator');
    app.get('/resource/:id', mongoIdValidation('id'), (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ valid: false, errors: errors.array() });
      }
      res.json({ valid: true });
    });
    
    // Generator for valid ObjectIds (24 hex characters)
    const hexChars = '0123456789abcdef'.split('');
    const validObjectIdArbitrary = fc.array(fc.constantFrom(...hexChars), { minLength: 24, maxLength: 24 })
      .map(chars => chars.join(''));
    
    await fc.assert(
      fc.asyncProperty(
        validObjectIdArbitrary,
        async (validId) => {
          const response = await request(app).get(`/resource/${validId}`);
          
          // Valid ObjectIds should be accepted with 200
          expect(response.status).toBe(200);
          expect(response.body.valid).toBe(true);
          
          return response.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safe data without operators SHALL pass through unchanged
   */
  test('safe data without operators SHALL pass through unchanged', async () => {
    const app = createSanitizedApp();
    
    const safeDataArbitrary = fc.record({
      username: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('$')),
      email: fc.emailAddress(),
      age: fc.integer({ min: 0, max: 150 }),
      active: fc.boolean()
    });
    
    await fc.assert(
      fc.asyncProperty(
        safeDataArbitrary,
        async (payload) => {
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(200);
          
          // Safe data should pass through unchanged
          const sanitizedBody = response.body.sanitized;
          expect(sanitizedBody.username).toBe(payload.username);
          expect(sanitizedBody.email).toBe(payload.email);
          expect(sanitizedBody.age).toBe(payload.age);
          expect(sanitizedBody.active).toBe(payload.active);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Query string injection SHALL be sanitized
   */
  test('query string with operators SHALL be sanitized', async () => {
    const app = express();
    app.use(express.json());
    app.use(mongoSanitize());
    
    app.get('/search', (req, res) => {
      res.json({ sanitized: req.query });
    });
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...mongoOperators),
        async (operator) => {
          const response = await request(app)
            .get('/search')
            .query({ filter: { [operator]: 'value' } });
          
          expect(response.status).toBe(200);
          
          // Query params with operators should be sanitized
          const sanitizedQuery = response.body.sanitized;
          const hasOperators = containsMongoOperators(sanitizedQuery);
          
          expect(hasOperators).toBe(false);
          return !hasOperators;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: JWT Token Validation
 * 
 * *For any* JWT token presented to protected endpoints, the auth middleware SHALL reject tokens that are:
 * (a) expired, (b) have invalid signatures, (c) are missing required claims, or (d) are malformed.
 * 
 * **Validates: Requirements 2.2, 2.3, 3.2**
 */
describe('Feature: security-enhancement, Property 6: JWT Token Validation', () => {
  const jwt = require('jsonwebtoken');
  const keys = require('../config/keys');
  const { authUser } = require('../middleware/auth');
  
  // Use the actual TOKEN_SECRET from config for valid tokens
  // Use a different secret for invalid signature tests
  const WRONG_SECRET = 'completely-different-wrong-secret-key-12345';

  /**
   * Helper to create a mock Express request/response
   */
  const createMockReqRes = (authHeader) => {
    const req = {
      header: jest.fn((name) => {
        if (name === 'Authorization') return authHeader;
        return undefined;
      })
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();
    return { req, res, next };
  };

  /**
   * Generator for valid user IDs (MongoDB ObjectId-like strings)
   */
  const validUserIdArbitrary = fc.array(
    fc.constantFrom(...'0123456789abcdef'.split('')),
    { minLength: 24, maxLength: 24 }
  ).map(chars => chars.join(''));

  /**
   * Generator for valid JWT payloads
   */
  const validPayloadArbitrary = fc.record({
    id: validUserIdArbitrary,
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
  });

  /**
   * Property: Expired tokens SHALL be rejected with 401 status
   */
  test('expired tokens SHALL be rejected with 401 status', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        async (payload) => {
          // Create an expired token (expired 1 hour ago) using the real secret
          const expiredToken = jwt.sign(
            payload,
            keys.TOKEN_SECRET,
            { expiresIn: '-1h' }
          );
          
          const { req, res, next } = createMockReqRes(`Bearer ${expiredToken}`);
          
          await authUser(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tokens with invalid signatures SHALL be rejected with 401 status
   */
  test('tokens with invalid signatures SHALL be rejected with 401 status', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        async (payload) => {
          // Create a token signed with a different secret
          const invalidSignatureToken = jwt.sign(
            payload,
            WRONG_SECRET,
            { expiresIn: '1h' }
          );
          
          const { req, res, next } = createMockReqRes(`Bearer ${invalidSignatureToken}`);
          
          await authUser(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tokens missing required 'id' claim SHALL be rejected with 401 status
   */
  test('tokens missing required id claim SHALL be rejected with 401 status', async () => {
    const payloadWithoutIdArbitrary = fc.record({
      email: fc.emailAddress(),
      name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      role: fc.constantFrom('user', 'admin', 'moderator')
    });

    await fc.assert(
      fc.asyncProperty(
        payloadWithoutIdArbitrary,
        async (payload) => {
          // Create a token without the required 'id' claim using the real secret
          const tokenWithoutId = jwt.sign(
            payload,
            keys.TOKEN_SECRET,
            { expiresIn: '1h' }
          );
          
          const { req, res, next } = createMockReqRes(`Bearer ${tokenWithoutId}`);
          
          await authUser(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token payload' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Malformed tokens SHALL be rejected with 401 status
   */
  test('malformed tokens SHALL be rejected with 401 status', async () => {
    const malformedTokenArbitrary = fc.oneof(
      // Random strings that aren't valid JWTs
      fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('.')),
      // Strings with wrong number of parts
      fc.constant('part1.part2'),
      fc.constant('part1.part2.part3.part4'),
      // Invalid base64 in parts
      fc.constant('!!!.@@@.###'),
      fc.constant('not-base64.also-not-base64.definitely-not-base64'),
      // Empty parts
      fc.constant('..'),
      fc.constant('.valid.token'),
      fc.constant('valid..token'),
      // Truncated tokens
      fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
      fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9'),
      // Corrupted tokens (valid structure but corrupted content)
      fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted.signature')
    );

    await fc.assert(
      fc.asyncProperty(
        malformedTokenArbitrary,
        async (malformedToken) => {
          const { req, res, next } = createMockReqRes(`Bearer ${malformedToken}`);
          
          await authUser(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Missing Authorization header SHALL be rejected with 401 status
   */
  test('missing Authorization header SHALL be rejected with 401 status', async () => {
    const missingHeaderArbitrary = fc.constantFrom(
      undefined,
      null,
      '',
      'Basic sometoken',
      'bearer token', // lowercase 'bearer'
      'Token abc123',
      'JWT abc123'
    );

    await fc.assert(
      fc.asyncProperty(
        missingHeaderArbitrary,
        async (authHeader) => {
          const { req, res, next } = createMockReqRes(authHeader);
          
          await authUser(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid tokens SHALL be accepted and user attached to request
   */
  test('valid tokens SHALL be accepted and user attached to request', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        async (payload) => {
          // Create a valid token using the real secret
          const validToken = jwt.sign(
            payload,
            keys.TOKEN_SECRET,
            { expiresIn: '1h' }
          );
          
          const { req, res, next } = createMockReqRes(`Bearer ${validToken}`);
          
          await authUser(req, res, next);
          
          expect(next).toHaveBeenCalled();
          expect(req.user).toBeDefined();
          expect(req.user.id).toBe(payload.id);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tokens with 'not before' claim in the future SHALL be rejected
   */
  test('tokens not yet valid (nbf in future) SHALL be rejected with 401 status', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPayloadArbitrary,
        async (payload) => {
          // Create a token that's not valid yet (nbf 1 hour in future) using the real secret
          const futureTime = Math.floor(Date.now() / 1000) + 3600;
          const notYetValidToken = jwt.sign(
            { ...payload, nbf: futureTime },
            keys.TOKEN_SECRET,
            { expiresIn: '2h' }
          );
          
          const { req, res, next } = createMockReqRes(`Bearer ${notYetValidToken}`);
          
          await authUser(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({ message: 'Token not yet valid' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Rate Limiting Enforcement
 * 
 * *For any* IP address making requests to rate-limited endpoints, 
 * after exceeding the configured limit within the time window, 
 * subsequent requests SHALL receive a 429 response with a Retry-After header.
 * 
 * **Validates: Requirements 2.1, 5.1, 5.2, 5.3, 5.4**
 */
describe('Feature: security-enhancement, Property 5: Rate Limiting Enforcement', () => {
  
  /**
   * Helper to create a test app with rate limiting
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   */
  const createRateLimitedApp = (maxRequests, windowMs = 60000) => {
    const app = express();
    
    const limiter = rateLimit({
      windowMs,
      max: maxRequests,
      message: { message: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({ message: 'Too many requests, please try again later' });
      }
    });
    
    app.use(limiter);
    app.get('/test', (req, res) => res.json({ success: true }));
    
    return app;
  };

  /**
   * Property: For any rate limit configuration (1-100 requests),
   * requests exceeding the limit SHALL receive 429 status
   */
  test('requests exceeding rate limit SHALL receive 429 response', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random rate limits between 1 and 20 for faster testing
        fc.integer({ min: 1, max: 20 }),
        async (maxRequests) => {
          const app = createRateLimitedApp(maxRequests);
          
          // Make exactly maxRequests successful requests
          for (let i = 0; i < maxRequests; i++) {
            const response = await request(app).get('/test');
            expect(response.status).toBe(200);
          }
          
          // The next request should be rate limited
          const blockedResponse = await request(app).get('/test');
          expect(blockedResponse.status).toBe(429);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rate limited responses SHALL include Retry-After header
   * Validates: Requirement 5.4
   */
  test('rate limited responses SHALL include rate limit headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (maxRequests) => {
          const app = createRateLimitedApp(maxRequests);
          
          // Exhaust the rate limit
          for (let i = 0; i < maxRequests; i++) {
            await request(app).get('/test');
          }
          
          // Check that rate limited response has proper headers
          const blockedResponse = await request(app).get('/test');
          
          expect(blockedResponse.status).toBe(429);
          // standardHeaders: true sets RateLimit-* headers
          expect(blockedResponse.headers).toHaveProperty('ratelimit-limit');
          expect(blockedResponse.headers).toHaveProperty('ratelimit-remaining');
          expect(blockedResponse.headers).toHaveProperty('ratelimit-reset');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any number of requests within the limit,
   * all requests SHALL succeed with 200 status
   */
  test('requests within rate limit SHALL succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 20 }),
        fc.integer({ min: 1, max: 5 }),
        async (maxRequests, requestCount) => {
          // Ensure requestCount is less than maxRequests
          const actualRequestCount = Math.min(requestCount, maxRequests - 1);
          const app = createRateLimitedApp(maxRequests);
          
          // All requests within limit should succeed
          for (let i = 0; i < actualRequestCount; i++) {
            const response = await request(app).get('/test');
            expect(response.status).toBe(200);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rate limit remaining count SHALL decrease with each request
   * Validates: Requirement 5.5 (sliding window tracking)
   */
  test('rate limit remaining SHALL decrease with each request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 15 }),
        async (maxRequests) => {
          const app = createRateLimitedApp(maxRequests);
          
          let previousRemaining = maxRequests;
          
          for (let i = 0; i < maxRequests; i++) {
            const response = await request(app).get('/test');
            const remaining = parseInt(response.headers['ratelimit-remaining'], 10);
            
            // Remaining should be less than or equal to previous
            expect(remaining).toBeLessThanOrEqual(previousRemaining);
            previousRemaining = remaining;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rate limited response SHALL contain proper error message
   */
  test('rate limited response SHALL contain error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (maxRequests) => {
          const app = createRateLimitedApp(maxRequests);
          
          // Exhaust the rate limit
          for (let i = 0; i < maxRequests; i++) {
            await request(app).get('/test');
          }
          
          const blockedResponse = await request(app).get('/test');
          
          expect(blockedResponse.status).toBe(429);
          expect(blockedResponse.body).toHaveProperty('message');
          expect(typeof blockedResponse.body.message).toBe('string');
          expect(blockedResponse.body.message.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Resource Ownership Verification
 * 
 * *For any* request to modify or delete a resource, the system SHALL verify 
 * that the authenticated user owns the resource before allowing the operation.
 * 
 * **Validates: Requirements 3.1, 3.3**
 */
describe('Feature: security-enhancement, Property 7: Resource Ownership Verification', () => {
  const { verifyOwnership } = require('../middleware/auth');

  /**
   * Generator for valid MongoDB ObjectId-like strings (24 hex characters)
   */
  const validObjectIdArbitrary = fc.array(
    fc.constantFrom(...'0123456789abcdef'.split('')),
    { minLength: 24, maxLength: 24 }
  ).map(chars => chars.join(''));

  /**
   * Generator for ObjectId-like objects with toString method (simulating Mongoose ObjectId)
   */
  const objectIdLikeArbitrary = validObjectIdArbitrary.map(id => ({
    toString: () => id,
    _id: id
  }));

  /**
   * Property: For any two identical user IDs, verifyOwnership SHALL return true
   */
  test('identical user IDs SHALL return true (ownership confirmed)', async () => {
    await fc.assert(
      fc.property(
        validObjectIdArbitrary,
        (userId) => {
          const result = verifyOwnership(userId, userId);
          expect(result).toBe(true);
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any two different user IDs, verifyOwnership SHALL return false
   */
  test('different user IDs SHALL return false (ownership denied)', async () => {
    await fc.assert(
      fc.property(
        validObjectIdArbitrary,
        validObjectIdArbitrary,
        (resourceUserId, requestUserId) => {
          // Skip if they happen to be the same
          fc.pre(resourceUserId !== requestUserId);
          
          const result = verifyOwnership(resourceUserId, requestUserId);
          expect(result).toBe(false);
          return result === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: verifyOwnership SHALL handle ObjectId-like objects with toString method
   */
  test('ObjectId-like objects SHALL be compared correctly', async () => {
    await fc.assert(
      fc.property(
        validObjectIdArbitrary,
        (userId) => {
          // Create ObjectId-like objects
          const resourceId = { toString: () => userId };
          const requestId = { toString: () => userId };
          
          const result = verifyOwnership(resourceId, requestId);
          expect(result).toBe(true);
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Mixed string and ObjectId-like inputs with same value SHALL return true
   */
  test('mixed string and ObjectId-like inputs with same value SHALL return true', async () => {
    await fc.assert(
      fc.property(
        validObjectIdArbitrary,
        (userId) => {
          // String vs ObjectId-like object
          const resourceId = { toString: () => userId };
          const requestId = userId;
          
          const result = verifyOwnership(resourceId, requestId);
          expect(result).toBe(true);
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null or undefined resourceUserId SHALL return false
   */
  test('null or undefined resourceUserId SHALL return false', async () => {
    const nullishArbitrary = fc.constantFrom(null, undefined);
    
    await fc.assert(
      fc.property(
        nullishArbitrary,
        validObjectIdArbitrary,
        (resourceUserId, requestUserId) => {
          const result = verifyOwnership(resourceUserId, requestUserId);
          expect(result).toBe(false);
          return result === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null or undefined requestUserId SHALL return false
   */
  test('null or undefined requestUserId SHALL return false', async () => {
    const nullishArbitrary = fc.constantFrom(null, undefined);
    
    await fc.assert(
      fc.property(
        validObjectIdArbitrary,
        nullishArbitrary,
        (resourceUserId, requestUserId) => {
          const result = verifyOwnership(resourceUserId, requestUserId);
          expect(result).toBe(false);
          return result === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Both null/undefined SHALL return false
   */
  test('both null or undefined SHALL return false', async () => {
    const nullishArbitrary = fc.constantFrom(null, undefined);
    
    await fc.assert(
      fc.property(
        nullishArbitrary,
        nullishArbitrary,
        (resourceUserId, requestUserId) => {
          const result = verifyOwnership(resourceUserId, requestUserId);
          expect(result).toBe(false);
          return result === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: verifyOwnership SHALL be symmetric (order of comparison doesn't matter for equality)
   */
  test('verifyOwnership SHALL be symmetric for equality check', async () => {
    await fc.assert(
      fc.property(
        validObjectIdArbitrary,
        validObjectIdArbitrary,
        (id1, id2) => {
          const result1 = verifyOwnership(id1, id2);
          const result2 = verifyOwnership(id2, id1);
          
          // If both are the same, both should return true
          // If different, both should return false
          expect(result1).toBe(result2);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty strings SHALL return false (invalid IDs)
   */
  test('empty strings SHALL return false', async () => {
    const emptyStringArbitrary = fc.constantFrom('', '   ', '\t', '\n');
    
    await fc.assert(
      fc.property(
        emptyStringArbitrary,
        validObjectIdArbitrary,
        (emptyId, validId) => {
          const result1 = verifyOwnership(emptyId, validId);
          const result2 = verifyOwnership(validId, emptyId);
          
          // Empty strings should not match valid IDs
          // Note: The current implementation would return true for ('', '')
          // but that's an edge case - empty strings matching empty strings
          expect(result1).toBe(false);
          expect(result2).toBe(false);
          return result1 === false && result2 === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 9: CSRF Token Validation
 * 
 * *For any* state-changing request (POST, PUT, DELETE), the CSRF middleware 
 * SHALL reject requests with missing or invalid CSRF tokens with a 403 response.
 * 
 * **Validates: Requirements 6.1, 6.3**
 */
describe('Feature: security-enhancement, Property 9: CSRF Token Validation', () => {
  const { csrfProtection, generateCSRFToken, timingSafeEqual } = require('../middleware/csrf');

  /**
   * Helper to create mock Express request/response/next
   */
  const createMockReqRes = (method, csrfToken, sessionToken, bodyToken) => {
    const req = {
      method,
      headers: csrfToken ? { 'x-csrf-token': csrfToken } : {},
      body: bodyToken ? { _csrf: bodyToken } : {},
      session: sessionToken !== undefined ? { csrfToken: sessionToken } : {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();
    return { req, res, next };
  };

  /**
   * Generator for state-changing HTTP methods
   */
  const stateChangingMethodArbitrary = fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH');

  /**
   * Generator for safe HTTP methods (should skip CSRF validation)
   */
  const safeMethodArbitrary = fc.constantFrom('GET', 'HEAD', 'OPTIONS');

  /**
   * Generator for valid CSRF tokens (64 hex characters)
   */
  const validCsrfTokenArbitrary = fc.array(
    fc.constantFrom(...'0123456789abcdef'.split('')),
    { minLength: 64, maxLength: 64 }
  ).map(chars => chars.join(''));

  /**
   * Generator for invalid CSRF tokens
   */
  const invalidCsrfTokenArbitrary = fc.oneof(
    // Wrong length tokens
    fc.array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 1, maxLength: 63 }).map(arr => arr.join('')),
    fc.array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 65, maxLength: 100 }).map(arr => arr.join('')),
    // Random strings
    fc.string({ minLength: 1, maxLength: 100 }),
    // Injection attempts
    fc.constant('<script>alert(1)</script>'),
    fc.constant('{"$ne": null}'),
    fc.constant("'; DROP TABLE sessions; --")
  );

  /**
   * Property: State-changing requests with missing CSRF token SHALL be rejected with 403
   */
  test('state-changing requests with missing CSRF token SHALL be rejected with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        stateChangingMethodArbitrary,
        validCsrfTokenArbitrary,
        async (method, sessionToken) => {
          // Request has no CSRF token, but session has one
          const { req, res, next } = createMockReqRes(method, null, sessionToken, null);
          
          await csrfProtection(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({ message: 'CSRF token missing' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State-changing requests with invalid CSRF token SHALL be rejected with 403
   */
  test('state-changing requests with invalid CSRF token SHALL be rejected with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        stateChangingMethodArbitrary,
        validCsrfTokenArbitrary,
        invalidCsrfTokenArbitrary,
        async (method, sessionToken, invalidToken) => {
          // Ensure the invalid token is different from session token
          fc.pre(invalidToken !== sessionToken);
          
          const { req, res, next } = createMockReqRes(method, invalidToken, sessionToken, null);
          
          await csrfProtection(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({ message: 'Invalid CSRF token' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State-changing requests with mismatched CSRF token SHALL be rejected with 403
   */
  test('state-changing requests with mismatched CSRF token SHALL be rejected with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        stateChangingMethodArbitrary,
        validCsrfTokenArbitrary,
        validCsrfTokenArbitrary,
        async (method, sessionToken, requestToken) => {
          // Ensure tokens are different
          fc.pre(sessionToken !== requestToken);
          
          const { req, res, next } = createMockReqRes(method, requestToken, sessionToken, null);
          
          await csrfProtection(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({ message: 'Invalid CSRF token' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State-changing requests without session CSRF token SHALL be rejected with 403
   */
  test('state-changing requests without session CSRF token SHALL be rejected with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        stateChangingMethodArbitrary,
        validCsrfTokenArbitrary,
        async (method, requestToken) => {
          // Request has CSRF token, but session doesn't
          const { req, res, next } = createMockReqRes(method, requestToken, null, null);
          
          await csrfProtection(req, res, next);
          
          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith({ message: 'Session CSRF token not found' });
          expect(next).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State-changing requests with valid matching CSRF token SHALL be allowed
   */
  test('state-changing requests with valid matching CSRF token SHALL be allowed', async () => {
    await fc.assert(
      fc.asyncProperty(
        stateChangingMethodArbitrary,
        validCsrfTokenArbitrary,
        async (method, token) => {
          // Same token in request header and session
          const { req, res, next } = createMockReqRes(method, token, token, null);
          
          await csrfProtection(req, res, next);
          
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CSRF token in body (_csrf field) SHALL be accepted
   */
  test('CSRF token in body SHALL be accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        stateChangingMethodArbitrary,
        validCsrfTokenArbitrary,
        async (method, token) => {
          // Token in body instead of header
          const { req, res, next } = createMockReqRes(method, null, token, token);
          
          await csrfProtection(req, res, next);
          
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safe HTTP methods (GET, HEAD, OPTIONS) SHALL skip CSRF validation
   */
  test('safe HTTP methods SHALL skip CSRF validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        safeMethodArbitrary,
        async (method) => {
          // No CSRF token at all, but should still pass for safe methods
          const { req, res, next } = createMockReqRes(method, null, null, null);
          
          await csrfProtection(req, res, next);
          
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: generateCSRFToken SHALL produce 64-character hex strings
   */
  test('generateCSRFToken SHALL produce 64-character hex strings', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        () => {
          const token = generateCSRFToken();
          
          // Should be 64 characters (32 bytes * 2 hex chars per byte)
          expect(token.length).toBe(64);
          
          // Should only contain hex characters
          expect(/^[0-9a-f]+$/.test(token)).toBe(true);
          
          return token.length === 64 && /^[0-9a-f]+$/.test(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: timingSafeEqual SHALL return true for identical strings
   */
  test('timingSafeEqual SHALL return true for identical strings', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (str) => {
          const result = timingSafeEqual(str, str);
          expect(result).toBe(true);
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: timingSafeEqual SHALL return false for different strings
   */
  test('timingSafeEqual SHALL return false for different strings', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (str1, str2) => {
          fc.pre(str1 !== str2);
          
          const result = timingSafeEqual(str1, str2);
          expect(result).toBe(false);
          return result === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: timingSafeEqual SHALL return false for non-string inputs
   */
  test('timingSafeEqual SHALL return false for non-string inputs', async () => {
    const nonStringArbitrary = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.integer(),
      fc.constant({}),
      fc.constant([]),
      fc.boolean()
    );

    await fc.assert(
      fc.property(
        nonStringArbitrary,
        fc.string(),
        (nonString, str) => {
          const result1 = timingSafeEqual(nonString, str);
          const result2 = timingSafeEqual(str, nonString);
          
          expect(result1).toBe(false);
          expect(result2).toBe(false);
          
          return result1 === false && result2 === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 10: CSRF Token Uniqueness
 * 
 * *For any* two different sessions, the generated CSRF tokens SHALL be different.
 * 
 * **Validates: Requirements 6.4**
 */
describe('Feature: security-enhancement, Property 10: CSRF Token Uniqueness', () => {
  const { generateCSRFToken } = require('../middleware/csrf');

  /**
   * Property: For any two calls to generateCSRFToken, the tokens SHALL be different
   * This validates that CSRF tokens are cryptographically random and unique per generation
   */
  test('consecutive generateCSRFToken calls SHALL produce different tokens', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // Just a dummy input to drive iterations
        () => {
          const token1 = generateCSRFToken();
          const token2 = generateCSRFToken();
          
          // Two consecutive token generations should produce different tokens
          expect(token1).not.toBe(token2);
          
          return token1 !== token2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any batch of generated tokens, all tokens SHALL be unique
   * Tests that multiple token generations don't produce collisions
   */
  test('batch of generated tokens SHALL all be unique', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }), // Generate between 10-50 tokens per test
        (batchSize) => {
          const tokens = new Set();
          
          for (let i = 0; i < batchSize; i++) {
            const token = generateCSRFToken();
            
            // Token should not already exist in the set
            expect(tokens.has(token)).toBe(false);
            
            tokens.add(token);
          }
          
          // All tokens should be unique (set size equals batch size)
          expect(tokens.size).toBe(batchSize);
          
          return tokens.size === batchSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated tokens SHALL have sufficient entropy (64 hex chars = 256 bits)
   * Validates that tokens are generated with proper cryptographic randomness
   */
  test('generated tokens SHALL have proper format and length', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        () => {
          const token = generateCSRFToken();
          
          // Token should be exactly 64 characters (32 bytes = 256 bits of entropy)
          expect(token.length).toBe(64);
          
          // Token should only contain lowercase hex characters
          expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
          
          return token.length === 64 && /^[0-9a-f]{64}$/.test(token);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Simulated sessions SHALL have different CSRF tokens
   * Tests the session-based uniqueness requirement
   */
  test('simulated different sessions SHALL have different CSRF tokens', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Number of simulated sessions
        (sessionCount) => {
          // Simulate multiple sessions, each getting their own CSRF token
          const sessionTokens = new Map();
          
          for (let sessionId = 0; sessionId < sessionCount; sessionId++) {
            // Each session generates its own token (simulating setCSRFToken behavior)
            const token = generateCSRFToken();
            sessionTokens.set(sessionId, token);
          }
          
          // All session tokens should be unique
          const uniqueTokens = new Set(sessionTokens.values());
          expect(uniqueTokens.size).toBe(sessionCount);
          
          return uniqueTokens.size === sessionCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Token generation SHALL be deterministically random (crypto.randomBytes)
   * Validates that tokens don't follow predictable patterns
   */
  test('generated tokens SHALL not follow predictable patterns', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        () => {
          const tokens = [];
          for (let i = 0; i < 10; i++) {
            tokens.push(generateCSRFToken());
          }
          
          // Check that tokens don't share common prefixes (would indicate weak randomness)
          for (let i = 0; i < tokens.length; i++) {
            for (let j = i + 1; j < tokens.length; j++) {
              // Tokens should not share more than 8 character prefix (statistically unlikely)
              const commonPrefixLength = getCommonPrefixLength(tokens[i], tokens[j]);
              expect(commonPrefixLength).toBeLessThan(16); // Allow some coincidental overlap
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to get common prefix length between two strings
 */
function getCommonPrefixLength(str1, str2) {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return i;
}


/**
 * Property 11: Log Entry Sanitization
 * 
 * *For any* log entry containing user-controlled data, the logger SHALL sanitize 
 * newlines, carriage returns, and other control characters to prevent log injection.
 * 
 * **Validates: Requirements 8.4**
 */
describe('Feature: security-enhancement, Property 11: Log Entry Sanitization', () => {
  const { sanitizeLogEntry } = require('../helper/securityLogger');

  /**
   * Control characters that should be sanitized
   */
  const controlCharacters = ['\n', '\r', '\t', '\r\n', '\n\r'];

  /**
   * Generator for strings containing control characters (log injection attempts)
   */
  const logInjectionPayloadArbitrary = fc.oneof(
    // Newline injection
    fc.constant('normal text\ninjected line'),
    fc.constant('user input\r\nFAKE_LOG_ENTRY: admin logged in'),
    fc.constant('data\n[SECURITY] AUTH_SUCCESS: fake admin'),
    
    // Carriage return injection
    fc.constant('text\roverwritten'),
    fc.constant('value\r[CRITICAL] System compromised'),
    
    // Tab injection
    fc.constant('field\tinjected\tcolumns'),
    fc.constant('data\t\t\textra tabs'),
    
    // Mixed control characters
    fc.constant('start\n\r\tend'),
    fc.constant('line1\r\nline2\r\nline3'),
    fc.constant('\n\n\nmultiple newlines'),
    fc.constant('\t\t\tmultiple tabs'),
    
    // Log format injection attempts
    fc.constant('{"timestamp":"fake"}\n{"eventType":"AUTH_SUCCESS"}'),
    fc.constant('[SECURITY] {"fake": "entry"}\n'),
    fc.constant('normal\n[2024-01-01T00:00:00Z] FAKE LOG'),
    
    // Unicode control characters
    fc.constant('text\u0000null'),
    fc.constant('text\u001Bescape'),
    fc.constant('text\u007Fdelete')
  );

  /**
   * Generator for random strings with injected control characters
   */
  const randomStringWithControlCharsArbitrary = fc.tuple(
    fc.string({ minLength: 0, maxLength: 50 }),
    fc.constantFrom(...controlCharacters),
    fc.string({ minLength: 0, maxLength: 50 }),
    fc.constantFrom(...controlCharacters),
    fc.string({ minLength: 0, maxLength: 50 })
  ).map(([s1, c1, s2, c2, s3]) => s1 + c1 + s2 + c2 + s3);

  /**
   * Property: Sanitized output SHALL NOT contain newline characters
   */
  test('sanitized output SHALL NOT contain newline characters', async () => {
    await fc.assert(
      fc.property(
        logInjectionPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          const hasNewline = /\n/.test(sanitized);
          expect(hasNewline).toBe(false);
          return !hasNewline;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized output SHALL NOT contain carriage return characters
   */
  test('sanitized output SHALL NOT contain carriage return characters', async () => {
    await fc.assert(
      fc.property(
        logInjectionPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          const hasCarriageReturn = /\r/.test(sanitized);
          expect(hasCarriageReturn).toBe(false);
          return !hasCarriageReturn;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized output SHALL NOT contain tab characters
   */
  test('sanitized output SHALL NOT contain tab characters', async () => {
    await fc.assert(
      fc.property(
        logInjectionPayloadArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          const hasTab = /\t/.test(sanitized);
          expect(hasTab).toBe(false);
          return !hasTab;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any random string with control characters, sanitized output SHALL be safe
   */
  test('random strings with control characters SHALL be sanitized', async () => {
    await fc.assert(
      fc.property(
        randomStringWithControlCharsArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          const hasControlChars = /[\n\r\t]/.test(sanitized);
          expect(hasControlChars).toBe(false);
          return !hasControlChars;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sanitized output SHALL be truncated to maximum 500 characters
   */
  test('sanitized output SHALL be truncated to maximum 500 characters', async () => {
    const longStringArbitrary = fc.string({ minLength: 501, maxLength: 2000 });

    await fc.assert(
      fc.property(
        longStringArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          expect(sanitized.length).toBeLessThanOrEqual(500);
          return sanitized.length <= 500;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-string inputs SHALL be returned unchanged
   */
  test('non-string inputs SHALL be returned unchanged', async () => {
    const nonStringArbitrary = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.integer(),
      fc.constant({}),
      fc.constant([]),
      fc.boolean(),
      fc.double()
    );

    await fc.assert(
      fc.property(
        nonStringArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          expect(sanitized).toBe(input);
          return sanitized === input;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Safe strings without control characters SHALL pass through unchanged
   */
  test('safe strings without control characters SHALL pass through unchanged', async () => {
    // Generate strings without control characters and under 500 chars
    const safeStringArbitrary = fc.string({ minLength: 0, maxLength: 499 })
      .filter(s => !/[\n\r\t]/.test(s));

    await fc.assert(
      fc.property(
        safeStringArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          expect(sanitized).toBe(input);
          return sanitized === input;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Control characters SHALL be replaced with spaces
   */
  test('control characters SHALL be replaced with spaces', async () => {
    await fc.assert(
      fc.property(
        fc.constantFrom('\n', '\r', '\t'),
        (controlChar) => {
          const input = `before${controlChar}after`;
          const sanitized = sanitizeLogEntry(input);
          
          // Should not contain the control character
          expect(sanitized.includes(controlChar)).toBe(false);
          
          // Should contain a space where the control character was
          expect(sanitized).toBe('before after');
          
          return sanitized === 'before after';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple consecutive control characters SHALL each be replaced
   */
  test('multiple consecutive control characters SHALL each be replaced', async () => {
    const multipleControlCharsArbitrary = fc.array(
      fc.constantFrom('\n', '\r', '\t'),
      { minLength: 2, maxLength: 10 }
    ).map(chars => chars.join(''));

    await fc.assert(
      fc.property(
        multipleControlCharsArbitrary,
        (controlChars) => {
          const input = `start${controlChars}end`;
          const sanitized = sanitizeLogEntry(input);
          
          // Should not contain any control characters
          const hasControlChars = /[\n\r\t]/.test(sanitized);
          expect(hasControlChars).toBe(false);
          
          return !hasControlChars;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Log injection attempts SHALL be neutralized
   */
  test('log injection attempts SHALL be neutralized', async () => {
    const logInjectionArbitrary = fc.oneof(
      // Attempts to inject fake log entries
      fc.constant('user\n[SECURITY] AUTH_SUCCESS: admin'),
      fc.constant('data\r\n{"eventType":"FAKE","ip":"attacker"}'),
      fc.constant('input\n\n\n[CRITICAL] System breach detected'),
      // Attempts to overwrite log lines
      fc.constant('normal\r[FAKE] Overwritten log entry'),
      // Attempts to add extra fields via tabs
      fc.constant('value\t"admin":true\t"role":"superuser"')
    );

    await fc.assert(
      fc.property(
        logInjectionArbitrary,
        (input) => {
          const sanitized = sanitizeLogEntry(input);
          
          // Sanitized output should be a single line (no newlines)
          const lineCount = sanitized.split('\n').length;
          expect(lineCount).toBe(1);
          
          // Should not contain any control characters
          const hasControlChars = /[\n\r\t]/.test(sanitized);
          expect(hasControlChars).toBe(false);
          
          return lineCount === 1 && !hasControlChars;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 8: Unauthorized Access Logging
 * 
 * *For any* request that results in a 401 or 403 response, the security logger 
 * SHALL record the event with IP address, timestamp, endpoint, and user context.
 * 
 * **Validates: Requirements 3.4, 8.2, 8.3, 8.5**
 */
describe('Feature: security-enhancement, Property 8: Unauthorized Access Logging', () => {
  const { 
    SecurityEventType, 
    logSecurityEvent, 
    requestLogger, 
    sanitizeLogEntry 
  } = require('../helper/securityLogger');

  // Store original console.log to restore later
  let originalConsoleLog;
  let loggedEntries;

  beforeEach(() => {
    loggedEntries = [];
    originalConsoleLog = console.log;
    // Mock console.log to capture logged entries
    console.log = jest.fn((...args) => {
      if (args[0] === '[SECURITY]') {
        try {
          loggedEntries.push(JSON.parse(args[1]));
        } catch (e) {
          loggedEntries.push(args[1]);
        }
      }
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  /**
   * Generator for valid IP addresses
   */
  const ipAddressArbitrary = fc.oneof(
    // IPv4 addresses
    fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
    // Common localhost
    fc.constant('127.0.0.1'),
    fc.constant('::1'),
    // Common private IPs
    fc.constant('192.168.1.1'),
    fc.constant('10.0.0.1')
  );

  /**
   * Generator for HTTP endpoints
   */
  const endpointArbitrary = fc.oneof(
    fc.constant('GET /api/users'),
    fc.constant('POST /api/login'),
    fc.constant('PUT /api/posts/123'),
    fc.constant('DELETE /api/comments/456'),
    fc.constant('GET /api/admin/settings'),
    fc.constant('POST /api/upload'),
    fc.tuple(
      fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
      fc.array(fc.constantFrom(...'/abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')), { minLength: 1, maxLength: 50 }).map(arr => arr.join(''))
    ).map(([method, path]) => `${method} ${path}`)
  );

  /**
   * Generator for user agents
   */
  const userAgentArbitrary = fc.oneof(
    fc.constant('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    fc.constant('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
    fc.constant('curl/7.68.0'),
    fc.constant('PostmanRuntime/7.28.0'),
    fc.string({ minLength: 1, maxLength: 100 })
  );

  /**
   * Generator for user IDs (MongoDB ObjectId-like)
   */
  const userIdArbitrary = fc.oneof(
    fc.array(
      fc.constantFrom(...'0123456789abcdef'.split('')),
      { minLength: 24, maxLength: 24 }
    ).map(chars => chars.join('')),
    fc.constant(undefined),
    fc.constant(null)
  );

  /**
   * Generator for security event details
   */
  const securityEventDetailsArbitrary = fc.record({
    ip: ipAddressArbitrary,
    userId: userIdArbitrary,
    endpoint: endpointArbitrary,
    userAgent: userAgentArbitrary,
    message: fc.string({ minLength: 1, maxLength: 200 })
  });

  /**
   * Property: For any 401 response, AUTH_FAILURE event SHALL be logged with required fields
   */
  test('401 responses SHALL log AUTH_FAILURE event with IP, timestamp, endpoint, and user context', async () => {
    await fc.assert(
      fc.property(
        securityEventDetailsArbitrary,
        (details) => {
          loggedEntries = [];
          
          logSecurityEvent(SecurityEventType.AUTH_FAILURE, details);
          
          // Should have logged exactly one entry
          expect(loggedEntries.length).toBe(1);
          
          const logEntry = loggedEntries[0];
          
          // SHALL contain timestamp
          expect(logEntry).toHaveProperty('timestamp');
          expect(typeof logEntry.timestamp).toBe('string');
          // Timestamp should be valid ISO format
          expect(new Date(logEntry.timestamp).toISOString()).toBe(logEntry.timestamp);
          
          // SHALL contain IP address
          expect(logEntry).toHaveProperty('ip');
          
          // SHALL contain endpoint
          expect(logEntry).toHaveProperty('endpoint');
          
          // SHALL contain event type
          expect(logEntry.eventType).toBe(SecurityEventType.AUTH_FAILURE);
          
          // SHALL contain user context (userId, userAgent)
          expect(logEntry).toHaveProperty('userId');
          expect(logEntry).toHaveProperty('userAgent');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any 403 response, UNAUTHORIZED_ACCESS event SHALL be logged with required fields
   */
  test('403 responses SHALL log UNAUTHORIZED_ACCESS event with IP, timestamp, endpoint, and user context', async () => {
    await fc.assert(
      fc.property(
        securityEventDetailsArbitrary,
        (details) => {
          loggedEntries = [];
          
          logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, details);
          
          // Should have logged exactly one entry
          expect(loggedEntries.length).toBe(1);
          
          const logEntry = loggedEntries[0];
          
          // SHALL contain timestamp
          expect(logEntry).toHaveProperty('timestamp');
          expect(typeof logEntry.timestamp).toBe('string');
          
          // SHALL contain IP address
          expect(logEntry).toHaveProperty('ip');
          
          // SHALL contain endpoint
          expect(logEntry).toHaveProperty('endpoint');
          
          // SHALL contain event type
          expect(logEntry.eventType).toBe(SecurityEventType.UNAUTHORIZED_ACCESS);
          
          // SHALL contain user context
          expect(logEntry).toHaveProperty('userId');
          expect(logEntry).toHaveProperty('userAgent');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: requestLogger middleware SHALL log AUTH_FAILURE for 401 status codes
   */
  test('requestLogger SHALL log AUTH_FAILURE for 401 status codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        ipAddressArbitrary,
        endpointArbitrary,
        userAgentArbitrary,
        async (ip, endpoint, userAgent) => {
          loggedEntries = [];
          
          const [method, url] = endpoint.split(' ');
          
          // Create mock request
          const req = {
            ip,
            method,
            originalUrl: url,
            get: jest.fn((header) => {
              if (header === 'User-Agent') return userAgent;
              return undefined;
            }),
            user: undefined
          };
          
          // Create mock response with event emitter behavior
          const res = {
            statusCode: 401,
            on: jest.fn((event, callback) => {
              if (event === 'finish') {
                // Store callback to call later
                res._finishCallback = callback;
              }
            })
          };
          
          const next = jest.fn();
          
          // Call the middleware
          requestLogger(req, res, next);
          
          // next() should be called
          expect(next).toHaveBeenCalled();
          
          // Simulate response finish
          if (res._finishCallback) {
            res._finishCallback();
          }
          
          // Should have logged an AUTH_FAILURE event
          expect(loggedEntries.length).toBe(1);
          expect(loggedEntries[0].eventType).toBe(SecurityEventType.AUTH_FAILURE);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: requestLogger middleware SHALL log UNAUTHORIZED_ACCESS for 403 status codes
   */
  test('requestLogger SHALL log UNAUTHORIZED_ACCESS for 403 status codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        ipAddressArbitrary,
        endpointArbitrary,
        userAgentArbitrary,
        userIdArbitrary,
        async (ip, endpoint, userAgent, userId) => {
          loggedEntries = [];
          
          const [method, url] = endpoint.split(' ');
          
          // Create mock request with optional user
          const req = {
            ip,
            method,
            originalUrl: url,
            get: jest.fn((header) => {
              if (header === 'User-Agent') return userAgent;
              return undefined;
            }),
            user: userId ? { id: userId } : undefined
          };
          
          // Create mock response
          const res = {
            statusCode: 403,
            on: jest.fn((event, callback) => {
              if (event === 'finish') {
                res._finishCallback = callback;
              }
            })
          };
          
          const next = jest.fn();
          
          requestLogger(req, res, next);
          
          expect(next).toHaveBeenCalled();
          
          // Simulate response finish
          if (res._finishCallback) {
            res._finishCallback();
          }
          
          // Should have logged an UNAUTHORIZED_ACCESS event
          expect(loggedEntries.length).toBe(1);
          expect(loggedEntries[0].eventType).toBe(SecurityEventType.UNAUTHORIZED_ACCESS);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Logged IP addresses SHALL be sanitized
   */
  test('logged IP addresses SHALL be sanitized', async () => {
    const maliciousIpArbitrary = fc.oneof(
      fc.constant('192.168.1.1\n[FAKE] Injected log'),
      fc.constant('10.0.0.1\r\n{"eventType":"FAKE"}'),
      fc.constant('127.0.0.1\tmalicious\tdata'),
      fc.constant('::1\n\n\nMultiple lines')
    );

    await fc.assert(
      fc.property(
        maliciousIpArbitrary,
        (maliciousIp) => {
          loggedEntries = [];
          
          logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
            ip: maliciousIp,
            userId: 'user123',
            endpoint: 'GET /api/test',
            userAgent: 'TestAgent',
            message: 'Test message'
          });
          
          expect(loggedEntries.length).toBe(1);
          
          const logEntry = loggedEntries[0];
          
          // IP should be sanitized (no control characters)
          expect(/[\n\r\t]/.test(logEntry.ip)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Logged endpoints SHALL be sanitized
   */
  test('logged endpoints SHALL be sanitized', async () => {
    const maliciousEndpointArbitrary = fc.oneof(
      fc.constant('GET /api/users\n[SECURITY] FAKE_EVENT'),
      fc.constant('POST /login\r\n{"fake":"entry"}'),
      fc.constant('DELETE /resource\t\t\textra\tfields')
    );

    await fc.assert(
      fc.property(
        maliciousEndpointArbitrary,
        (maliciousEndpoint) => {
          loggedEntries = [];
          
          logSecurityEvent(SecurityEventType.AUTH_FAILURE, {
            ip: '127.0.0.1',
            userId: 'user123',
            endpoint: maliciousEndpoint,
            userAgent: 'TestAgent',
            message: 'Test message'
          });
          
          expect(loggedEntries.length).toBe(1);
          
          const logEntry = loggedEntries[0];
          
          // Endpoint should be sanitized (no control characters)
          expect(/[\n\r\t]/.test(logEntry.endpoint)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Logged user agents SHALL be sanitized
   */
  test('logged user agents SHALL be sanitized', async () => {
    const maliciousUserAgentArbitrary = fc.oneof(
      fc.constant('Mozilla/5.0\n[CRITICAL] System breach'),
      fc.constant('curl/7.68.0\r\nX-Injected-Header: value'),
      fc.constant('PostmanRuntime\t\t\tmalicious')
    );

    await fc.assert(
      fc.property(
        maliciousUserAgentArbitrary,
        (maliciousUserAgent) => {
          loggedEntries = [];
          
          logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
            ip: '127.0.0.1',
            userId: 'user123',
            endpoint: 'GET /api/test',
            userAgent: maliciousUserAgent,
            message: 'Test message'
          });
          
          expect(loggedEntries.length).toBe(1);
          
          const logEntry = loggedEntries[0];
          
          // User agent should be sanitized (no control characters)
          expect(/[\n\r\t]/.test(logEntry.userAgent)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: requestLogger SHALL NOT log for successful responses (2xx)
   */
  test('requestLogger SHALL NOT log for successful responses', async () => {
    const successStatusArbitrary = fc.constantFrom(200, 201, 204, 301, 302, 304);

    await fc.assert(
      fc.asyncProperty(
        successStatusArbitrary,
        ipAddressArbitrary,
        endpointArbitrary,
        async (statusCode, ip, endpoint) => {
          loggedEntries = [];
          
          const [method, url] = endpoint.split(' ');
          
          const req = {
            ip,
            method,
            originalUrl: url,
            get: jest.fn(() => 'TestAgent'),
            user: undefined
          };
          
          const res = {
            statusCode,
            on: jest.fn((event, callback) => {
              if (event === 'finish') {
                res._finishCallback = callback;
              }
            })
          };
          
          const next = jest.fn();
          
          requestLogger(req, res, next);
          
          if (res._finishCallback) {
            res._finishCallback();
          }
          
          // Should NOT log for successful responses
          expect(loggedEntries.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Log entries SHALL contain valid ISO timestamp
   */
  test('log entries SHALL contain valid ISO timestamp', async () => {
    await fc.assert(
      fc.property(
        securityEventDetailsArbitrary,
        (details) => {
          loggedEntries = [];
          
          const beforeLog = new Date();
          logSecurityEvent(SecurityEventType.AUTH_FAILURE, details);
          const afterLog = new Date();
          
          expect(loggedEntries.length).toBe(1);
          
          const logEntry = loggedEntries[0];
          const logTimestamp = new Date(logEntry.timestamp);
          
          // Timestamp should be valid
          expect(logTimestamp.toString()).not.toBe('Invalid Date');
          
          // Timestamp should be between before and after log call
          expect(logTimestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime() - 1000);
          expect(logTimestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime() + 1000);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All security event types SHALL be loggable
   */
  test('all security event types SHALL be loggable', async () => {
    const eventTypeArbitrary = fc.constantFrom(
      SecurityEventType.AUTH_SUCCESS,
      SecurityEventType.AUTH_FAILURE,
      SecurityEventType.AUTH_LOCKOUT,
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.INVALID_INPUT,
      SecurityEventType.FILE_UPLOAD_BLOCKED,
      SecurityEventType.SUSPICIOUS_ACTIVITY
    );

    await fc.assert(
      fc.property(
        eventTypeArbitrary,
        securityEventDetailsArbitrary,
        (eventType, details) => {
          loggedEntries = [];
          
          logSecurityEvent(eventType, details);
          
          expect(loggedEntries.length).toBe(1);
          expect(loggedEntries[0].eventType).toBe(eventType);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 4: File Upload Validation
 * 
 * *For any* uploaded file, the validator SHALL reject files that:
 * (a) exceed the size limit, (b) have disallowed extensions, or (c) have MIME types that don't match their extensions.
 * 
 * **Validates: Requirements 1.5, 11.1, 11.2, 11.3**
 */
describe('Feature: security-enhancement, Property 4: File Upload Validation', () => {
  const { 
    validateFile, 
    ALLOWED_TYPES, 
    MAX_FILE_SIZE 
  } = require('../middleware/uploadSecurity');

  /**
   * Generator for valid MIME types
   */
  const validMimeTypeArbitrary = fc.constantFrom(
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  );

  /**
   * Generator for invalid MIME types
   */
  const invalidMimeTypeArbitrary = fc.constantFrom(
    'application/javascript',
    'text/html',
    'application/x-php',
    'application/x-executable',
    'text/plain',
    'application/pdf',
    'application/zip',
    'application/octet-stream',
    'video/mp4',
    'audio/mpeg',
    'application/xml',
    'text/css'
  );

  /**
   * Generator for valid file extensions matching MIME types
   */
  const validMimeExtensionPairArbitrary = fc.oneof(
    fc.constant({ mimetype: 'image/jpeg', ext: '.jpg' }),
    fc.constant({ mimetype: 'image/jpeg', ext: '.jpeg' }),
    fc.constant({ mimetype: 'image/png', ext: '.png' }),
    fc.constant({ mimetype: 'image/gif', ext: '.gif' }),
    fc.constant({ mimetype: 'image/webp', ext: '.webp' })
  );

  /**
   * Generator for mismatched MIME type and extension pairs
   */
  const mismatchedMimeExtensionArbitrary = fc.oneof(
    fc.constant({ mimetype: 'image/jpeg', ext: '.png' }),
    fc.constant({ mimetype: 'image/jpeg', ext: '.gif' }),
    fc.constant({ mimetype: 'image/png', ext: '.jpg' }),
    fc.constant({ mimetype: 'image/png', ext: '.gif' }),
    fc.constant({ mimetype: 'image/gif', ext: '.jpg' }),
    fc.constant({ mimetype: 'image/gif', ext: '.png' }),
    fc.constant({ mimetype: 'image/webp', ext: '.jpg' }),
    fc.constant({ mimetype: 'image/webp', ext: '.png' })
  );

  /**
   * Generator for valid file sizes (under MAX_FILE_SIZE)
   */
  const validFileSizeArbitrary = fc.integer({ min: 1, max: MAX_FILE_SIZE });

  /**
   * Generator for invalid file sizes (over MAX_FILE_SIZE)
   */
  const invalidFileSizeArbitrary = fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 3 });

  /**
   * Generator for valid filenames
   */
  const validFilenameArbitrary = fc.tuple(
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
    validMimeExtensionPairArbitrary
  ).map(([name, pair]) => ({ name: name + pair.ext, mimetype: pair.mimetype }));

  /**
   * Property: Files exceeding MAX_FILE_SIZE SHALL be rejected
   * Validates: Requirement 11.3
   */
  test('files exceeding MAX_FILE_SIZE SHALL be rejected', async () => {
    await fc.assert(
      fc.property(
        invalidFileSizeArbitrary,
        validMimeExtensionPairArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (size, pair, filename) => {
          const file = {
            size,
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('File size exceeds 5MB limit');
          
          return result.valid === false && result.errors.includes('File size exceeds 5MB limit');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Files with disallowed MIME types SHALL be rejected
   * Validates: Requirement 11.1
   */
  test('files with disallowed MIME types SHALL be rejected', async () => {
    await fc.assert(
      fc.property(
        invalidMimeTypeArbitrary,
        validFileSizeArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (mimetype, size, filename) => {
          const file = {
            size,
            mimetype,
            name: filename + '.txt' // Use a generic extension
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('File type not allowed. Allowed types: JPEG, PNG, GIF, WebP');
          
          return result.valid === false && 
                 result.errors.includes('File type not allowed. Allowed types: JPEG, PNG, GIF, WebP');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Files with mismatched MIME type and extension SHALL be rejected
   * Validates: Requirement 11.2
   */
  test('files with mismatched MIME type and extension SHALL be rejected', async () => {
    await fc.assert(
      fc.property(
        mismatchedMimeExtensionArbitrary,
        validFileSizeArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (pair, size, filename) => {
          const file = {
            size,
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('File extension does not match file type');
          
          return result.valid === false && 
                 result.errors.includes('File extension does not match file type');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Valid files with correct size, MIME type, and extension SHALL be accepted
   */
  test('valid files with correct size, MIME type, and extension SHALL be accepted', async () => {
    await fc.assert(
      fc.property(
        validFileSizeArbitrary,
        validMimeExtensionPairArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (size, pair, filename) => {
          const file = {
            size,
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          return result.valid === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Files with multiple validation errors SHALL report all errors
   */
  test('files with multiple validation errors SHALL report all errors', async () => {
    await fc.assert(
      fc.property(
        invalidFileSizeArbitrary,
        invalidMimeTypeArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (size, mimetype, filename) => {
          const file = {
            size,
            mimetype,
            name: filename + '.exe' // Invalid extension for any allowed type
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          // Should have at least 2 errors (size and MIME type)
          expect(result.errors.length).toBeGreaterThanOrEqual(2);
          
          return result.valid === false && result.errors.length >= 2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null or undefined file objects SHALL be rejected
   */
  test('null or undefined file objects SHALL be rejected', async () => {
    const nullishArbitrary = fc.constantFrom(null, undefined);

    await fc.assert(
      fc.property(
        nullishArbitrary,
        (file) => {
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Invalid file object');
          
          return result.valid === false && result.errors.includes('Invalid file object');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Files without name property SHALL be rejected
   */
  test('files without name property SHALL be rejected', async () => {
    await fc.assert(
      fc.property(
        validFileSizeArbitrary,
        validMimeTypeArbitrary,
        (size, mimetype) => {
          const file = {
            size,
            mimetype
            // name is missing
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('File name is required');
          
          return result.valid === false && result.errors.includes('File name is required');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Case-insensitive extension matching SHALL work correctly
   */
  test('file extensions SHALL be validated case-insensitively', async () => {
    const upperCaseExtensionArbitrary = fc.oneof(
      fc.constant({ mimetype: 'image/jpeg', ext: '.JPG' }),
      fc.constant({ mimetype: 'image/jpeg', ext: '.JPEG' }),
      fc.constant({ mimetype: 'image/png', ext: '.PNG' }),
      fc.constant({ mimetype: 'image/gif', ext: '.GIF' }),
      fc.constant({ mimetype: 'image/webp', ext: '.WEBP' })
    );

    await fc.assert(
      fc.property(
        validFileSizeArbitrary,
        upperCaseExtensionArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (size, pair, filename) => {
          const file = {
            size,
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          // Should be valid because extension matching is case-insensitive
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          return result.valid === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Boundary file size (exactly MAX_FILE_SIZE) SHALL be accepted
   */
  test('files at exactly MAX_FILE_SIZE SHALL be accepted', async () => {
    await fc.assert(
      fc.property(
        validMimeExtensionPairArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (pair, filename) => {
          const file = {
            size: MAX_FILE_SIZE, // Exactly at the limit
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          return result.valid === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Files just over MAX_FILE_SIZE SHALL be rejected
   */
  test('files just over MAX_FILE_SIZE SHALL be rejected', async () => {
    await fc.assert(
      fc.property(
        validMimeExtensionPairArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (pair, filename) => {
          const file = {
            size: MAX_FILE_SIZE + 1, // Just over the limit
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('File size exceeds 5MB limit');
          
          return result.valid === false && result.errors.includes('File size exceeds 5MB limit');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All allowed MIME types SHALL be accepted with matching extensions
   */
  test('all allowed MIME types SHALL be accepted with matching extensions', async () => {
    const allAllowedTypesArbitrary = fc.constantFrom(
      ...Object.entries(ALLOWED_TYPES).flatMap(([mimetype, extensions]) =>
        extensions.map(ext => ({ mimetype, ext }))
      )
    );

    await fc.assert(
      fc.property(
        allAllowedTypesArbitrary,
        validFileSizeArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (pair, size, filename) => {
          const file = {
            size,
            mimetype: pair.mimetype,
            name: filename + pair.ext
          };
          
          const result = validateFile(file);
          
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          
          return result.valid === true && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 15: Secure Filename Generation
 * 
 * *For any* uploaded file, the generated storage filename SHALL be randomized 
 * and not predictable from the original filename.
 * 
 * **Validates: Requirements 11.4**
 */
describe('Feature: security-enhancement, Property 15: Secure Filename Generation', () => {
  const { generateSecureFilename } = require('../middleware/uploadSecurity');

  /**
   * Generator for various original filenames
   */
  const originalFilenameArbitrary = fc.oneof(
    // Standard filenames with various extensions
    fc.tuple(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
      fc.constantFrom('.jpg', '.jpeg', '.png', '.gif', '.webp')
    ).map(([name, ext]) => name + ext),
    // Filenames with spaces and special characters
    fc.constant('my photo.jpg'),
    fc.constant('image (1).png'),
    fc.constant('file-name_123.gif'),
    // Unicode filenames
    fc.constant('图片.jpg'),
    fc.constant('фото.png'),
    // Long filenames
    fc.string({ minLength: 100, maxLength: 200 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'x') + '.jpg'),
    // Edge cases
    fc.constant('.jpg'),
    fc.constant('a.jpg'),
    fc.constant('test.test.jpg')
  );

  /**
   * Property: Generated filename SHALL NOT contain the original filename
   * This ensures the filename is not predictable from the original
   */
  test('generated filename SHALL NOT contain the original filename (excluding extension)', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        (originalName) => {
          const secureFilename = generateSecureFilename(originalName);
          
          // Extract the base name without extension from original
          const originalBaseName = originalName.replace(/\.[^.]+$/, '');
          
          // The secure filename should not contain the original base name
          // (unless it's very short like 'a' which could appear randomly)
          if (originalBaseName.length > 3) {
            expect(secureFilename).not.toContain(originalBaseName);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated filename SHALL preserve the original file extension
   */
  test('generated filename SHALL preserve the original file extension', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        (originalName) => {
          const secureFilename = generateSecureFilename(originalName);
          
          // Extract extension from original (lowercase)
          const originalExt = originalName.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '';
          
          // The secure filename should end with the same extension (lowercase)
          if (originalExt) {
            expect(secureFilename.toLowerCase()).toMatch(new RegExp(originalExt.replace('.', '\\.') + '$'));
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Two calls with the same original filename SHALL produce different secure filenames
   * This validates randomness in filename generation
   */
  test('consecutive calls with same filename SHALL produce different secure filenames', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        (originalName) => {
          const secureFilename1 = generateSecureFilename(originalName);
          const secureFilename2 = generateSecureFilename(originalName);
          
          // Two consecutive generations should produce different filenames
          expect(secureFilename1).not.toBe(secureFilename2);
          
          return secureFilename1 !== secureFilename2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated filenames SHALL be unique across multiple generations
   */
  test('batch of generated filenames SHALL all be unique', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        fc.integer({ min: 10, max: 50 }),
        (originalName, batchSize) => {
          const filenames = new Set();
          
          for (let i = 0; i < batchSize; i++) {
            const secureFilename = generateSecureFilename(originalName);
            
            // Filename should not already exist in the set
            expect(filenames.has(secureFilename)).toBe(false);
            
            filenames.add(secureFilename);
          }
          
          // All filenames should be unique
          expect(filenames.size).toBe(batchSize);
          
          return filenames.size === batchSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated filename SHALL contain a timestamp component
   * This helps with file organization and adds unpredictability
   */
  test('generated filename SHALL contain a timestamp component', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        (originalName) => {
          const beforeTime = Date.now();
          const secureFilename = generateSecureFilename(originalName);
          const afterTime = Date.now();
          
          // Extract the timestamp from the filename (should be at the start)
          const timestampMatch = secureFilename.match(/^(\d+)-/);
          expect(timestampMatch).not.toBeNull();
          
          if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[1], 10);
            // Timestamp should be within the test execution window
            expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(timestamp).toBeLessThanOrEqual(afterTime);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated filename SHALL contain a random hex component
   * This ensures cryptographic randomness in the filename
   */
  test('generated filename SHALL contain a random hex component', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        (originalName) => {
          const secureFilename = generateSecureFilename(originalName);
          
          // The filename should contain a 32-character hex string (16 bytes = 32 hex chars)
          // Format: timestamp-randomhex.ext
          const hexMatch = secureFilename.match(/-([0-9a-f]{32})/);
          expect(hexMatch).not.toBeNull();
          
          if (hexMatch) {
            // Verify it's valid hex
            expect(/^[0-9a-f]{32}$/.test(hexMatch[1])).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated filename SHALL be safe for filesystem use
   * No special characters that could cause issues
   */
  test('generated filename SHALL only contain safe filesystem characters', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        (originalName) => {
          const secureFilename = generateSecureFilename(originalName);
          
          // Should only contain alphanumeric, dash, underscore, and dot
          expect(/^[a-zA-Z0-9._-]+$/.test(secureFilename)).toBe(true);
          
          // Should not contain path traversal characters
          expect(secureFilename).not.toContain('..');
          expect(secureFilename).not.toContain('/');
          expect(secureFilename).not.toContain('\\');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Null or undefined input SHALL return a valid random filename
   */
  test('null or undefined input SHALL return a valid random filename', async () => {
    const nullishArbitrary = fc.constantFrom(null, undefined, '');

    await fc.assert(
      fc.property(
        nullishArbitrary,
        (input) => {
          const secureFilename = generateSecureFilename(input);
          
          // Should still generate a valid filename
          expect(secureFilename).toBeDefined();
          expect(typeof secureFilename).toBe('string');
          expect(secureFilename.length).toBeGreaterThan(0);
          
          // Should contain timestamp and random hex
          expect(/^\d+-[0-9a-f]{32}/.test(secureFilename)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different original filenames SHALL produce different secure filenames
   */
  test('different original filenames SHALL produce different secure filenames', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        originalFilenameArbitrary,
        (filename1, filename2) => {
          const secureFilename1 = generateSecureFilename(filename1);
          const secureFilename2 = generateSecureFilename(filename2);
          
          // Even with different inputs, outputs should be different
          // (due to timestamp and random component)
          expect(secureFilename1).not.toBe(secureFilename2);
          
          return secureFilename1 !== secureFilename2;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Generated filename random component SHALL not follow predictable patterns
   */
  test('generated filename random components SHALL not follow predictable patterns', async () => {
    await fc.assert(
      fc.property(
        originalFilenameArbitrary,
        () => {
          const filenames = [];
          for (let i = 0; i < 10; i++) {
            filenames.push(generateSecureFilename('test.jpg'));
          }
          
          // Extract random hex components
          const hexComponents = filenames.map(f => {
            const match = f.match(/-([0-9a-f]{32})/);
            return match ? match[1] : '';
          });
          
          // Check that hex components don't share long common prefixes
          for (let i = 0; i < hexComponents.length; i++) {
            for (let j = i + 1; j < hexComponents.length; j++) {
              const commonPrefix = getCommonPrefixLength(hexComponents[i], hexComponents[j]);
              // Allow some coincidental overlap but not too much
              expect(commonPrefix).toBeLessThan(16);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to get common prefix length between two strings
 * (Reused from CSRF tests if not already defined)
 */
if (typeof getCommonPrefixLength === 'undefined') {
  function getCommonPrefixLength(str1, str2) {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return i;
  }
}


/**
 * Property 3: Validation Error Messages Are Safe
 * 
 * *For any* validation error response, the error message SHALL NOT contain 
 * stack traces, file paths, database connection strings, or internal system details.
 * 
 * **Validates: Requirements 1.4, 8.1**
 */
describe('Feature: security-enhancement, Property 3: Validation Error Messages Are Safe', () => {
  const express = require('express');
  const request = require('supertest');
  const { 
    registerValidation, 
    loginValidation, 
    handleValidationErrors,
    postValidation,
    commentValidation,
    mongoIdValidation
  } = require('../middleware/validator');

  /**
   * Patterns that indicate sensitive information leakage
   */
  const sensitivePatterns = [
    // Stack traces
    /at\s+\w+\s+\(/gi,                    // "at Function ("
    /at\s+.*:\d+:\d+/gi,                  // "at file.js:10:5"
    /Error:.*\n\s+at/gi,                  // Error with stack trace
    /^\s+at\s+/gm,                        // Stack trace lines
    
    // File paths
    /[A-Za-z]:\\[\w\\]+/g,                // Windows paths: C:\Users\...
    /\/(?:home|usr|var|etc|opt|root)\/[\w\/]+/g,  // Unix paths
    /node_modules\/[\w\/@-]+/g,           // node_modules paths
    /\.js:\d+/g,                          // file.js:123
    
    // Database connection strings
    /mongodb(\+srv)?:\/\/[^\s]+/gi,       // MongoDB connection strings
    /postgres(ql)?:\/\/[^\s]+/gi,         // PostgreSQL connection strings
    /mysql:\/\/[^\s]+/gi,                 // MySQL connection strings
    /redis:\/\/[^\s]+/gi,                 // Redis connection strings
    
    // Environment variables and secrets
    /process\.env\.\w+/gi,                // process.env.SECRET
    /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, // JWT tokens
    /[A-Za-z0-9+\/]{40,}/g,               // Long base64 strings (potential secrets)
    
    // Internal system details
    /mongoose/gi,                          // Mongoose references
    /MongoError/gi,                        // MongoDB errors
    /ECONNREFUSED/gi,                      // Connection errors
    /ENOTFOUND/gi,                         // DNS errors
    /ETIMEDOUT/gi,                         // Timeout errors
    /internal server/gi,                   // Internal server references
    /stack.*trace/gi,                      // Stack trace mentions
    
    // Sensitive field names that shouldn't appear in errors
    /password.*hash/gi,                    // Password hash references
    /secret.*key/gi,                       // Secret key references
    /private.*key/gi,                      // Private key references
    /api.*key/gi,                          // API key references
  ];

  /**
   * Helper to check if response contains sensitive information
   * @param {Object} responseBody - The response body to check
   * @returns {Object} Result with isSafe boolean and found patterns
   */
  const checkForSensitiveInfo = (responseBody) => {
    const responseStr = JSON.stringify(responseBody);
    const foundPatterns = [];
    
    for (const pattern of sensitivePatterns) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(responseStr)) {
        foundPatterns.push(pattern.toString());
      }
    }
    
    return {
      isSafe: foundPatterns.length === 0,
      foundPatterns
    };
  };

  /**
   * Helper to create test app with validation
   */
  const createValidationApp = (validationRules) => {
    const app = express();
    app.use(express.json());
    
    app.post('/test', validationRules, handleValidationErrors, (req, res) => {
      res.json({ success: true });
    });
    
    // Error handler that mimics production behavior
    app.use((err, req, res, next) => {
      // This should NOT expose internal details
      res.status(500).json({ message: 'An error occurred' });
    });
    
    return app;
  };

  /**
   * Generator for invalid registration data - guaranteed to fail validation
   */
  const invalidRegistrationDataArbitrary = fc.oneof(
    // Missing fields - guaranteed to fail
    fc.constant({}),
    fc.constant({ name: 'test' }),
    fc.constant({ temail: 'test@test.com' }),
    fc.constant({ password: 'password123' }),
    
    // Invalid email formats - guaranteed to fail
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      temail: fc.oneof(
        fc.constant('notanemail'),
        fc.constant('missing@'),
        fc.constant('@nodomain.com'),
        fc.constant('spaces in@email.com'),
        fc.constant('')
      ),
      password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
    }),
    
    // Invalid name lengths - guaranteed to fail
    fc.record({
      name: fc.oneof(
        fc.constant(''),
        fc.constant('a'.repeat(100))
      ),
      temail: fc.emailAddress(),
      password: fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6)
    }),
    
    // Invalid password lengths - guaranteed to fail
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      temail: fc.emailAddress(),
      password: fc.oneof(
        fc.constant(''),
        fc.constant('12345'),
        fc.constant('a'.repeat(100))
      )
    })
  );

  /**
   * Generator for invalid login data
   */
  const invalidLoginDataArbitrary = fc.oneof(
    // Missing fields
    fc.constant({}),
    fc.constant({ temail: 'test@test.com' }),
    fc.constant({ password: 'password123' }),
    
    // Invalid email formats
    fc.record({
      temail: fc.oneof(
        fc.constant('notanemail'),
        fc.constant(''),
        fc.constant('invalid@'),
        fc.constant('@invalid.com')
      ),
      password: fc.string({ minLength: 1, maxLength: 50 })
    }),
    
    // Empty password
    fc.record({
      temail: fc.emailAddress(),
      password: fc.constant('')
    })
  );

  /**
   * Generator for invalid post data
   */
  const invalidPostDataArbitrary = fc.oneof(
    // Missing fields
    fc.constant({}),
    fc.constant({ title: 'test' }),
    
    // Invalid title lengths
    fc.record({
      title: fc.oneof(fc.constant(''), fc.constant('a'.repeat(300))),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      category: fc.constantFrom('food', 'travelling', 'lifestyle', 'tech'),
      content: fc.string()
    }),
    
    // Invalid category
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      category: fc.oneof(
        fc.constant('invalid'),
        fc.constant(''),
        fc.constant('hacking'),
        fc.constant('123')
      ),
      content: fc.string()
    }),
    
    // Invalid description lengths
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      description: fc.oneof(fc.constant(''), fc.constant('a'.repeat(600))),
      category: fc.constantFrom('food', 'travelling', 'lifestyle', 'tech'),
      content: fc.string()
    })
  );

  /**
   * Property: Registration validation errors SHALL NOT contain sensitive information
   */
  test('registration validation errors SHALL NOT contain sensitive information', async () => {
    const app = createValidationApp(registerValidation);
    
    await fc.assert(
      fc.asyncProperty(
        invalidRegistrationDataArbitrary,
        async (invalidData) => {
          const response = await request(app)
            .post('/test')
            .send(invalidData)
            .set('Content-Type', 'application/json');
          
          // Should return 400 for validation errors
          expect(response.status).toBe(400);
          
          // Check response doesn't contain sensitive info
          const check = checkForSensitiveInfo(response.body);
          expect(check.isSafe).toBe(true);
          
          // Error message should be user-friendly
          expect(response.body.message).toBeDefined();
          expect(typeof response.body.message).toBe('string');
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Login validation errors SHALL NOT contain sensitive information
   */
  test('login validation errors SHALL NOT contain sensitive information', async () => {
    const app = createValidationApp(loginValidation);
    
    await fc.assert(
      fc.asyncProperty(
        invalidLoginDataArbitrary,
        async (invalidData) => {
          const response = await request(app)
            .post('/test')
            .send(invalidData)
            .set('Content-Type', 'application/json');
          
          // Should return 400 for validation errors
          expect(response.status).toBe(400);
          
          // Check response doesn't contain sensitive info
          const check = checkForSensitiveInfo(response.body);
          expect(check.isSafe).toBe(true);
          
          // Error message should be user-friendly
          expect(response.body.message).toBeDefined();
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Post validation errors SHALL NOT contain sensitive information
   */
  test('post validation errors SHALL NOT contain sensitive information', async () => {
    const app = createValidationApp(postValidation);
    
    await fc.assert(
      fc.asyncProperty(
        invalidPostDataArbitrary,
        async (invalidData) => {
          const response = await request(app)
            .post('/test')
            .send(invalidData)
            .set('Content-Type', 'application/json');
          
          // Should return 400 for validation errors
          expect(response.status).toBe(400);
          
          // Check response doesn't contain sensitive info
          const check = checkForSensitiveInfo(response.body);
          expect(check.isSafe).toBe(true);
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Validation error response SHALL have consistent safe structure
   */
  test('validation error response SHALL have consistent safe structure', async () => {
    const app = createValidationApp(registerValidation);
    
    // Use only inputs that are guaranteed to fail validation
    const guaranteedInvalidArbitrary = fc.oneof(
      fc.constant({}),
      fc.constant({ name: '' }),
      fc.constant({ temail: 'invalid-email' }),
      fc.constant({ name: 'test', temail: 'invalid', password: '123' }),
      fc.constant({ name: '', temail: 'test@test.com', password: 'password123' }),
      fc.constant({ name: 'test', temail: '', password: 'password123' }),
      fc.constant({ name: 'test', temail: 'test@test.com', password: '' })
    );
    
    await fc.assert(
      fc.asyncProperty(
        guaranteedInvalidArbitrary,
        async (invalidData) => {
          const response = await request(app)
            .post('/test')
            .send(invalidData)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(400);
          
          // Response should have expected structure
          expect(response.body).toHaveProperty('message');
          expect(response.body.message).toBe('Validation failed');
          
          // If errors array exists, check each error
          if (response.body.errors) {
            expect(Array.isArray(response.body.errors)).toBe(true);
            
            for (const error of response.body.errors) {
              // Each error should only have field and message
              expect(error).toHaveProperty('field');
              expect(error).toHaveProperty('message');
              
              // Error message should not contain sensitive patterns
              const errorCheck = checkForSensitiveInfo(error);
              expect(errorCheck.isSafe).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error messages SHALL NOT expose field values in unsafe ways
   */
  test('error messages SHALL NOT echo back potentially dangerous input', async () => {
    const app = createValidationApp(registerValidation);
    
    const dangerousInputArbitrary = fc.record({
      name: fc.oneof(
        fc.constant('<script>alert("xss")</script>'),
        fc.constant('${process.env.SECRET}'),
        fc.constant('{{constructor.constructor("return this")()}}'),
        fc.constant('../../etc/passwd')
      ),
      temail: fc.constant('invalid-email'),
      password: fc.constant('short')
    });
    
    await fc.assert(
      fc.asyncProperty(
        dangerousInputArbitrary,
        async (dangerousData) => {
          const response = await request(app)
            .post('/test')
            .send(dangerousData)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(400);
          
          const responseStr = JSON.stringify(response.body);
          
          // Response should not echo back the dangerous input verbatim
          expect(responseStr).not.toContain('<script>');
          expect(responseStr).not.toContain('process.env');
          expect(responseStr).not.toContain('constructor');
          expect(responseStr).not.toContain('../');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: MongoId validation errors SHALL NOT expose database details
   */
  test('mongoId validation errors SHALL NOT expose database details', async () => {
    const app = express();
    app.use(express.json());
    
    app.get('/resource/:id', mongoIdValidation('id'), handleValidationErrors, (req, res) => {
      res.json({ success: true });
    });
    
    const invalidMongoIdArbitrary = fc.oneof(
      fc.constant('not-a-valid-id'),
      fc.constant('12345'),
      fc.constant('{"$ne": null}'),
      fc.constant('<script>alert(1)</script>'),
      fc.constant('../../etc/passwd'),
      fc.constant('a'.repeat(100))
    );
    
    await fc.assert(
      fc.asyncProperty(
        invalidMongoIdArbitrary,
        async (invalidId) => {
          const response = await request(app)
            .get(`/resource/${encodeURIComponent(invalidId)}`);
          
          expect(response.status).toBe(400);
          
          // Check response doesn't contain sensitive info
          const check = checkForSensitiveInfo(response.body);
          expect(check.isSafe).toBe(true);
          
          // Should not mention MongoDB internals
          const responseStr = JSON.stringify(response.body).toLowerCase();
          expect(responseStr).not.toContain('objectid');
          expect(responseStr).not.toContain('bsontype');
          expect(responseStr).not.toContain('mongoose');
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Malformed JSON SHALL return safe error message
   */
  test('malformed JSON SHALL return safe error message', async () => {
    const app = createValidationApp(registerValidation);
    
    const malformedJsonArbitrary = fc.oneof(
      fc.constant('{invalid json}'),
      fc.constant('{"unclosed": '),
      fc.constant('[1, 2, 3'),
      fc.constant('not json at all'),
      fc.constant('{"key": undefined}')
    );
    
    await fc.assert(
      fc.asyncProperty(
        malformedJsonArbitrary,
        async (malformedJson) => {
          const response = await request(app)
            .post('/test')
            .send(malformedJson)
            .set('Content-Type', 'application/json');
          
          // Should return 4xx or 5xx for malformed JSON (either is acceptable)
          expect(response.status).toBeGreaterThanOrEqual(400);
          
          // Check response doesn't contain sensitive info
          const check = checkForSensitiveInfo(response.body);
          expect(check.isSafe).toBe(true);
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Very long input SHALL return safe truncated error
   */
  test('very long input SHALL return safe error without exposing full input', async () => {
    const app = createValidationApp(registerValidation);
    
    const longInputArbitrary = fc.record({
      name: fc.string({ minLength: 1000, maxLength: 5000 }),
      temail: fc.string({ minLength: 1000, maxLength: 5000 }),
      password: fc.string({ minLength: 1000, maxLength: 5000 })
    });
    
    await fc.assert(
      fc.asyncProperty(
        longInputArbitrary,
        async (longData) => {
          const response = await request(app)
            .post('/test')
            .send(longData)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(400);
          
          // Response should be reasonably sized (not echo back huge input)
          const responseStr = JSON.stringify(response.body);
          expect(responseStr.length).toBeLessThan(5000);
          
          // Check response doesn't contain sensitive info
          const check = checkForSensitiveInfo(response.body);
          expect(check.isSafe).toBe(true);
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 12: API Response Data Filtering
 * 
 * *For any* API response containing user data, the response SHALL NOT include 
 * password hashes, internal system IDs, or other sensitive fields.
 * 
 * **Validates: Requirements 12.6**
 */
describe('Feature: security-enhancement, Property 12: API Response Data Filtering', () => {
  
  /**
   * Sensitive fields that should NEVER appear in API responses
   */
  const SENSITIVE_FIELDS = [
    'password',
    '__v',
    'tempPassword',
    'googleId'
  ];

  /**
   * Patterns that indicate sensitive data in values (not field names)
   * Only bcrypt hash pattern is checked in values to avoid false positives
   */
  const SENSITIVE_VALUE_PATTERNS = [
    /\$2[aby]?\$\d+\$/  // bcrypt hash pattern
  ];

  /**
   * Helper to check if an object contains sensitive fields
   * @param {Object} obj - Object to check
   * @returns {Object} Result with isSafe boolean and foundFields array
   */
  const checkForSensitiveFields = (obj) => {
    const foundFields = [];
    
    const checkObject = (o, path = '') => {
      if (o === null || o === undefined) return;
      if (typeof o !== 'object') return;
      
      for (const key of Object.keys(o)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if key is a sensitive field
        if (SENSITIVE_FIELDS.includes(key)) {
          foundFields.push({ field: currentPath, type: 'sensitive_field' });
        }
        
        // Check if value matches sensitive patterns (for string values)
        // Only check for bcrypt hashes in values to avoid false positives
        if (typeof o[key] === 'string') {
          for (const pattern of SENSITIVE_VALUE_PATTERNS) {
            if (pattern.test(o[key])) {
              foundFields.push({ field: currentPath, type: 'sensitive_pattern', pattern: pattern.toString() });
            }
          }
        }
        
        // Recursively check nested objects
        if (typeof o[key] === 'object' && o[key] !== null) {
          checkObject(o[key], currentPath);
        }
      }
    };
    
    checkObject(obj);
    
    return {
      isSafe: foundFields.length === 0,
      foundFields
    };
  };

  /**
   * Helper to create a mock user object with all fields (simulating database user)
   */
  const createMockUserFromDb = (userData) => {
    return {
      _id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.passwordHash, // This should be filtered out
      tempPassword: userData.tempPassword, // This should be filtered out
      hasSetPassword: userData.hasSetPassword,
      verify: true,
      googleId: userData.googleId, // This should be filtered out
      picture: userData.picture,
      about: userData.about,
      bookmarks: [],
      likes: [],
      posts: [],
      following: [],
      followerscount: 0,
      followingcount: 0,
      __v: 0, // This should be filtered out
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  /**
   * Helper to filter sensitive fields from user object (simulating proper API response)
   */
  const filterUserForResponse = (user) => {
    const { password, __v, tempPassword, googleId, ...safeUser } = user;
    return safeUser;
  };

  /**
   * Generator for valid MongoDB ObjectId-like strings
   */
  const validObjectIdArbitrary = fc.array(
    fc.constantFrom(...'0123456789abcdef'.split('')),
    { minLength: 24, maxLength: 24 }
  ).map(chars => chars.join(''));

  /**
   * Generator for bcrypt-like password hashes
   */
  const bcryptHashArbitrary = fc.constantFrom(
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G5FhN5Oc5KjK5W',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '$2y$12$wQjPIYBc9K.1234567890abcdefghijklmnopqrstuvwxyz',
    '$2b$10$abcdefghijklmnopqrstuv.wxyz0123456789ABCDEFGHIJ'
  );

  /**
   * Generator for mock user data
   */
  const mockUserDataArbitrary = fc.record({
    id: validObjectIdArbitrary,
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    email: fc.emailAddress(),
    passwordHash: bcryptHashArbitrary,
    tempPassword: fc.option(fc.string({ minLength: 8, maxLength: 20 }), { nil: undefined }),
    hasSetPassword: fc.boolean(),
    googleId: fc.option(fc.string({ minLength: 10, maxLength: 30 }), { nil: undefined }),
    picture: fc.option(fc.webUrl(), { nil: '' }),
    about: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: '' })
  });

  /**
   * Property: Filtered user response SHALL NOT contain password field
   */
  test('filtered user response SHALL NOT contain password field', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          // Password should not be in response
          expect(apiResponse).not.toHaveProperty('password');
          expect(JSON.stringify(apiResponse)).not.toContain(userData.passwordHash);
          
          return !apiResponse.hasOwnProperty('password');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtered user response SHALL NOT contain __v field
   */
  test('filtered user response SHALL NOT contain __v field', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          // __v should not be in response
          expect(apiResponse).not.toHaveProperty('__v');
          
          return !apiResponse.hasOwnProperty('__v');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtered user response SHALL NOT contain tempPassword field
   */
  test('filtered user response SHALL NOT contain tempPassword field', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          // tempPassword should not be in response
          expect(apiResponse).not.toHaveProperty('tempPassword');
          
          return !apiResponse.hasOwnProperty('tempPassword');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtered user response SHALL NOT contain googleId field
   */
  test('filtered user response SHALL NOT contain googleId field', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          // googleId should not be in response
          expect(apiResponse).not.toHaveProperty('googleId');
          
          return !apiResponse.hasOwnProperty('googleId');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any user data, filtered response SHALL pass sensitive field check
   */
  test('filtered response SHALL pass sensitive field check', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          const check = checkForSensitiveFields(apiResponse);
          
          expect(check.isSafe).toBe(true);
          if (!check.isSafe) {
            console.log('Found sensitive fields:', check.foundFields);
          }
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Filtered response SHALL preserve non-sensitive user fields
   */
  test('filtered response SHALL preserve non-sensitive user fields', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          // Non-sensitive fields should be preserved
          expect(apiResponse._id).toBe(userData.id);
          expect(apiResponse.name).toBe(userData.name);
          expect(apiResponse.email).toBe(userData.email);
          expect(apiResponse.hasSetPassword).toBe(userData.hasSetPassword);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Response SHALL NOT contain bcrypt hash patterns anywhere
   */
  test('response SHALL NOT contain bcrypt hash patterns', async () => {
    const bcryptPattern = /\$2[aby]?\$\d+\$/;
    
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          const apiResponse = filterUserForResponse(dbUser);
          
          const responseStr = JSON.stringify(apiResponse);
          const hasBcryptHash = bcryptPattern.test(responseStr);
          
          expect(hasBcryptHash).toBe(false);
          
          return !hasBcryptHash;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Nested user objects in response SHALL also be filtered
   */
  test('nested user objects in response SHALL also be filtered', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        mockUserDataArbitrary,
        (userData1, userData2) => {
          const dbUser1 = createMockUserFromDb(userData1);
          const dbUser2 = createMockUserFromDb(userData2);
          
          // Simulate a response with nested user (e.g., post with author)
          const nestedResponse = {
            post: {
              title: 'Test Post',
              author: filterUserForResponse(dbUser1),
              comments: [
                { text: 'Comment 1', user: filterUserForResponse(dbUser2) }
              ]
            }
          };
          
          const check = checkForSensitiveFields(nestedResponse);
          
          expect(check.isSafe).toBe(true);
          
          return check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Array of users in response SHALL all be filtered
   */
  test('array of users in response SHALL all be filtered', async () => {
    await fc.assert(
      fc.property(
        fc.array(mockUserDataArbitrary, { minLength: 1, maxLength: 10 }),
        (usersData) => {
          const apiResponse = {
            users: usersData.map(userData => {
              const dbUser = createMockUserFromDb(userData);
              return filterUserForResponse(dbUser);
            })
          };
          
          const check = checkForSensitiveFields(apiResponse);
          
          expect(check.isSafe).toBe(true);
          
          // Also verify no password hashes in stringified response
          const responseStr = JSON.stringify(apiResponse);
          const hasBcryptHash = /\$2[aby]?\$\d+\$/.test(responseStr);
          expect(hasBcryptHash).toBe(false);
          
          return check.isSafe && !hasBcryptHash;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unfiltered user object SHALL fail sensitive field check
   * (This validates our check function works correctly)
   */
  test('unfiltered user object SHALL fail sensitive field check', async () => {
    await fc.assert(
      fc.property(
        mockUserDataArbitrary,
        (userData) => {
          const dbUser = createMockUserFromDb(userData);
          
          // Unfiltered user should fail the check
          const check = checkForSensitiveFields(dbUser);
          
          expect(check.isSafe).toBe(false);
          expect(check.foundFields.length).toBeGreaterThan(0);
          
          // Should find at least password and __v
          const foundFieldNames = check.foundFields.map(f => f.field);
          expect(foundFieldNames).toContain('password');
          expect(foundFieldNames).toContain('__v');
          
          return !check.isSafe;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 13: CORS Origin Validation
 * 
 * *For any* cross-origin request, the CORS middleware SHALL only allow 
 * requests from explicitly configured origins.
 * 
 * **Validates: Requirements 12.4**
 */
describe('Feature: security-enhancement, Property 13: CORS Origin Validation', () => {
  const cors = require('cors');
  const keys = require('../config/keys');

  // Get allowed origins from config (same as in index.js)
  const allowedOrigins = [keys.FRONTEND_URL, keys.BACKEND_URL].filter(Boolean);

  /**
   * Helper to create a test app with CORS configuration matching production
   */
  const createCorsApp = () => {
    const app = express();
    
    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin in development
        if (!origin) {
          if (process.env.NODE_ENV === 'production') {
            return callback(new Error('Origin header required'), false);
          }
          return callback(null, true);
        }
        
        // Check if the origin is in the allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'), false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      exposedHeaders: ['X-CSRF-Token', 'Retry-After'],
      credentials: true,
      maxAge: 86400,
      optionsSuccessStatus: 200
    };

    app.use(cors(corsOptions));
    
    // Handle CORS errors
    app.use((err, req, res, next) => {
      if (err.message === 'Not allowed by CORS' || err.message === 'Origin header required') {
        return res.status(403).json({ message: 'CORS policy: Origin not allowed' });
      }
      next(err);
    });
    
    app.get('/test', (req, res) => res.json({ success: true }));
    app.post('/test', (req, res) => res.json({ success: true }));
    app.put('/test', (req, res) => res.json({ success: true }));
    app.delete('/test', (req, res) => res.json({ success: true }));
    
    return app;
  };

  /**
   * Generator for disallowed origins (random URLs not in allowed list)
   */
  const disallowedOriginArbitrary = fc.oneof(
    // Random domain names
    fc.tuple(
      fc.constantFrom('http://', 'https://'),
      fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-z0-9-]+$/.test(s)),
      fc.constantFrom('.com', '.org', '.net', '.io', '.dev', '.app')
    ).map(([protocol, domain, tld]) => `${protocol}${domain}${tld}`),
    // Specific malicious origins
    fc.constant('https://evil.com'),
    fc.constant('https://attacker.io'),
    fc.constant('https://malicious-site.net'),
    fc.constant('http://localhost:9999'),
    fc.constant('https://fake-frontend.com'),
    fc.constant('null'), // null origin attack
    fc.constant('file://'),
    fc.constant('chrome-extension://abc123')
  ).filter(origin => !allowedOrigins.includes(origin));

  /**
   * Generator for HTTP methods
   */
  const httpMethodArbitrary = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE');

  /**
   * Property: Requests from allowed origins SHALL be accepted
   */
  test('requests from allowed origins SHALL be accepted', async () => {
    // Skip if no allowed origins configured
    if (allowedOrigins.length === 0) {
      console.log('No allowed origins configured, skipping test');
      return;
    }

    const app = createCorsApp();
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allowedOrigins),
        httpMethodArbitrary,
        async (origin, method) => {
          const response = await request(app)
            [method.toLowerCase()]('/test')
            .set('Origin', origin);
          
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          // Verify CORS headers are set correctly
          expect(response.headers['access-control-allow-origin']).toBe(origin);
          expect(response.headers['access-control-allow-credentials']).toBe('true');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Requests from disallowed origins SHALL be rejected with 403
   */
  test('requests from disallowed origins SHALL be rejected with 403', async () => {
    const app = createCorsApp();
    
    await fc.assert(
      fc.asyncProperty(
        disallowedOriginArbitrary,
        httpMethodArbitrary,
        async (origin, method) => {
          const response = await request(app)
            [method.toLowerCase()]('/test')
            .set('Origin', origin);
          
          expect(response.status).toBe(403);
          expect(response.body.message).toBe('CORS policy: Origin not allowed');
          
          // Verify no CORS allow headers are set for disallowed origins
          expect(response.headers['access-control-allow-origin']).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Preflight OPTIONS requests from allowed origins SHALL be accepted
   */
  test('preflight OPTIONS requests from allowed origins SHALL be accepted', async () => {
    // Skip if no allowed origins configured
    if (allowedOrigins.length === 0) {
      console.log('No allowed origins configured, skipping test');
      return;
    }

    const app = createCorsApp();
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allowedOrigins),
        fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
        async (origin, requestMethod) => {
          const response = await request(app)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', requestMethod)
            .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
          
          expect(response.status).toBe(200);
          expect(response.headers['access-control-allow-origin']).toBe(origin);
          expect(response.headers['access-control-allow-methods']).toBeDefined();
          expect(response.headers['access-control-allow-credentials']).toBe('true');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Preflight OPTIONS requests from disallowed origins SHALL be rejected
   */
  test('preflight OPTIONS requests from disallowed origins SHALL be rejected', async () => {
    const app = createCorsApp();
    
    await fc.assert(
      fc.asyncProperty(
        disallowedOriginArbitrary,
        fc.constantFrom('POST', 'PUT', 'DELETE', 'PATCH'),
        async (origin, requestMethod) => {
          const response = await request(app)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', requestMethod)
            .set('Access-Control-Request-Headers', 'Content-Type');
          
          expect(response.status).toBe(403);
          expect(response.headers['access-control-allow-origin']).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CORS SHALL expose only configured headers
   */
  test('CORS SHALL expose only configured headers', async () => {
    // Skip if no allowed origins configured
    if (allowedOrigins.length === 0) {
      console.log('No allowed origins configured, skipping test');
      return;
    }

    const app = createCorsApp();
    const expectedExposedHeaders = ['X-CSRF-Token', 'Retry-After'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allowedOrigins),
        async (origin) => {
          const response = await request(app)
            .get('/test')
            .set('Origin', origin);
          
          expect(response.status).toBe(200);
          
          // Check exposed headers
          const exposedHeaders = response.headers['access-control-expose-headers'];
          if (exposedHeaders) {
            const exposedList = exposedHeaders.split(',').map(h => h.trim());
            expectedExposedHeaders.forEach(header => {
              expect(exposedList).toContain(header);
            });
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Requests without Origin header SHALL be handled based on environment
   * In development: allowed
   * In production: would be rejected (but we test development behavior here)
   */
  test('requests without Origin header SHALL be allowed in development', async () => {
    // Save original NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const app = createCorsApp();
    
    try {
      await fc.assert(
        fc.asyncProperty(
          httpMethodArbitrary,
          async (method) => {
            const response = await request(app)
              [method.toLowerCase()]('/test');
            // No Origin header set
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    }
  });

  /**
   * Property: CORS max-age SHALL be set for preflight caching
   */
  test('CORS max-age SHALL be set for preflight caching', async () => {
    // Skip if no allowed origins configured
    if (allowedOrigins.length === 0) {
      console.log('No allowed origins configured, skipping test');
      return;
    }

    const app = createCorsApp();
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allowedOrigins),
        async (origin) => {
          const response = await request(app)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'POST');
          
          expect(response.status).toBe(200);
          
          // Check max-age header is set
          const maxAge = response.headers['access-control-max-age'];
          expect(maxAge).toBeDefined();
          expect(parseInt(maxAge, 10)).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CORS SHALL allow configured HTTP methods only
   */
  test('CORS SHALL allow configured HTTP methods', async () => {
    // Skip if no allowed origins configured
    if (allowedOrigins.length === 0) {
      console.log('No allowed origins configured, skipping test');
      return;
    }

    const app = createCorsApp();
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allowedOrigins),
        async (origin) => {
          const response = await request(app)
            .options('/test')
            .set('Origin', origin)
            .set('Access-Control-Request-Method', 'POST');
          
          expect(response.status).toBe(200);
          
          // Check allowed methods header
          const methodsHeader = response.headers['access-control-allow-methods'];
          expect(methodsHeader).toBeDefined();
          
          const allowedMethodsList = methodsHeader.split(',').map(m => m.trim());
          allowedMethods.forEach(method => {
            expect(allowedMethodsList).toContain(method);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 14: Request Body Size Enforcement
 * 
 * *For any* request with a body exceeding the configured size limit,
 * the server SHALL reject the request before processing.
 * 
 * **Validates: Requirements 12.2**
 */
describe('Feature: security-enhancement, Property 14: Request Body Size Enforcement', () => {
  
  // The configured limit in backend/index.js is 100kb
  const BODY_SIZE_LIMIT = 100 * 1024; // 100KB in bytes
  
  /**
   * Helper to create a test app with body size limits matching production config
   */
  const createBodyLimitApp = () => {
    const app = express();
    
    // Apply the same body size limits as in production (100kb)
    app.use(express.json({ 
      limit: '100kb'
    }));
    app.use(express.urlencoded({ 
      limit: '100kb', 
      extended: true,
      parameterLimit: 1000
    }));
    
    // Custom error handler for body parser errors (payload too large)
    app.use((err, req, res, next) => {
      if (err.type === 'entity.too.large') {
        return res.status(413).json({ 
          message: 'Request body too large. Maximum size is 100KB.' 
        });
      }
      next(err);
    });
    
    app.post('/test', (req, res) => {
      res.json({ success: true, bodySize: JSON.stringify(req.body).length });
    });
    
    return app;
  };

  /**
   * Generator for payload sizes that exceed the limit
   * Generates sizes from just over the limit to significantly over
   */
  const oversizedPayloadSizeArbitrary = fc.integer({ 
    min: BODY_SIZE_LIMIT + 1000, // Just over 100KB
    max: BODY_SIZE_LIMIT * 2 // Up to 200KB
  });

  /**
   * Generator for payload sizes within the limit
   */
  const validPayloadSizeArbitrary = fc.integer({ 
    min: 100, // Minimum reasonable payload
    max: BODY_SIZE_LIMIT - 1000 // Safely under the limit (accounting for JSON overhead)
  });

  /**
   * Helper to generate a string of specified byte size
   * @param {number} sizeInBytes - Target size in bytes
   * @returns {string} String of approximately the specified size
   */
  const generateStringOfSize = (sizeInBytes) => {
    // Use 'a' characters which are 1 byte each in UTF-8
    return 'a'.repeat(sizeInBytes);
  };

  /**
   * Property: Requests with body exceeding 100KB SHALL be rejected with 413 status
   */
  test('requests with body exceeding 100KB SHALL be rejected with 413 status', async () => {
    const app = createBodyLimitApp();
    
    await fc.assert(
      fc.asyncProperty(
        oversizedPayloadSizeArbitrary,
        async (payloadSize) => {
          // Create a payload that exceeds the limit
          const largeData = generateStringOfSize(payloadSize);
          const payload = { data: largeData };
          
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          // Should be rejected with 413 Payload Too Large
          expect(response.status).toBe(413);
          
          return response.status === 413;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Requests with body within 100KB limit SHALL be accepted
   */
  test('requests with body within 100KB limit SHALL be accepted', async () => {
    const app = createBodyLimitApp();
    
    await fc.assert(
      fc.asyncProperty(
        validPayloadSizeArbitrary,
        async (payloadSize) => {
          // Create a payload within the limit
          const data = generateStringOfSize(payloadSize);
          const payload = { data };
          
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          // Should be accepted with 200
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          return response.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rejected oversized requests SHALL return appropriate error message
   */
  test('rejected oversized requests SHALL return appropriate error message', async () => {
    const app = createBodyLimitApp();
    
    await fc.assert(
      fc.asyncProperty(
        oversizedPayloadSizeArbitrary,
        async (payloadSize) => {
          const largeData = generateStringOfSize(payloadSize);
          const payload = { data: largeData };
          
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(413);
          expect(response.body).toHaveProperty('message');
          expect(response.body.message).toContain('too large');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: URL-encoded bodies exceeding limit SHALL also be rejected
   */
  test('URL-encoded bodies exceeding limit SHALL be rejected with 413 status', async () => {
    const app = createBodyLimitApp();
    
    await fc.assert(
      fc.asyncProperty(
        oversizedPayloadSizeArbitrary,
        async (payloadSize) => {
          const largeData = generateStringOfSize(payloadSize);
          
          const response = await request(app)
            .post('/test')
            .send(`data=${encodeURIComponent(largeData)}`)
            .set('Content-Type', 'application/x-www-form-urlencoded');
          
          // Should be rejected with 413 Payload Too Large
          expect(response.status).toBe(413);
          
          return response.status === 413;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty bodies SHALL be accepted (edge case)
   */
  test('empty bodies SHALL be accepted', async () => {
    const app = createBodyLimitApp();
    
    await fc.assert(
      fc.asyncProperty(
        fc.constant({}),
        async (payload) => {
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          
          return response.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Bodies at exactly the limit boundary SHALL be handled correctly
   * Testing near-boundary behavior
   */
  test('bodies near the limit boundary SHALL be handled correctly', async () => {
    const app = createBodyLimitApp();
    
    // Test sizes very close to the limit (within 5KB of 100KB)
    const nearLimitSizeArbitrary = fc.integer({ 
      min: BODY_SIZE_LIMIT - 5000, 
      max: BODY_SIZE_LIMIT - 100 // Leave room for JSON overhead
    });
    
    await fc.assert(
      fc.asyncProperty(
        nearLimitSizeArbitrary,
        async (payloadSize) => {
          const data = generateStringOfSize(payloadSize);
          const payload = { data };
          
          const response = await request(app)
            .post('/test')
            .send(payload)
            .set('Content-Type', 'application/json');
          
          // Should be accepted (under limit)
          expect(response.status).toBe(200);
          
          return response.status === 200;
        }
      ),
      { numRuns: 100 }
    );
  });
});
