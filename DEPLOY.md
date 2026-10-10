# Deploying AssignAI (get a shareable link)

AssignAI runs as **one container** that serves the website and runs the background worker. It keeps its data
(the SQLite database and uploaded ZIPs) in **`/data`**, so the host must give it a **persistent disk** there.
Without one, all data is lost on every restart or redeploy.

Every option below gives you an `https://…` link you can share with faculty and students.

## What you need

- This repository on GitHub
- An Anthropic API key (optional, but needed for real AI generation and marking)
- A first faculty email and a strong password, used to create the first account on first start

## Option A: Render (easiest)

1. Merge the pull request (or deploy from the `claude/gifted-noether-50zluf` branch).
2. Sign in at [render.com](https://render.com) with GitHub.
3. Click **New → Blueprint** and pick this repository. Render reads `render.yaml`, builds the `Dockerfile`, and attaches a 1 GB disk at `/data`.
4. When asked, fill in:
   - `ANTHROPIC_API_KEY`: your key
   - `SEED_FACULTY_EMAIL`: e.g. `hod@yourcollege.edu`
   - `SEED_FACULTY_PASSWORD`: a strong password (8+ characters, upper and lower case, and a number)
5. Click **Apply**. The first build takes a few minutes. Your link is shown at the top of the service page, e.g. `https://assignai-xxxx.onrender.com`.

Persistent disks need a paid Render instance (the `starter` plan in `render.yaml`). Free instances have no disk.

## Option B: Railway

1. At [railway.com](https://railway.com): **New Project → Deploy from GitHub repo**, then pick this repository. Railway detects the `Dockerfile`.
2. In the service, open **Settings → Volumes**, add a volume, and set its mount path to `/data`.
3. Under **Variables**, add `ANTHROPIC_API_KEY`, `SEED_FACULTY_EMAIL`, and `SEED_FACULTY_PASSWORD`.
4. Under **Settings → Networking**, click **Generate Domain** to get your link.

## Option C: Any server with Docker (college server, cloud VM)

```bash
git clone -b claude/gifted-noether-50zluf https://github.com/PanktiMscIt2025/ClaudeCode.git assignai
cd assignai
docker build -t assignai .
docker run -d --name assignai --restart unless-stopped \
  -p 3000:3000 \
  -v assignai-data:/data \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e SEED_FACULTY_EMAIL=hod@yourcollege.edu \
  -e SEED_FACULTY_PASSWORD='A-Strong-Pass-2026' \
  assignai
```

Put it behind HTTPS (for example Caddy or nginx with a certificate). Login cookies are marked *Secure* in production, so
browsers only send them over HTTPS. If you must serve plain HTTP on a closed campus network, add `-e COOKIE_SECURE=false`.

## After the first deploy

1. Open your link, click **Sign in → Faculty**, and sign in with `SEED_FACULTY_EMAIL` / `SEED_FACULTY_PASSWORD`.
2. Create a course, import your class Excel file, and download the credentials sheet for students.
3. Share the same link with students. They sign in with their enrollment number and temporary password.

## How the container starts

`scripts/docker-start.sh` runs on every start:
1. It applies any new database migrations (safe to repeat).
2. It creates the faculty account from `SEED_FACULTY_*` if it doesn't exist yet. It never changes an existing account.
3. It starts the server on `$PORT` (default 3000).

Settings you can override: `PORT`, `DATABASE_URL` (default `file:/data/assignai.db`), `STORAGE_DIR` (default
`/data/storage`), `ANTHROPIC_MODEL`, `MAX_ZIP_MB`, `KEEP_SUBMISSION_FILES`, and `COOKIE_SECURE`.

Back up by copying `/data` (the database file and the `storage` folder).
Run **one** instance only: the login rate limiter and the job worker live inside the server process.
