import { z } from "zod";

import { ORDER_STATUS_OPTIONS } from "@/lib/order-management";
import { PRODUCT_SIZE_OPTIONS } from "@/lib/product-catalog";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(60, "Keep the name under 60 characters."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .max(64, "Password is too long."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .max(64, "Password is too long."),
});

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters.")
    .max(120, "Product name is too long."),
  sku: z
    .string()
    .trim()
    .min(3, "SKU must be at least 3 characters.")
    .max(40, "SKU is too long.")
    .transform((value) => value.toUpperCase()),
  category: z
    .string()
    .trim()
    .min(2, "Category must be at least 2 characters.")
    .max(60, "Category is too long."),
  sizes: z
    .array(z.enum(PRODUCT_SIZE_OPTIONS))
    .min(1, "Select at least one size.")
    .max(PRODUCT_SIZE_OPTIONS.length),
  price: z
    .number()
    .refine((value) => Number.isFinite(value), "Price must be a valid number.")
    .positive("Price must be greater than zero.")
    .max(1000000, "Price is too large."),
  stockQuantity: z
    .number()
    .refine((value) => Number.isFinite(value), "Stock quantity must be a valid number.")
    .int("Stock quantity must be a whole number.")
    .min(0, "Stock quantity cannot be negative.")
    .max(1000000, "Stock quantity is too large."),
});

export const orderItemSchema = z.object({
  productId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Select a valid product."),
  size: z
    .string()
    .trim()
    .min(1, "Select a size.")
    .max(30, "Size is too long."),
  quantity: z
    .number()
    .refine((value) => Number.isFinite(value), "Quantity must be a valid number.")
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(1000000, "Quantity is too large."),
});

export const orderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(3, "Order number must be at least 3 characters.")
    .max(40, "Order number is too long.")
    .transform((value) => value.toUpperCase()),
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters.")
    .max(80, "Customer name is too long."),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Customer email is too long.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined)
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Enter a valid customer email address.",
    }),
  shippingAddress: z
    .string()
    .trim()
    .min(8, "Shipping address must be at least 8 characters.")
    .max(220, "Shipping address is too long."),
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  status: z.enum(ORDER_STATUS_OPTIONS),
  items: z
    .array(orderItemSchema)
    .min(1, "Add at least one order item.")
    .max(25, "An order cannot contain more than 25 items."),
});

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters.")
    .max(80, "Customer name is too long."),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits.")
    .max(20, "Phone number is too long.")
    .regex(/^\+?[0-9()\-\s]+$/, "Enter a valid phone number."),
  deliveryAddress: z
    .string()
    .trim()
    .min(8, "Delivery address must be at least 8 characters.")
    .max(220, "Delivery address is too long."),
});
