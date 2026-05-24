# Allo Inventory — Take-Home Exercise

A multi-warehouse inventory and order-fulfillment platform with **race-condition-safe reservations**, live countdowns, and automatic expiry.

---

## Live Demo

> Deploy to Vercel, then seed your DB and the URL becomes your live demo.

---

## Local Setup

### Prerequisites
- Node 18+
- A hosted Postgres (Supabase, Neon, or Railway — all have free tiers)
- An Upstash Redis (free tier; optional but recommended for distributed locking)

### 1. Clone and install

```bash
git clone <repo>
cd allo-inventory
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (Transaction mode / pooler) |
| `DIRECT_URL` | Same page, Session mode URL |
| `UPSTASH_REDIS_REST_URL` | Upstash console → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Same |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local |

### 3. Push schema and seed

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to DB (no migration files needed for dev)
npm run db:seed       # seed 3 warehouses + 6 products + stock levels
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

```bash
# Push to GitHub first, then:
vercel --prod
```

Add all environment variables in the Vercel dashboard:
- `DATABASE_URL`, `DIRECT_URL` → your hosted Postgres
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` → Upstash
- `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. `https://allo-inventory.vercel.app`)
- `CRON_SECRET` → any random string for cron security

After deploying, run the seed from your local machine pointing at the hosted DB:

