export type ReservationStatus = "PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED";

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  sku: string;
  stock: StockWithWarehouse[];
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface StockWithWarehouse {
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  total: number;
  reserved: number;
  available: number;
}

export interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  customerEmail: string | null;
  createdAt: string;
  product: {
    name: string;
    price: number;
    sku: string;
    imageUrl: string | null;
  };
  warehouse: {
    name: string;
    location: string;
  };
}

export interface ApiError {
  error: string;
  code?: string;
}
