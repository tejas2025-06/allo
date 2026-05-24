import { Product } from "@/types";
import ProductCard from "./ProductCard";
import { Package } from "lucide-react";

async function getProducts(): Promise<Product[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
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
