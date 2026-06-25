import { z } from "zod";

export const StatusSchema = z.enum(["TO_CHECK", "EXPIRED", "DONE", "NOT_ACTUAL", "IDEAS_BACKLOG"]);
export type Status = z.infer<typeof StatusSchema>;

export const PrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const CreateItemSchema = z.object({
  title:        z.string().min(1, "title cannot be empty").max(200),
  description:  z.string().max(2000).optional(),
  deadline:     z.string().refine((v) => !isNaN(Date.parse(v)), { message: "invalid date" }).nullable().optional(),
  creator_name: z.string().min(1, "creator_name cannot be empty").max(100),
  project:      z.string().max(200).nullable().optional(),
  assignee:     z.string().max(100).nullable().optional(),
  reviewer:     z.string().max(100).nullable().optional(),
  priority:     PrioritySchema.optional(),
});
export type CreateItemInput = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  description:  z.string().max(2000).nullable().optional(),
  deadline:     z.string().refine((v) => !isNaN(Date.parse(v)), { message: "invalid date" }).nullable().optional(),
  status:       StatusSchema.optional(),
  creator_name: z.string().min(1).max(100).optional(),
  project:      z.string().max(200).nullable().optional(),
  assignee:     z.string().max(100).nullable().optional(),
  reviewer:     z.string().max(100).nullable().optional(),
  priority:     PrioritySchema.optional(),
});
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;

export const UpdateStatusSchema = z.object({ status: StatusSchema });
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const AIParseSchema = z.object({
  text: z.string().min(1).max(1000),
});
export type AIParseInput = z.infer<typeof AIParseSchema>;

export const GetItemsQuerySchema = z.object({
  status: z.string().optional(),
  month:  z.string().regex(/^\d{4}-\d{2}$/).optional(),
});
