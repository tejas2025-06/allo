import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import { Package } from "lucide-react";

async function getProducts(): Promise<Product[]> {
  await releaseExpiredReservations();

  const products = await prisma.product.findMany({
    include: {
      stock: {
        include: { warehouse: true },
        orderBy: { warehouse: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    price: p.price,
    sku: p.sku,
    stock: p.stock.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      warehouseLocation: s.warehouse.location,
      total: s.total,
      reserved: s.reserved,
      available: Math.max(0, s.total - s.reserved),
    })),
  }));
}

export default async function ProductsGrid() {
  const products = await getProducts();

  if (products.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 12 }}>
        <div style={{ width: 52, height: 52, background: "var(--bg-elevated)", border: "1px solid var(--border-mid)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Package size={22} style={{ color: "var(--text-muted)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>No products found</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Run the seed script to populate data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
