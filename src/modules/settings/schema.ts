import { z } from "zod";

export const operationalSettingsDefaults = {
  renewalWindowDays: 7,
  lowQuotaThreshold: 3,
  bookingBufferHours: 0,
} as const;

export const operationalSettingsValueSchema = z.object({
  renewalWindowDays: z.number().int().min(1).max(30).optional(),
  lowQuotaThreshold: z.number().int().min(0).max(100).optional(),
  bookingBufferHours: z.number().int().min(0).max(12).optional(),
});

export const operationalSettingsSchema = z.object({
  renewalWindowDays: z.coerce.number().int().min(1).max(30),
  lowQuotaThreshold: z.coerce.number().int().min(0).max(100),
  bookingBufferHours: z.coerce.number().int().min(0).max(12),
});

export type OperationalSettings = typeof operationalSettingsDefaults;
