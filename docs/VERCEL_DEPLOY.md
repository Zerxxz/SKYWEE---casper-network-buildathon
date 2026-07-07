# Vercel Deployment Guide — SKYWEE

Deploy the Next.js frontend to Vercel. Smart contracts are already live
on Casper testnet (see `contracts.deployed.json`).

## Prerequisites

1. **GitHub repo** — already at https://github.com/Zerxxz/SKYWEE---casper-network-buildathon
2. **Vercel account** — https://vercel.com (free Hobby tier works)
3. **Postgres database** — Vercel's filesystem is read-only, so SQLite
   won't work. Choose one:
   - **Neon** (recommended, free tier, best Prisma support): https://neon.tech
   - **Vercel Postgres** (integrated but limited free tier): https://vercel.com/docs/storage/vercel-postgres
   - **Supabase** (free tier, includes auth): https://supabase.com
4. **CSPR.cloud API token** — for RPC access (https://cspr.cloud → Account → API Tokens)

## Step-by-step

### Step 1: Set up Postgres database

**Option A: Neon (recommended)**

1. Go to https://neon.tech → Sign up (free, no credit card)
2. Create a new project → name it `skywee`
3. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/skywee?sslmode=require
   ```
4. Save this — you'll need it for Vercel env vars

**Option B: Vercel Postgres**

1. In Vercel dashboard → your project → Storage → Create → Postgres
2. Copy the `DATABASE_URL` from the connection details

### Step 2: Switch Prisma schema to Postgres

```bash
# Replace the SQLite schema with the Postgres version
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Set DATABASE_URL to your Postgres connection
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/skywee?sslmode=require"

# Create tables in your Postgres DB
npx prisma db push

# Verify
npx prisma studio  # should open browser with empty tables
```

### Step 3: Seed the database (optional, for demo data)

```bash
# Set DATABASE_URL to your Postgres connection string
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/skywee?sslmode=require"

# Run the seed script
bun run seed
```

### Step 4: Import the project to Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repo: `Zerxxz/SKYWEE---casper-network-buildathon`
3. **Framework Preset**: Next.js (auto-detected)
4. **Build Command**: `next build` (from `vercel.json`, overrides `package.json` build)
5. **Output Directory**: `.next` (auto-detected)
6. **Install Command**: `bun install` (from `vercel.json`)

### Step 5: Set environment variables in Vercel

In Vercel dashboard → your project → Settings → Environment Variables,
add ALL of these (values from `.env.local.example`):

| Key | Value | Environments |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (from Step 1) | Production, Preview, Development |
| `CASPER_NETWORK` | `testnet` | All |
| `CASPER_RPC_URL` | `https://node.testnet.cspr.cloud/rpc` | All |
| `CASPER_NETWORK_NAME` | `casper-test` | All |
| `CASPER_CHAIN_NAME` | `casper-test` | All |
| `CSPR_CLOUD_AUTH_TOKEN` | `your_cspr_cloud_bearer_token` | All |
| `CONTRACT_AGENT_REGISTRY` | `hash-8ddaf7548dfc4505aed7a62a3d4c3fa4936ab8797771988cc6d560eed99b3ded` | All |
| `CONTRACT_INSURANCE` | `hash-b4d195a93712eb2f801549901756b1accb899b8f76d27bff57162ffec3d92b06` | All |
| `CONTRACT_TREASURY` | `hash-45e1049d82b95dd82119c7462f2d90a4bbf5f1978e3336cf6ba3437f7540bcee` | All |
| `CONTRACT_RWA_VAULT` | `hash-4898c97682442a9929e36b735cd645f42aa489540f07e9061f117e3f4cc50b21` | All |
| `CONTRACT_CARBON_GUARD` | `hash-3cbe0c274dd0728cf626c26aad333647b657d6ab0548aef983688271fffed63f` | All |

All contract hashes are pre-filled in `.env.local.example` — copy from there.

### Step 6: Deploy

Click **Deploy** in Vercel. Build takes ~2-3 minutes.

Vercel will:
1. Run `bun install`
2. Run `postinstall` script → `prisma generate`
3. Run `next build` (from `vercel.json` buildCommand)
4. Deploy serverless functions for each API route

### Step 7: Verify deployment

1. Visit `https://your-project.vercel.app`
2. Open the AgentSquare page — should show seeded agents
3. Try registering a new agent (needs Casper Wallet browser extension)
4. Check the deploy hash on https://testnet.cspr.live

## Gotchas & Limitations

### 1. Serverless function timeout

Vercel Hobby plan: **10 seconds** max per API route call (60s with `maxDuration` config).
Pro plan: up to **300 seconds**.

SKYWEE API routes that poll Casper RPC (deploy status) are configured for
60s in `vercel.json`. Casper testnet block time is ~16s, so 60s covers
~3 blocks — enough for deploy confirmation.

If you need longer polling (e.g., waiting for slow deploys), upgrade to
Pro plan and increase `maxDuration` in `vercel.json`.

### 2. No SSE (Server-Sent Events) support

Vercel serverless functions don't support long-lived SSE connections.
The `/api/skywee/deploys/[hash]` route polls Casper RPC instead of
using SSE — this works on Vercel.

If you add SSE-based features later, use client-side polling instead
(fetch every 5s from the browser).

### 3. No persistent filesystem

Vercel's filesystem is **read-only** except `/tmp` (ephemeral, lost on
cold start). This is why SQLite doesn't work — you MUST use Postgres.

