import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acquireLock, releaseLock, getIdempotencyCache, setIdempotencyCache } from "@/lib/redis";
import { CreateReservationSchema, RESERVATION_EXPIRY_MS } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        product: { select: { name: true, price: true, sku: true, imageUrl: true } },
        warehouse: { select: { name: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      reservations.map((r) => ({
        ...r,
        expiresAt: r.expiresAt.toISOString(),
        confirmedAt: r.confirmedAt?.toISOString() ?? null,
        releasedAt: r.releasedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/reservations error:", error);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // ── Idempotency check ──────────────────────────────────────────────────────
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const cached = await getIdempotencyCache(idempotencyKey);
    if (cached) return NextResponse.json(cached.response, { status: cached.statusCode });
  }

  // ── Validate body ──────────────────────────────────────────────────────────
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const parsed = CreateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { productId, warehouseId, quantity, customerEmail } = parsed.data;
  const lockKey = `stock:${productId}:${warehouseId}`;
  let lockValue: string | null = null;

  try {
    // ── Distributed lock ───────────────────────────────────────────────────
    lockValue = await acquireLock(lockKey, 8000);
    if (!lockValue) {
      return NextResponse.json(
        { error: "Another reservation is in progress. Please retry in a moment.", code: "LOCK_CONTENTION" },
        { status: 429 }
      );
    }

    // ── Step 1: Lazy expiry cleanup — OUTSIDE the transaction ──────────────
    // This can be slow (multiple queries); keep it out of the hot path.
    const now = new Date();
    const expiredForStock = await prisma.reservation.findMany({
      where: { productId, warehouseId, status: "PENDING", expiresAt: { lt: now } },
      select: { id: true, quantity: true },
    });

    if (expiredForStock.length > 0) {
      const totalExpiredQty = expiredForStock.reduce((sum, r) => sum + r.quantity, 0);
      // Run these two writes as a mini-transaction but outside the main one
      await prisma.$transaction([
        prisma.reservation.updateMany({
          where: { id: { in: expiredForStock.map((r) => r.id) } },
          data: { status: "EXPIRED", releasedAt: now },
        }),
        prisma.stock.updateMany({
          where: {
            productId,
            warehouseId,
            reserved: { gte: totalExpiredQty },
          },
          data: { reserved: { decrement: totalExpiredQty } },
        }),
      ]);
    }

    // ── Step 2: Atomic check-and-reserve — MINIMAL transaction ────────────
    // Only 3 operations: read stock, increment reserved, create reservation.
    const result = await prisma.$transaction(
      async (tx) => {
        const stock = await tx.stock.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
        });

        if (!stock) return { error: "Stock record not found", status: 404 };

        const available = stock.total - stock.reserved;
        if (available < quantity) {
          return { error: `Only ${available} unit(s) available`, available, status: 409 };
        }

        await tx.stock.update({
          where: { productId_warehouseId: { productId, warehouseId } },
          data: { reserved: { increment: quantity } },
        });

        const reservation = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            customerEmail,
            status: "PENDING",
            expiresAt: new Date(Date.now() + RESERVATION_EXPIRY_MS),
          },
          include: {
            product: { select: { name: true, price: true, sku: true, imageUrl: true } },
            warehouse: { select: { name: true, location: true } },
          },
        });

        return { reservation, status: 201 };
      },
      { timeout: 10000, maxWait: 10000 }
    );

    // ── Return ─────────────────────────────────────────────────────────────
    if ("error" in result) {
      const response = { error: result.error, available: (result as { available?: number }).available };
      if (idempotencyKey) await setIdempotencyCache(idempotencyKey, result.status!, response);
      return NextResponse.json(response, { status: result.status });
    }

    const { reservation } = result;
    const response = {
      ...reservation,
      expiresAt: reservation.expiresAt.toISOString(),
      confirmedAt: null,
      releasedAt: null,
      createdAt: reservation.createdAt.toISOString(),
    };

    if (idempotencyKey) await setIdempotencyCache(idempotencyKey, 201, response);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error("POST /api/reservations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    if (lockValue) await releaseLock(lockKey, lockValue);
  }
}
