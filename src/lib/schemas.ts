import { z } from "zod";

export const CreateReservationSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  customerEmail: z.string().email().optional(),
});

export const ConfirmReservationSchema = z.object({
  customerEmail: z.string().email().optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type ConfirmReservationInput = z.infer<typeof ConfirmReservationSchema>;

export const RESERVATION_EXPIRY_MINUTES = 10;
export const RESERVATION_EXPIRY_MS = RESERVATION_EXPIRY_MINUTES * 60 * 1000;
