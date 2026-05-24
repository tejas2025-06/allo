import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";
import ReservationsClient from "./ReservationsClient";

export const dynamic = "force-dynamic";

async function getData() {
  await releaseExpiredReservations();
  return prisma.reservation.findMany({
    include: {
      product: { select: { name: true, price: true, sku: true, imageUrl: true } },
      warehouse: { select: { name: true, location: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function ReservationsPage() {
  const raw = await getData();

  const reservations = raw.map((r) => ({
    ...r,
    expiresAt:   r.expiresAt.toISOString(),
    confirmedAt: r.confirmedAt?.toISOString() ?? null,
    releasedAt:  r.releasedAt?.toISOString() ?? null,
    createdAt:   r.createdAt.toISOString(),
    updatedAt:   r.updatedAt.toISOString(),
  }));

  return <ReservationsClient reservations={reservations} />;
}
