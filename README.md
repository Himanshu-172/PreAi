# PrepAI - AI Interview Preparation Platform

PrepAI is a full-stack interview preparation application for students and early-career developers. It combines practice question tracking, resume analysis, mock interview workflows, AI chat assistance, and progress analytics in one portfolio-ready web app.

The main purpose is to help users prepare for technical placements and software engineering interviews across DSA, SQL, aptitude, resume review, and mock interview practice.

## Features

- Authentication with register, login, JWT-protected sessions, and current-user lookup.
- DSA Practice with saved progress, favorites, notes, filtering, sorting, and pagination.
- SQL Practice with curated SQL questions, saved progress, favorites, notes, filters, and question detail pages.
- Aptitude Practice with placement-style aptitude questions, saved progress, favorites, notes, and quick review content.
- Search, filtering, sorting, and pagination across practice question lists.
- Resume Analyzer with PDF upload, extracted text processing, and AI-backed analysis.
- AI Mock Interview with generated interview sessions, answer capture, completion, and AI evaluation.
- AI Chatbot for interview preparation, resume, DSA, SQL, aptitude, and career-prep questions.
- Analytics Dashboard covering practice progress, resume activity, mock interviews, and chat activity.
- Profile & Settings with profile updates and password changes.

## Tech Stack

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

Backend:

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose

AI:

- Ollama
- OpenAI support

## Project Structure

```text
prepai/
  client/
    src/
      data/
      hooks/
      pages/
      services/
    .env.example
    package.json
  server/
    scripts/
      seedQuestions.ts
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      validators/
    .env.example
    package.json
  package.json
  README.md
  .gitignore
```

## Local Development Setup

Clone the repository:

```bash
git clone <repository-url>
cd prepai
```

Install dependencies from the project root:

```bash
npm install
```

Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Update `server/.env` with your local MongoDB connection string and a development JWT secret. Do not commit `.env` files.

Start the frontend:

```bash
npm run dev:client
```

Start the backend:

```bash
npm run dev:server
```

Or run both from the root:

```bash
npm run dev
```

Build both workspaces:

```bash
npm run build
```

Other useful scripts:

```bash
npm run build:client
npm run build:server
npm run seed
```

## Environment Variables

Client development variables from `client/.env.example`:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

For local development, the frontend uses this API base URL when configured. If it is not configured in development, the client falls back to `http://localhost:5000/api`.

Client production variables:

```text
VITE_API_BASE_URL=https://<your-backend-host>/api
```

In production builds, `VITE_API_BASE_URL` is required. It must be an absolute HTTP or HTTPS URL and must not point to localhost or loopback addresses.

Server development variables from `server/.env.example`:

```text
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/prepai
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=7d
AI_PROVIDER=ollama
AI_RESUME_ANALYSIS_MAX_CHARS=12000
OPENAI_API_KEY=replace-with-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REQUEST_TIMEOUT_MS=30000
OPENAI_RESUME_ANALYSIS_MAX_CHARS=12000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_REQUEST_TIMEOUT_MS=30000
```

Server production variables:

```text
MONGODB_URI=<mongodb-atlas-uri>
CLIENT_URL=https://<your-frontend-host>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
AI_PROVIDER=ollama
AI_RESUME_ANALYSIS_MAX_CHARS=12000
OLLAMA_BASE_URL=<reachable-ollama-url>
OLLAMA_MODEL=llama3.1:8b
OLLAMA_REQUEST_TIMEOUT_MS=30000
```

If using OpenAI instead of Ollama, set:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REQUEST_TIMEOUT_MS=30000
```

Never put real secrets, database credentials, JWT secrets, or API keys in the README or in committed files.

## Database Setup

PrepAI stores users, progress, questions, resumes, mock interviews, and chat history in MongoDB through Mongoose models.

For local development, run MongoDB locally and set:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/prepai
```

For production, use MongoDB Atlas and set `MONGODB_URI` to the Atlas connection string in the backend hosting environment.

Practice questions are stored in MongoDB and must be seeded explicitly:

```bash
npm run seed
```

The current seed data contains:

