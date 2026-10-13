# Deploying AssignAI (get a shareable link)

AssignAI runs as **one container** that serves the website and runs the background worker. All data (accounts,
courses, assignments, marks, and uploaded ZIPs) is kept in a **PostgreSQL database**. The container itself stores
nothing, so free hosts that sleep, restart, or redeploy the app lose no data.

The recommended free setup needs no credit card:

- **Database:** [Neon](https://neon.tech), a free PostgreSQL database that doesn't expire
- **App:** [Hugging Face Spaces](https://huggingface.co/spaces), free Docker hosting with an `https://…hf.space` link

## Step 1: Create the free database (Neon)

1. Sign up at [neon.tech](https://neon.tech). Signing in with Google or GitHub is fine.
2. Create a project. Name it `assignai` and pick the region closest to you (e.g. *AWS Asia Pacific (Singapore)*).
3. On the project dashboard, click **Connect**. Copy the **connection string**. It starts with `postgresql://` and
   ends with `?sslmode=require…`. Keep it private, because it is the database password.

## Step 2: Create the app (Hugging Face Spaces)

1. Sign up at [huggingface.co](https://huggingface.co/join).
2. Go to **New Space** (<https://huggingface.co/new-space>):
   - **Space name:** `assignai`
   - **SDK:** **Docker**, template **Blank**
   - **Hardware:** **CPU basic (free)**
   - **Visibility:** **Public**. The code is public but your data isn't: it lives in Neon, behind the login.
     Private Spaces can't be opened by students.
   - Click **Create Space**.
3. Open the Space's **Settings → Variables and secrets** and add these as **New secret**:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from Step 1 |
   | `SEED_FACULTY_EMAIL` | your email, used as the faculty login |
   | `SEED_FACULTY_PASSWORD` | a strong password (8+ characters, upper and lower case, and a number) |
   | `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` | optional: an AI key. Leave it out for offline mode. |

4. Upload the code. Download this repository as a ZIP from GitHub (**Code → Download ZIP**) and unzip it. In the
   Space, open the **Files** tab, then **+ Contribute → Upload files**. Drag in **everything inside** the unzipped folder: the files and
   folders such as `app`, `prisma`, `Dockerfile`, and `README.md`, not the folder itself. Then click **Commit**.
5. The Space builds automatically, which takes about 5–10 minutes. Watch it under **Logs**. It's ready when the status
   says **Running** and the log shows `✓ Ready`.

Your link is **`https://<your-username>-assignai.hf.space`**. You can also find it under **⋮ → Embed this Space →
Direct URL**. Use this direct link, not the `huggingface.co/spaces/…` page: the page shows the app inside a frame,
where browsers block the login cookie.

Sign in on the **Faculty** tab with `SEED_FACULTY_EMAIL` / `SEED_FACULTY_PASSWORD`, then share the same link with
students.

**Free-tier notes**
- A free Space sleeps after 48 hours without visitors. The next visit wakes it in about a minute, and all data is still there.
- Neon's free plan stores 0.5 GB. Uploaded ZIPs are deleted once their marks are approved, so this is plenty for
  typical classes. Approve marks regularly, and keep `KEEP_SUBMISSION_FILES` off.
- To update the app later, upload the changed files again. The Space rebuilds, and the database is kept.

## Other hosts

The same container runs anywhere Docker runs. Set `DATABASE_URL` (plus the seed and optional AI variables) and
expose port 3000 (or set `PORT`).

**Render:** click **New → Blueprint**, pick this repository, and fill in the variables. `render.yaml` uses the free
instance type. Free Render apps sleep after 15 minutes idle and take about a minute to wake; no data is lost.

**Any server with Docker:**

```bash
git clone https://github.com/PanktiMscIt2025/ClaudeCode.git assignai
cd assignai
docker build -t assignai .
docker run -d --name assignai --restart unless-stopped -p 3000:3000 \
  -e DATABASE_URL='postgresql://user:password@host/db?sslmode=require' \
  -e SEED_FACULTY_EMAIL=hod@yourcollege.edu \
  -e SEED_FACULTY_PASSWORD='A-Strong-Pass-2026' \
  assignai
```

Put it behind HTTPS (for example Caddy or nginx). Login cookies are marked *Secure* in production, so browsers only
send them over HTTPS. If you must serve plain HTTP on a closed campus network, add `-e COOKIE_SECURE=false`.

## How the container starts

`scripts/docker-start.sh` runs on every start:
1. It applies any new database migrations (safe to repeat). For a Neon pooled connection string, migrations
   automatically use the matching direct connection. Set `DIRECT_URL` to override.
2. It creates the faculty account from `SEED_FACULTY_*` if it doesn't exist yet. It never changes an existing account.
3. It starts the server on `$PORT` (default 3000).

Settings you can override: `PORT`, `GEMINI_MODEL`, `ANTHROPIC_MODEL`, `AI_PROVIDER`, `MAX_ZIP_MB`,
`KEEP_SUBMISSION_FILES`, and `COOKIE_SECURE`.

Back up by exporting the database (Neon keeps automatic history; `pg_dump` works too).
Run **one** instance only: the login rate limiter and the job worker live inside the server process.
