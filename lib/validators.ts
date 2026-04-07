import { z } from "zod";

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
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).default("STAFF"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .max(64, "Password is too long."),
});