- DSA: 50
- SQL: 50
- Aptitude: 100
- Total: 200

Seeding is an explicit command. It does not run automatically on server startup.

## AI Setup

Local development is configured for Ollama by default:

```text
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

Install and run Ollama locally, then make sure the configured model is available. With the default config, the backend sends AI requests to Ollama at `http://localhost:11434`.

Cloud deployment normally cannot reach Ollama running on a developer laptop at localhost. In a cloud backend, `localhost` refers to the cloud runtime, not the developer machine. For deployed AI features with Ollama, `OLLAMA_BASE_URL` must point to an Ollama service reachable by the backend.

OpenAI is also supported by the current backend through `AI_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, and `OPENAI_REQUEST_TIMEOUT_MS`. Do not configure OpenAI unless you intend to use that provider.

AI features are not currently claimed as publicly deployed.

## API Overview

The Express app mounts these API route groups:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/health`
- `GET /api/analytics`
- `GET /api/profile`
- `PATCH /api/profile`
- `PATCH /api/profile/password`
- `GET /api/questions`
- `GET /api/questions/:id`
- `GET /api/progress`
- `POST /api/progress`
- `PATCH /api/progress/:questionId`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/:questionId`
- `GET /api/notes`
- `POST /api/notes`
- `PATCH /api/notes/:questionId`
- `POST /api/resume/upload`
- `GET /api/resume/history`
- `POST /api/resume/:id/analyze`
- `GET /api/resume/:id`
- `POST /api/mock-interviews`
- `GET /api/mock-interviews`
- `GET /api/mock-interviews/:id`
- `PATCH /api/mock-interviews/:id/answer`
- `POST /api/mock-interviews/:id/complete`
- `POST /api/mock-interviews/:id/evaluate`
- `POST /api/chat`
- `GET /api/chat`
- `GET /api/chat/:id`
- `PATCH /api/chat/:id`
- `DELETE /api/chat/:id`

Health check:

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

## Production Deployment Preparation

Planned deployment architecture:

```text
Vercel frontend
  -> Render backend
      -> MongoDB Atlas
```

Recommended production setup:

- Build the frontend with `npm run build:client`.
- Host `client/dist` on Vercel.
- Build the backend with `npm run build:server`.
- Start the backend with `npm run start --workspace server`.
- Configure backend environment variables on Render.
- Configure frontend `VITE_API_BASE_URL` on Vercel.
- Seed MongoDB Atlas explicitly with `npm run seed` after backend/database environment variables are configured.

Deployment configuration has not yet been added to the repository. There are no Dockerfiles or platform config files committed for Vercel, Render, or MongoDB Atlas.

## Security Notes

- Authentication uses JWTs.
- Passwords are hashed before storage.
- Protected API routes use authentication middleware.
- User-owned resources are queried by authenticated user ID.
- Resume extracted text is used internally for analysis and is not returned unnecessarily by resume API responses.
- Rate limiting is applied to authentication, resume upload, AI chat, and mock interview evaluation routes.
- Production environment validation requires critical secrets and provider configuration.
- Production API URL validation rejects localhost and loopback API URLs.
- Production HTTP error responses are sanitized.
- Keep `.env` files, database credentials, JWT secrets, and API keys out of Git.

## Current Project Status

Implemented:

- Full-stack React/Vite frontend and Express/MongoDB backend.
- Authentication and protected routes.
- DSA, SQL, and Aptitude practice modules.
- Question seeding for 200 practice questions.
- User progress, favorites, notes, search/filter/sort/pagination.
- Resume upload and AI analysis workflow.
- Mock interview creation, answer tracking, completion, and AI evaluation.
- AI chatbot with conversation history.
- Analytics dashboard.
- Profile and password settings.
- Production hardening for environment validation, rate limiting, API URL validation, and sanitized production errors.

Remaining before deployment:

- Add deployment-specific configuration or platform setup instructions as needed.
- Create MongoDB Atlas database and production database user.
- Configure Vercel and Render environment variables.
- Run the explicit production seed step against Atlas.
- Decide whether deployed AI features will use a reachable Ollama service or remain local-demo only.
