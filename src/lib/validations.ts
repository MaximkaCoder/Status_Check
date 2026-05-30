import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared status enum
// ---------------------------------------------------------------------------
export const StatusSchema = z.enum(["PENDING", "IN_PROGRESS", "DONE", "OVERDUE"]);
export type Status = z.infer<typeof StatusSchema>;

// ---------------------------------------------------------------------------
// Create item — POST /api/items
// ---------------------------------------------------------------------------
export const CreateItemSchema = z.object({
  title: z
    .string()
    .min(1, "title cannot be empty")
    .max(200, "title must be 200 characters or fewer"),
  description: z.string().max(2000, "description must be 2000 characters or fewer").optional(),
  deadline: z
    .string()
    .min(1, "deadline is required")
    .refine((v) => !isNaN(Date.parse(v)), { message: "deadline must be a valid ISO 8601 date string" }),
  creator_name: z
    .string()
    .min(1, "creator_name cannot be empty")
    .max(100, "creator_name must be 100 characters or fewer"),
});
export type CreateItemInput = z.infer<typeof CreateItemSchema>;

// ---------------------------------------------------------------------------
// Update item — PUT /api/items/[id]
// ---------------------------------------------------------------------------
export const UpdateItemSchema = z.object({
  title: z.string().min(1, "title cannot be empty").max(200, "title must be 200 characters or fewer").optional(),
  description: z
    .string()
    .max(2000, "description must be 2000 characters or fewer")
    .nullable()
    .optional(),
  deadline: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: "deadline must be a valid ISO 8601 date string" })
    .optional(),
  status: StatusSchema.optional(),
  creator_name: z
    .string()
    .min(1, "creator_name cannot be empty")
    .max(100, "creator_name must be 100 characters or fewer")
    .optional(),
});
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

// ---------------------------------------------------------------------------
// Status-only update — PATCH /api/items/[id]/status
// ---------------------------------------------------------------------------
export const UpdateStatusSchema = z.object({
  status: StatusSchema,
});
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

// ---------------------------------------------------------------------------
// AI parse — POST /api/ai/parse
// ---------------------------------------------------------------------------
export const AIParseSchema = z.object({
  text: z
    .string()
    .min(1, "text cannot be empty")
    .max(1000, "text must be 1000 characters or fewer"),
});
export type AIParseInput = z.infer<typeof AIParseSchema>;

// ---------------------------------------------------------------------------
// Query params for GET /api/items
// ---------------------------------------------------------------------------
export const GetItemsQuerySchema = z.object({
  status: z.string().optional(), // comma-separated Status values
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be in YYYY-MM format")
    .optional(),
});
