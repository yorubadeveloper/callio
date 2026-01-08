import { z } from "zod";

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone_number: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164)")
    .optional(),
  location: z.string().min(2, "Location must be at least 2 characters").optional(),
  timezone: z.string().optional(),
});

export const preferencesSchema = z.object({
  news_topic_1: z.string().optional().nullable(),
  news_topic_2: z.string().optional().nullable(),
  include_calendar: z.boolean().default(true),
  include_weather: z.boolean().default(true),
  include_news: z.boolean().default(true),
});

export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
