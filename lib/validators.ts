import { z } from "zod";

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
