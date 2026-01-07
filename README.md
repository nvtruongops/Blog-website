# Blog Website

A full-stack blog application built with Next.js and Express.js.

## Tech Stack

**Frontend:** Next.js 14, React 18, Redux Toolkit, Axios

**Backend:** Express.js, MongoDB, Mongoose, Passport.js (Google OAuth)

## Features

- User authentication (Email/Password, Google OAuth)
- Create, edit, delete blog posts
- Rich text editor
- User profiles
- Email verification
- Password reset

## Project Structure

```
├── backend/          # Express.js API server
│   ├── controllers/  # Route handlers
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   └── helper/       # Utility functions
│
└── client/           # Next.js frontend
    └── src/
        ├── app/          # Pages (App Router)
        ├── components/   # React components
        ├── lib/          # API utilities
        └── store/        # Redux store
```

## Setup

1. Clone the repository
2. Copy environment files:
   ```
   cp backend/.env.example backend/.env
   cp client/.env.local.example client/.env.local
   ```
3. Configure environment variables
4. Install dependencies:
   ```
   cd backend && npm install
   cd client && npm install
   ```
5. Start MongoDB
6. Run the application:
   ```
   # Backend (port 5002)
   cd backend && npm start
   
   # Frontend (port 3000)
   cd client && npm run dev
   ```

## License

MIT
