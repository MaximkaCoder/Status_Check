import type { StatusItem as PrismaStatusItem } from "@prisma/client";

// Re-export Prisma's generated type as the canonical StatusItem shape.
// commentCount / unreadCount are injected by the items list API.
export type StatusItem = PrismaStatusItem & {
  commentCount?: number;
  unreadCount?: number;
};

// Shape returned by POST /api/ai/parse
export interface ParsedItem {
  title: string;
  description?: string;
  deadline?: string;
  project?: string;
  assignee?: string;
  reviewer?: string;
}
