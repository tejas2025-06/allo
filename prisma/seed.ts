import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.idempotencyKey.deleteMany();

  // Create warehouses
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        id: "wh_mumbai",
        name: "Mumbai Central",
        location: "Mumbai, Maharashtra",
      },
    }),
    prisma.warehouse.create({
      data: {
        id: "wh_delhi",
        name: "Delhi North Hub",
        location: "New Delhi, Delhi",
      },
    }),
    prisma.warehouse.create({
      data: {
        id: "wh_bangalore",
        name: "Bangalore Tech Park",
        location: "Bangalore, Karnataka",
      },
    }),
  ]);

  console.log(`✅ Created ${warehouses.length} warehouses`);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: "prod_001",
        name: "Wireless Noise-Cancelling Headphones",
        description:
          "Premium over-ear headphones with 40-hour battery life, adaptive ANC, and spatial audio support.",
        price: 24999,
        sku: "WNC-HP-001",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_002",
        name: "Mechanical Keyboard TKL",
        description:
          "Tenkeyless mechanical keyboard with Cherry MX switches, per-key RGB, and aluminum chassis.",
        price: 8999,
        sku: "MCH-KB-TKL",
        imageUrl:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_003",
        name: "4K Webcam Pro",
        description:
          "4K 60fps webcam with auto-framing, HDR, and dual noise-cancelling microphones.",
        price: 12499,
        sku: "4K-WC-PRO",
        imageUrl:
          "https://images.unsplash.com/photo-1623949556303-b0d17d198bcf?w=600&q=80",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_004",
        name: "USB-C Docking Station",
        description:
          "12-in-1 USB-C hub with dual 4K HDMI, 100W PD, Ethernet, and SD card reader.",
        price: 6499,
        sku: "USBC-DOCK-12",
        imageUrl:
          "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=600&q=80",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_005",
        name: "Ergonomic Mouse",
        description:
          "Vertical ergonomic mouse with 8 programmable buttons, 4000 DPI, and silent clicks.",
        price: 3299,
        sku: "ERG-MS-V1",
        imageUrl:
          "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
      },
    }),
    prisma.product.create({
      data: {
        id: "prod_006",
        name: "LED Desk Lamp",
        description:
          "Smart LED desk lamp with wireless charging base, colour temperature control, and app support.",
        price: 4599,
        sku: "LED-LAMP-S1",
        imageUrl:
          "https://images.unsplash.com/photo-1513506003901-1e6a35f0c4e8?w=600&q=80",
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create stock levels
  const stockData = [
    // Headphones
    { productId: "prod_001", warehouseId: "wh_mumbai", total: 15, reserved: 0 },
    { productId: "prod_001", warehouseId: "wh_delhi", total: 8, reserved: 0 },
    { productId: "prod_001", warehouseId: "wh_bangalore", total: 3, reserved: 0 },
    // Keyboard
    { productId: "prod_002", warehouseId: "wh_mumbai", total: 25, reserved: 0 },
    { productId: "prod_002", warehouseId: "wh_delhi", total: 12, reserved: 0 },
    { productId: "prod_002", warehouseId: "wh_bangalore", total: 1, reserved: 0 },
    // Webcam
    { productId: "prod_003", warehouseId: "wh_mumbai", total: 10, reserved: 0 },
    { productId: "prod_003", warehouseId: "wh_delhi", total: 5, reserved: 0 },
    { productId: "prod_003", warehouseId: "wh_bangalore", total: 0, reserved: 0 },
    // Dock
    { productId: "prod_004", warehouseId: "wh_mumbai", total: 20, reserved: 0 },
    { productId: "prod_004", warehouseId: "wh_delhi", total: 7, reserved: 0 },
    { productId: "prod_004", warehouseId: "wh_bangalore", total: 4, reserved: 0 },
    // Mouse
    { productId: "prod_005", warehouseId: "wh_mumbai", total: 50, reserved: 0 },
    { productId: "prod_005", warehouseId: "wh_delhi", total: 30, reserved: 0 },
    { productId: "prod_005", warehouseId: "wh_bangalore", total: 2, reserved: 0 },
    // Lamp
    { productId: "prod_006", warehouseId: "wh_mumbai", total: 18, reserved: 0 },
    { productId: "prod_006", warehouseId: "wh_delhi", total: 9, reserved: 0 },
    { productId: "prod_006", warehouseId: "wh_bangalore", total: 0, reserved: 0 },
  ];

  await prisma.stock.createMany({ data: stockData });
  console.log(`✅ Created ${stockData.length} stock records`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
