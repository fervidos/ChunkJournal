# ChunkJournal

A clean, minimal Minecraft world journal for organizing and viewing screenshots.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Storage**: S3-compatible (Cloudflare R2, MinIO, Backblaze B2)
- **Styling**: Tailwind CSS v4

## Setup

1. Clone and install:
   ```bash
   npm install
   ```

2. Copy env vars:
   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` with your PostgreSQL connection string and S3 credentials.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start dev server:
   ```bash
   npm run dev
   ```

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/worlds` | List worlds |
| POST | `/api/worlds` | Create world |
| GET | `/api/screenshots` | List screenshots (query: `world`, `tag`, `search`, `sort`, `page`, `limit`) |
| POST | `/api/upload` | Upload screenshot (multipart form with `file`) |
| GET | `/api/screenshots/[id]` | Get screenshot details |
| PATCH | `/api/screenshots/[id]` | Update screenshot metadata |
| DELETE | `/api/screenshots/[id]` | Delete screenshot |
| GET | `/api/screenshots/[id]/download` | Download/stream image from S3 |
