# Perception

Perception is a small social backend API. It lets users register, log in, create posts, comment, like posts, follow other users, and fetch a feed.

## What It Does

- Auth: register and log in
- Social graph: follow and unfollow users
- Content: create, update, delete, and list posts
- Reactions: like and unlike posts
- Discussion: create, update, delete, and list comments
- Feed: fetch general and follow-based feeds

## Tech Used

- TypeScript
- Node.js
- Express
- Prisma
- PostgreSQL
- Zod
- JWT auth with signed cookies
- Vitest and Supertest for tests

## Basics

Required environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` (optional, defaults to `3000`)

Run commands:

```bash
npm install
npm run dev
npm test
npm run build
npm start
```

Base API prefix:

```text
/api/v1
```
