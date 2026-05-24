import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CheckoutClient from "./CheckoutClient";
import { Reservation } from "@/types";

async function getReservation(id: string): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      product: { select: { name: true, price: true, sku: true, imageUrl: true } },
      warehouse: { select: { name: true, location: true } },
    },
  });

  if (!reservation) return null;

  return {
    ...reservation,
    expiresAt:   reservation.expiresAt.toISOString(),
    confirmedAt: reservation.confirmedAt?.toISOString() ?? null,
    releasedAt:  reservation.releasedAt?.toISOString() ?? null,
    createdAt:   reservation.createdAt.toISOString(),
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservation(id);

  if (!reservation) notFound();

  return <CheckoutClient reservation={reservation} />;
}
