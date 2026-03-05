import { z } from "zod";

export const repairSchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  deviceModel: z.string().trim().min(1, "Device model is required").max(100),
  issue: z.string().trim().min(1, "Issue description is required").max(500),
  estimatedCost: z.number({ invalid_type_error: "Enter a valid amount" }).min(0, "Cost must be at least ₹0"),
  status: z.enum(["received", "in-progress", "ready", "delivered"]),
});

export type RepairFormData = z.infer<typeof repairSchema>;

export const salesSchema = z
  .object({
    customerName: z.string().trim().min(1, "Name is required").max(100),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    itemName: z.string().trim().min(1, "Item name is required").max(200),
    totalAmount: z.number({ invalid_type_error: "Enter a valid amount" }).min(1, "Amount must be at least ₹1"),
    paymentMode: z.enum(["cash", "emi"]),
    downpayment: z.number().optional(),
    financeProvider: z.enum(["bajaj", "idfc", "tvs", "other"]).optional(),
  })
  .refine((d) => d.paymentMode !== "emi" || (d.downpayment ?? 0) > 0, { message: "Downpayment is required for EMI", path: ["downpayment"] })
  .refine((d) => d.paymentMode !== "emi" || !!d.financeProvider, { message: "Select a finance provider", path: ["financeProvider"] })
  .refine((d) => d.paymentMode !== "emi" || !d.downpayment || d.downpayment < d.totalAmount, { message: "Downpayment must be less than total", path: ["downpayment"] });

export type SalesFormData = z.infer<typeof salesSchema>;

export const statusOptions = [
  { value: "received", label: "Received" },
  { value: "in-progress", label: "Repairing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
] as const;

export const financeProviders = [
  { value: "bajaj", label: "Bajaj Finance" },
  { value: "idfc", label: "IDFC First" },
  { value: "tvs", label: "TVS Credit" },
  { value: "other", label: "Other" },
] as const;
