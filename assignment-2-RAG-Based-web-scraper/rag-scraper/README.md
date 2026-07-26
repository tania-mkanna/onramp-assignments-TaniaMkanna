# Distributed RAG-Based Web Scraper

This project lets a user:
- submit any website URL for crawling
- process and index the crawled content
- ask natural-language questions against the indexed site content
- receive a grounded response with source citations

## Tech Stack
- Node.js + TypeScript
- PostgreSQL + pgvector
- Redis + BullMQ
- Playwright + axios
- Prisma
- React + Vite
- Docker Compose

## Before You Start

Install these tools on the new computer:

1. Node.js 20 or newer
2. npm 10 or newer
3. Docker Desktop
4. Git

Important:
- Do not use Node 18 for this repo. Some dependencies in this project require Node 20+.
- Start Docker Desktop before running any Docker commands.

## Step 1: Clone the project

```powershell
git clone <YOUR_REPOSITORY_URL>
cd rag-scraper
```

If you copied the project manually instead of cloning, just open the `rag-scraper` folder in a terminal.

## Step 2: Create the environment file

Create a file named `.env` in the project root.

Example `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rag_scraper
REDIS_HOST=localhost
REDIS_PORT=6379
API_PORT=4000
OPENAI_API_KEY=
```

Notes:
- `OPENAI_API_KEY` is optional.
- If `OPENAI_API_KEY` is empty, the project still works using fallback embeddings and fallback answer generation.
- Keep `DATABASE_URL` exactly as above if you use the included Docker Compose setup.

## Step 3: Install dependencies

Install the backend workspace dependencies from the project root:

```powershell
npm install
```

Then install the UI dependencies separately:

```powershell
Set-Location ui
npm install
Set-Location ..
```

Why two installs:
- the root workspace currently installs `api`, `scraper`, `processor`, `rag`, and `shared`
- the `ui` package is separate and must be installed directly

If install fails:
- verify Node is 20+
- verify internet access to npm registry
- close and reopen the terminal after changing Node versions

Check versions:

```powershell
node -v
npm -v
```

## Step 4: Start PostgreSQL and Redis

Start the database and Redis first:

```powershell
docker compose up -d postgres redis
```

Check that both containers are running:

```powershell
docker compose ps
```

You should see:
- `postgres`
- `redis`

## Step 5: Apply Prisma migrations and generate the client

Run these commands from the project root:

```powershell
npx prisma generate --schema=shared/prisma/schema.prisma
npx prisma migrate deploy --schema=shared/prisma/schema.prisma
```

This creates the Prisma client and applies all existing database migrations.

## Step 6: Start the crawl workers

Start the worker containers:

```powershell
docker compose up --build -d crawl-worker processing-worker
```

If you want multiple crawl workers for distributed crawling:

```powershell
docker compose up --build -d --scale crawl-worker=3 --scale processing-worker=2
```

Notes:
- `crawl-worker` fetches pages and stores raw HTML
- `processing-worker` cleans, processes, chunks, and indexes content
- keep at least one `processing-worker` running, otherwise the processing queue will not be consumed

Check worker logs if needed:

```powershell
docker compose logs -f crawl-worker
docker compose logs -f processing-worker
```

## Step 7: Start the API

Open a new terminal in the project root and run:

```powershell
npm run dev --workspace api
```

The API should start on:

```text
http://localhost:4000
```

Health endpoint:

```text
http://localhost:4000/api/health
```

## Step 8: Start the UI

Open another terminal and run:

```powershell
Set-Location ui
npm run dev
```

Vite will print the local UI URL, usually:

```text
http://localhost:5173
```

## Step 9: Use the app

1. Open the UI in the browser
2. Enter a website URL
3. Click `Start scraping`
4. Wait until the crawl status shows progress and the `Processed` / `Chunks` counters begin increasing
5. Enter a question about the crawled website
6. Click `Ask question`
7. Read the answer and check the returned source citations

## API Endpoints

The current API exposes:

- `GET /api/health`
- `POST /api/crawl/dispatch`
- `GET /api/crawl/sessions/:sessionId`
- `GET /api/websites`
- `GET /api/websites/:websiteId/pages`
- `POST /api/ask`

## Recommended Startup Order

Every time you want to run the project on a new machine, use this order:

1. Start Docker Desktop
2. `docker compose up -d postgres redis`
3. `npx prisma generate --schema=shared/prisma/schema.prisma`
4. `npx prisma migrate deploy --schema=shared/prisma/schema.prisma`
5. `docker compose up --build -d crawl-worker processing-worker`
6. `npm run dev --workspace api`
7. `cd ui ; npm run dev`

## Stop the project

Stop the UI and API with `Ctrl+C` in their terminals.

Stop Docker services:

```powershell
docker compose down
```

If you also want to remove volumes:

```powershell
docker compose down -v
```

Warning:
- `docker compose down -v` deletes the local Postgres data volume.

## Troubleshooting

### `npm install` fails
- Make sure you are using Node 20+
- Retry after checking network access
- Run installs separately:

```powershell
npm install
Set-Location ui
npm install
```

### UI cannot reach backend
Make sure the API is running on port `4000`.

The UI currently calls:

```text
http://localhost:4000/api
```

This is configured in `ui/src/services/api.ts`.

### Crawl starts but RAG answers stay empty
Check that:
- `processing-worker` is running
- Postgres migrations were applied
- crawl session counters are increasing
- `Processed` and `Chunks` counters are not zero

### Dynamic websites are not scraping correctly
Use `DYNAMIC` mode so the crawler can use Playwright.

### OpenAI key is missing
The system still works without `OPENAI_API_KEY`, but answers will use fallback embeddings and simpler answer generation.

## Project Structure

- `scraper/`: distributed crawling and job queue logic
- `processor/`: HTML cleaning and processed document creation
- `rag/`: chunking, embeddings, retrieval, answer generation
- `shared/`: Prisma schema, repositories, shared utilities
- `api/`: HTTP endpoints
- `ui/`: frontend application
- `docker/`: container build files

## Quick Start Summary

```powershell
npm install
Set-Location ui
npm install
Set-Location ..
docker compose up -d postgres redis
npx prisma generate --schema=shared/prisma/schema.prisma
npx prisma migrate deploy --schema=shared/prisma/schema.prisma
docker compose up --build -d --scale crawl-worker=3 --scale processing-worker=2
npm run dev --workspace api
```

Then in another terminal:

```powershell
Set-Location ui
npm run dev
```
