import type { StatusItem as PrismaStatusItem } from "@prisma/client";

// Re-export Prisma's generated type as the canonical StatusItem shape.
export type StatusItem = PrismaStatusItem;

// Shape returned by POST /api/ai/parse
export interface ParsedItem {
  title: string;
  description?: string;
  deadline?: string; // ISO 8601 UTC string
}
