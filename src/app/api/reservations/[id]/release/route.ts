import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation) return { error: "Reservation not found", status: 404 };
      if (reservation.status === "RELEASED" || reservation.status === "EXPIRED") {
        return { reservation, status: 200 }; // idempotent
      }
      if (reservation.status === "CONFIRMED") {
        return { error: "Cannot release a confirmed reservation", status: 400 };
      }

      const released = await tx.reservation.update({
        where: { id },
        data: { status: "RELEASED", releasedAt: new Date() },
        include: {
          product: { select: { name: true, price: true, sku: true, imageUrl: true } },
          warehouse: { select: { name: true, location: true } },
        },
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

      return { reservation: released, status: 200 };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { reservation } = result;
    return NextResponse.json({
      ...reservation,
      expiresAt: reservation.expiresAt.toISOString(),
      confirmedAt: reservation.confirmedAt?.toISOString() ?? null,
      releasedAt: reservation.releasedAt?.toISOString() ?? null,
      createdAt: reservation.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/reservations/[id]/release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