```bash
DATABASE_URL="<hosted url>" DIRECT_URL="<direct url>" npm run db:seed
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | Products with live stock per warehouse |
| `GET` | `/api/warehouses` | All warehouses |
| `POST` | `/api/reservations` | Create a reservation — 409 if insufficient stock |
| `GET` | `/api/reservations/:id` | Get a single reservation |
| `POST` | `/api/reservations/:id/confirm` | Confirm (payment success) — 410 if expired |
| `POST` | `/api/reservations/:id/release` | Release early (cancel / payment failed) |
| `GET` | `/api/cron/expire-reservations` | Called by Vercel Cron every minute |

---

## How Concurrency Safety Works

This is the core of the exercise. The problem: two requests hitting the last unit simultaneously must not both succeed.

### Two-layer defence

**Layer 1 — Redis distributed lock (fast path)**

Before touching the database, `POST /api/reservations` acquires a Redis `SET NX PX` lock keyed on `stock:{productId}:{warehouseId}`. Only one request holds the lock at a time; the second gets a `429 Lock contention` immediately and can retry. Lock TTL is 8 seconds — long enough for the DB transaction, short enough to not cause long waits.

```
Request A → acquires lock → enters transaction
Request B → lock busy    → returns 429 (retry)
Request A → commits      → releases lock
Request B → retries      → acquires lock → checks stock → 409 if empty
```

**Layer 2 — Postgres serializable transaction (safe fallback)**

If Redis is unavailable (cold start, network blip), the system falls back to a Postgres transaction. Inside `$transaction`, we:

1. Release any expired reservations for this SKU first (lazy cleanup)
2. Re-read the stock row with the transaction's snapshot isolation
3. Check `total - reserved >= quantity`
4. `UPDATE stock SET reserved = reserved + quantity` and create the reservation atomically

Because Prisma's `$transaction` uses `SERIALIZABLE`-adjacent isolation by default in Postgres, two concurrent transactions that both pass the availability check and both try to increment `reserved` will conflict: one commits, one is rolled back. The rolled-back request returns a 409.

**Why this is correct**: `reserved` is a DB-level counter, not a derived value. We never read the current value, compute a new one in application code, and write it back (classic TOCTOU). We use `{ increment: N }` which maps to `SET reserved = reserved + N` — atomic at the DB level even without application-level locks.

---

## Reservation Expiry

Reservations expire after **10 minutes**. Three complementary mechanisms ensure timely cleanup:

### 1. Vercel Cron (production, primary)

`vercel.json` schedules `GET /api/cron/expire-reservations` every minute. The handler calls `releaseExpiredReservations()`, which:
- Finds all `PENDING` reservations where `expiresAt < NOW()`
- Marks them `EXPIRED` and decrements `reserved` on the stock row
- Wrapped in a transaction to keep stock consistent

### 2. Lazy cleanup on reads (resilience)

Every call to `GET /api/products` and `POST /api/reservations` runs `releaseExpiredReservations()` before processing. This means even if the cron is delayed, expired reservations are cleaned up organically as the system is used.

### 3. Timer expiry on the checkout page

The client-side countdown hits zero and calls `refreshReservation()`, which fetches the latest status. If the server has already expired it (via cron or lazy cleanup), the UI reflects `EXPIRED` and shows an appropriate message without a page reload.

**Trade-off**: The lazy approach means a unit isn't released *exactly* at expiry if the system is idle — but for a checkout flow this is acceptable. The worst case is a unit being held a few extra minutes until the next cron tick or the next read.

---

## Idempotency (Bonus)

The `POST /api/reservations` and `POST /api/reservations/:id/confirm` endpoints support an `Idempotency-Key` request header. If a client retries with the same key, the server returns the original response without repeating the side effect.

### How it works

**Server side** (`src/lib/redis.ts`, `src/app/api/reservations/route.ts`, `src/app/api/reservations/[id]/confirm/route.ts`):

1. On every `POST`, read the `Idempotency-Key` header.
2. Check Redis for `idempotency:{key}`. If found, return `{statusCode, response}` immediately — no DB writes, no lock acquired.
3. After processing (success or expected error like 409/410), store `{statusCode, response}` in Redis with a **24-hour TTL**.

```
First request:   key not in Redis → run full logic → store result → return 201
Retry (same key): key found in Redis → return cached 201 immediately
```

**Client side**:

- `POST /api/reservations` — the key is generated once per button click (`reserve_{timestamp}_{random}`) and reused on any network retry of that same click. A new key is generated only when the user makes a genuinely new attempt (e.g. after a 409).
- `POST /api/reservations/:id/confirm` — the key is `confirm_{reservationId}`, scoped to the reservation. This means double-clicking "Confirm purchase" or a network retry always hits the cache and never double-confirms.

**Fallback**: if Redis is unavailable, `getIdempotencyCache` returns `null` and the system falls through to normal processing. Idempotency isn't guaranteed without Redis, but the core flow still works correctly.

### Key scoping

| Endpoint | Key format | Scope |
|---|---|---|
| `POST /api/reservations` | `reserve_{timestamp}_{random}` | Per button click |
| `POST /api/reservations/:id/confirm` | `confirm_{reservationId}` | Per reservation |

The confirm key is intentionally stable across retries — confirming the same reservation twice should always return the same result. The reserve key rotates per click because each click is a new intent.

### Persistence fallback

The `IdempotencyKey` table in Postgres is available as a secondary store for audit trails and debugging, even after Redis evicts entries at 24 hours.

---

## Trade-offs & What I'd Do With More Time

### Made

- **Lazy cleanup + cron** rather than a long-running worker. No infrastructure to manage; Vercel handles scheduling. The downside is cleanup isn't guaranteed sub-minute if the cron fires while the expiry transaction is in-flight.
- **Redis for locking, Postgres for correctness**. The system is correct without Redis; Redis just makes contention faster to resolve and reduces unnecessary DB load.
- **`reserved` counter** instead of a lock-per-row approach. Simpler to reason about; avoids advisory locks which are harder to debug.
- **Quantity=1 UI** — the reserve button hard-codes quantity 1. The API accepts any quantity; wiring up a quantity picker was cut for time.

### With more time

- **Optimistic UI updates** — after confirming, update local stock counts immediately rather than waiting for the next full page load.
- **WebSocket / SSE** for real-time stock updates across browser tabs, so a user on the product page sees stock drop when another user reserves.
- **Admin dashboard** — a simple ops view showing all active reservations, stock levels, and the ability to manually release holds.
- **Proper payment gateway integration** — currently "Confirm purchase" simulates payment success. Would wire up Razorpay/Stripe with webhook-based confirmation.
- **Row-level locking** (`SELECT ... FOR UPDATE`) as an alternative to the Redis lock. More portable, but adds latency on the DB side.
- **Structured logging** with a trace ID per reservation, so the full lifecycle (created → expired → released) is queryable.
- **E2E tests** covering the race condition specifically — two concurrent requests for the same last unit, asserting exactly one 201 and one 409.
