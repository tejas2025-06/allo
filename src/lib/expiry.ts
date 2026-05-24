import { prisma } from "./prisma";

/**
 * Releases all expired PENDING reservations and returns freed stock.
 * Uses sequential batch writes (no interactive transaction) to avoid P2028
 * timeouts on Neon's serverless Postgres.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const now = new Date();

  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
    select: { id: true, productId: true, warehouseId: true, quantity: true },
  });

  if (expired.length === 0) return 0;

  // Step 1: mark all expired reservations in one batch write
  await prisma.reservation.updateMany({
    where: { id: { in: expired.map((r) => r.id) } },
    data: { status: "EXPIRED", releasedAt: now },
  });

  // Step 2: decrement reserved per stock row — group by productId+warehouseId
  // to handle multiple expired reservations for the same SKU in one update
  const stockDeltas = new Map<string, { productId: string; warehouseId: string; qty: number }>();
  for (const r of expired) {
    const key = `${r.productId}:${r.warehouseId}`;
    const existing = stockDeltas.get(key);
    if (existing) {
      existing.qty += r.quantity;
    } else {
      stockDeltas.set(key, { productId: r.productId, warehouseId: r.warehouseId, qty: r.quantity });
    }
  }

  // Fire all stock updates in parallel — each is a simple atomic decrement
  await Promise.all(
    Array.from(stockDeltas.values()).map(({ productId, warehouseId, qty }) =>
      prisma.stock.updateMany({
        where: { productId, warehouseId, reserved: { gte: qty } },
        data: { reserved: { decrement: qty } },
      })
    )
  );

  return expired.length;
}

export function isExpired(expiresAt: Date | string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getTimeRemaining(expiresAt: Date | string): number {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}
