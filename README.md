# PrepAI - AI Interview Preparation Platform

PrepAI is a full-stack foundation for an AI interview preparation platform.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose

## Project Structure

```text
prepai/
  client/
  server/
  README.md
  .gitignore
```

## Setup

Install dependencies from the project root:

```bash
npm install
```

Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Update `server/.env` with your MongoDB connection string.

## Development

Run the frontend:

```bash
npm run dev:client
```

Run the backend:

```bash
npm run dev:server
```

Or run both from the root:

```bash
npm run dev
```

## Build Checks

```bash
npm run build
```

## API Health Check

After starting the backend, visit:

```text
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "PrepAI API is running"
}
```
