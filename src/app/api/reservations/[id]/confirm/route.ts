import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIdempotencyCache, setIdempotencyCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Idempotency
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const cached = await getIdempotencyCache(`confirm:${idempotencyKey}`);
    if (cached) {
      return NextResponse.json(cached.response, { status: cached.statusCode });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) return { error: "Reservation not found", status: 404 };
      if (reservation.status === "CONFIRMED") {
        return { reservation, status: 200 }; // idempotent: already confirmed
      }
      if (reservation.status === "RELEASED" || reservation.status === "EXPIRED") {
        return { error: "Reservation has already been released or expired", status: 410 };
      }
      if (new Date(reservation.expiresAt) < new Date()) {
        // Mark as expired and release stock
        await tx.reservation.update({
          where: { id },
          data: { status: "EXPIRED", releasedAt: new Date() },
        });
        await tx.stock.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: { reserved: { decrement: reservation.quantity } },
        });
        return { error: "Reservation has expired", status: 410 };
      }

      // Confirm: decrement actual total stock (stock is now permanently consumed)
      const confirmed = await tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: {
          product: { select: { name: true, price: true, sku: true, imageUrl: true } },
          warehouse: { select: { name: true, location: true } },
        },
      });

      // Decrement total stock and reserved simultaneously
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          total: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity },
        },
      });

      return { reservation: confirmed, status: 200 };
    });

    if ("error" in result) {
      const response = { error: result.error };
      if (idempotencyKey) await setIdempotencyCache(`confirm:${idempotencyKey}`, result.status!, response);
      return NextResponse.json(response, { status: result.status });
    }

    const { reservation } = result;
    const response = {
      ...reservation,
      expiresAt: reservation.expiresAt.toISOString(),
      confirmedAt: reservation.confirmedAt?.toISOString() ?? null,
      releasedAt: reservation.releasedAt?.toISOString() ?? null,
      createdAt: reservation.createdAt.toISOString(),
    };
    if (idempotencyKey) await setIdempotencyCache(`confirm:${idempotencyKey}`, 200, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/reservations/[id]/confirm error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