The `upload/` directory (for file uploads) won't persist either. Use
Vercel Blob Storage or an S3-compatible service for file uploads.

### 4. Cold start latency

First request after idle takes ~1-2s (serverless cold start).
Subsequent requests are fast (<100ms). This is normal for serverless.

For demo purposes, this is fine. For production with heavy traffic,
consider Vercel's Edge Functions or a persistent server (VPS).

### 5. CSPR.cloud auth proxy NOT needed on Vercel

The `scripts/cspr-auth-proxy.py` is only needed for `casper-client` CLI
(which has no `--header` flag). On Vercel, the Next.js API routes use
`casper-js-sdk`'s `HttpHandler.setCustomHeaders()` to inject the
`Authorization: Bearer` header directly — no proxy needed.

### 6. Secret key management

The deploy scripts (`scripts/deploy-casper-client.sh`,
`contracts/odra/bin/deploy.rs`) need a `.pem` secret key file. On Vercel,
these scripts don't run (they're for local contract deployment only).
Contract deployment is already done — see `contracts.deployed.json`.

If you need server-side signing (e.g., for agent seeder automation),
store the secret key as a Vercel environment variable (base64-encoded)
and decode it at runtime. This is less secure than a file — use with
caution.

## Local development (unchanged)

Local dev still works with SQLite:

```bash
# Use SQLite schema (default)
# prisma/schema.prisma is already set to sqlite

# Set DATABASE_URL for local SQLite
export DATABASE_URL="file:./db/custom.db"

# Create local DB
npx prisma db push

# Seed
bun run seed

# Run dev server
bun run dev
```

## Switching between SQLite (local) and Postgres (Vercel)

The `prisma/schema.prisma` file uses `provider = "sqlite"` by default
for local dev. Before deploying to Vercel, switch to Postgres:

```bash
# Switch to Postgres
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Set DATABASE_URL to your Postgres connection
export DATABASE_URL="postgresql://..."

# Push schema to Postgres
npx prisma db push

# Commit the change
git add prisma/schema.prisma
git commit -m "chore: switch Prisma to Postgres for Vercel deploy"
git push
```

To switch back to SQLite for local dev:

```bash
# Manually edit prisma/schema.prisma:
#   change "postgresql" back to "sqlite"
# Set DATABASE_URL="file:./db/custom.db"
# npx prisma db push
```

## Troubleshooting

### Build fails with "Prisma Client not found"

The `postinstall` script runs `prisma generate`. If it fails, check:
1. `DATABASE_URL` is set in Vercel env vars
2. `prisma/schema.prisma` uses `provider = "postgresql"` (not sqlite)
3. The Postgres connection string is valid

### API routes return 401 from CSPR.cloud

Make sure `CSPR_CLOUD_AUTH_TOKEN` is set in Vercel env vars. The API
routes in `src/app/api/skywee/deploys/*/route.ts` read this env var
and inject it as `Authorization: Bearer <token>` header.

### Database connection fails

Neon free tier has connection limits. If you see "too many connections":
1. Check Neon dashboard for active connections
2. Prisma uses connection pooling by default — should be fine
3. If issues persist, add `?connection_limit=5` to DATABASE_URL

### Deployed app shows empty pages (no data)

You need to seed the Postgres database:

```bash
# Set DATABASE_URL to your Vercel Postgres/Neon URL
export DATABASE_URL="postgresql://..."

# Run seed
bun run seed
```

Or connect Vercel to your Postgres provider and run the seed SQL directly.
