import { notFound } from "next/navigation";
import Header from "@/components/ui/header";
import CheckoutClient from "./CheckoutClient";
import { Reservation } from "@/types";

async function getReservation(id: string): Promise<Reservation | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/reservations/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load reservation");
  return res.json();
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservation(id);

  if (!reservation) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <CheckoutClient reservation={reservation} />
      </main>
    </div>
  );
}
